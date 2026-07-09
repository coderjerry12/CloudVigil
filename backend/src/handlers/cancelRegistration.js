const { GetCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, notFound, serverError } = require('../utils/response');
const { createNotification } = require('../utils/notifications');
const { sendRegistrationEmailWithQR } = require('../utils/ses');
const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({});
const SENDER_EMAIL = process.env.SES_SENDER_EMAIL || 'noreply@eventshield.ai';

/**
 * POST /registrations/cancel/{eventId}
 * Cancel an attendee's registration for an event.
 * - Sets registration status to CANCELLED
 * - Decrements event registeredCount (if was CONFIRMED)
 * - Auto-promotes the first waitlisted attendee to CONFIRMED
 * - Notifies relevant parties
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'attendee') return forbidden('Only attendees can cancel registrations');

    const eventId = event.pathParameters?.eventId;
    if (!eventId) return notFound('Event ID is required');

    // Fetch existing registration
    const regResult = await docClient.send(
      new GetCommand({
        TableName: REGISTRATIONS_TABLE,
        Key: { eventId, attendeeId: user.userId },
      })
    );

    if (!regResult.Item) return notFound('Registration not found');
    const currentStatus = regResult.Item.status;
    if (currentStatus === 'CANCELLED') return error('Registration is already cancelled');
    if (regResult.Item.checkedIn) return error('Cannot cancel — you have already checked in');

    // Update registration status to CANCELLED
    await docClient.send(
      new UpdateCommand({
        TableName: REGISTRATIONS_TABLE,
        Key: { eventId, attendeeId: user.userId },
        UpdateExpression: 'SET #status = :cancelled, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':cancelled': 'CANCELLED',
          ':now': new Date().toISOString(),
        },
      })
    );

    // Decrement registeredCount only if the cancelled person was CONFIRMED
    if (currentStatus === 'CONFIRMED') {
      await docClient.send(
        new UpdateCommand({
          TableName: EVENTS_TABLE,
          Key: { eventId },
          UpdateExpression: 'ADD registeredCount :dec',
          ExpressionAttributeValues: { ':dec': -1 },
        })
      );
    }

    // Fetch event details for notifications
    const eventResult = await docClient.send(
      new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId } })
    );
    const eventItem = eventResult.Item;

    // Notify the organizer
    try {
      if (eventItem) {
        await createNotification({
          recipientId: eventItem.organizerId,
          recipientRole: 'organizer',
          type: 'REGISTRATION_CANCELLED',
          title: '❌ Registration Cancelled',
          message: `${user.name} cancelled their registration for "${eventItem.title}".`,
          referenceId: eventId,
        });
      }
    } catch (notifErr) {
      console.warn('Failed to send cancellation notification:', notifErr);
    }

    // Notify the attendee
    try {
      await createNotification({
        recipientId: user.userId,
        recipientRole: 'attendee',
        type: 'REGISTRATION_CANCELLED',
        title: '🔔 Registration Cancelled',
        message: `Your registration for "${regResult.Item.eventTitle}" has been cancelled. Your QR ticket is no longer valid.`,
        referenceId: eventId,
      });
    } catch (notifErr) {
      console.warn('Failed to send attendee notification:', notifErr);
    }

    // Send cancellation email
    try {
      const senderEmail = (eventItem && eventItem.organizerEmail) || SENDER_EMAIL;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #EF4444; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">EventShield AI</h1>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #E0E0E0; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1A1A1A; margin-top: 0;">Registration Cancelled</h2>
            <p style="color: #5F6368;">Hi ${user.name},</p>
            <p style="color: #5F6368;">Your registration for the following event has been cancelled:</p>
            <div style="background: #FEE2E2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #EF4444;">
              <p style="margin: 4px 0;"><strong>Event:</strong> ${regResult.Item.eventTitle}</p>
              <p style="margin: 4px 0;"><strong>Venue:</strong> ${regResult.Item.venue}</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(regResult.Item.eventDate).toLocaleDateString()}</p>
            </div>
            <p style="color: #EF4444; font-weight: 600;">Your QR ticket is no longer valid for check-in.</p>
            <p style="color: #9E9E9E; font-size: 12px; margin-top: 24px;">This is an automated message from EventShield AI.</p>
          </div>
        </div>
      `;

      const boundary = `----=_Part_${Date.now()}`;
      const rawMessage = [
        `From: EventShield AI <${senderEmail}>`,
        `To: ${user.email}`,
        `Subject: Registration Cancelled: ${regResult.Item.eventTitle}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset=UTF-8`,
        ``,
        `Your registration for ${regResult.Item.eventTitle} has been cancelled.`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        html,
        ``,
        `--${boundary}--`,
      ].join('\r\n');

      await sesClient.send(new SendRawEmailCommand({ RawMessage: { Data: Buffer.from(rawMessage) } }));
    } catch (emailErr) {
      console.warn('Failed to send cancellation email:', emailErr.message);
    }

    // ===== AUTO-PROMOTE FROM WAITLIST =====
    // If the cancelled person was CONFIRMED, a spot opened up — promote the earliest waitlisted attendee
    if (currentStatus === 'CONFIRMED') {
      try {
        await promoteFromWaitlist(eventId, eventItem);
      } catch (promoteErr) {
        console.warn('Failed to promote from waitlist:', promoteErr);
      }
    }

    return success({ message: 'Registration cancelled successfully' });
  } catch (err) {
    console.error('CancelRegistration error:', err);
    return serverError('Failed to cancel registration');
  }
};

/**
 * Promote the earliest waitlisted attendee to CONFIRMED.
 * - Updates their registration status
 * - Increments event registeredCount
 * - Sends notification + email with QR
 */
async function promoteFromWaitlist(eventId, eventItem) {
  // Query all registrations for this event and find waitlisted ones
  const regsResult = await docClient.send(
    new QueryCommand({
      TableName: REGISTRATIONS_TABLE,
      KeyConditionExpression: 'eventId = :eid',
      ExpressionAttributeValues: { ':eid': eventId },
    })
  );

  const waitlisted = (regsResult.Items || [])
    .filter(r => r.status === 'WAITLISTED')
    .sort((a, b) => (a.waitlistedAt || a.registeredAt).localeCompare(b.waitlistedAt || b.registeredAt));

  if (waitlisted.length === 0) return; // No one waiting

  const promoted = waitlisted[0];
  const now = new Date().toISOString();

  // Update to CONFIRMED
  await docClient.send(
    new UpdateCommand({
      TableName: REGISTRATIONS_TABLE,
      Key: { eventId, attendeeId: promoted.attendeeId },
      UpdateExpression: 'SET #status = :confirmed, promotedAt = :now, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':confirmed': 'CONFIRMED',
        ':now': now,
      },
    })
  );

  // Increment registeredCount
  await docClient.send(
    new UpdateCommand({
      TableName: EVENTS_TABLE,
      Key: { eventId },
      UpdateExpression: 'ADD registeredCount :inc',
      ExpressionAttributeValues: { ':inc': 1 },
    })
  );

  // Notify the promoted attendee
  await createNotification({
    recipientId: promoted.attendeeId,
    recipientRole: 'attendee',
    type: 'WAITLIST_PROMOTED',
    title: '🎉 Spot Available! You\'re In!',
    message: `A spot opened up for "${eventItem.title}". You've been promoted from the waitlist — your registration is now confirmed!`,
    referenceId: eventId,
  });

  // Send confirmation email with QR to promoted attendee
  try {
    await sendRegistrationEmailWithQR({
      to: promoted.attendeeEmail,
      from: (eventItem && eventItem.organizerEmail) || SENDER_EMAIL,
      attendeeName: promoted.attendeeName,
      eventTitle: eventItem.title,
      venue: eventItem.venue,
      eventDate: eventItem.eventDate,
      registrationId: promoted.registrationId,
      qrCodeData: promoted.qrCodeData,
    });
  } catch (emailErr) {
    console.warn('Failed to send promotion email:', emailErr.message);
  }

  console.log(`Promoted ${promoted.attendeeName} from waitlist for event ${eventId}`);
}
