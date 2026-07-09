const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, notFound, serverError } = require('../utils/response');
const { createNotification } = require('../utils/notifications');

/**
 * POST /attendance/checkin
 * Process a QR code scan and mark attendance.
 *
 * Expected body (decoded from QR):
 * { registrationId, eventId, attendeeId }
 *
 * Business Rules:
 * - Only organizers can check in attendees
 * - Registration must exist and be CONFIRMED
 * - Event must not be CANCELLED
 * - Cannot check in twice (duplicate prevention)
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can check in attendees');

    const body = JSON.parse(event.body || '{}');
    const { registrationId, eventId, attendeeId } = body;

    if (!registrationId || !eventId || !attendeeId) {
      return error('Invalid QR code data. Required: registrationId, eventId, attendeeId');
    }

    // 1. Fetch the registration
    const regResult = await docClient.send(
      new GetCommand({
        TableName: REGISTRATIONS_TABLE,
        Key: { eventId, attendeeId },
      })
    );

    if (!regResult.Item) {
      return notFound('Registration not found. This QR code is invalid.');
    }

    const registration = regResult.Item;

    // 2. Validate registration ID matches
    if (registration.registrationId !== registrationId) {
      return error('QR code data mismatch. This ticket may be tampered with.');
    }

    // 3. Check registration status
    if (registration.status !== 'CONFIRMED') {
      return error(`Cannot check in. Registration status: ${registration.status}`);
    }

    // 4. Check for duplicate check-in
    if (registration.checkedIn) {
      return error(`Already checked in at ${new Date(registration.checkedInAt).toLocaleString()}`);
    }

    // 5. Validate event is not cancelled
    const eventResult = await docClient.send(
      new GetCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId },
      })
    );

    if (!eventResult.Item) {
      return notFound('Event not found');
    }

    if (eventResult.Item.status === 'CANCELLED') {
      return error('Cannot check in. This event has been cancelled.');
    }

    // 6. Verify organizer owns this event
    if (eventResult.Item.organizerId !== user.userId) {
      return forbidden('You can only check in attendees for your own events');
    }

    // 7. Mark attendance — atomic conditional update
    const now = new Date().toISOString();
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: REGISTRATIONS_TABLE,
        Key: { eventId, attendeeId },
        UpdateExpression: 'SET checkedIn = :true, checkedInAt = :now, checkedInBy = :organizer',
        ConditionExpression: 'checkedIn = :false',
        ExpressionAttributeValues: {
          ':true': true,
          ':false': false,
          ':now': now,
          ':organizer': user.name,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    // Notify the attendee about successful check-in
    try {
      await createNotification({
        recipientId: attendeeId,
        recipientRole: 'attendee',
        type: 'CHECKIN',
        title: '✅ Check-in Confirmed',
        message: `You've been checked in to "${updateResult.Attributes.eventTitle}". Enjoy the event!`,
        referenceId: eventId,
      });
    } catch (notifErr) {
      console.warn('Failed to send check-in notification:', notifErr);
    }

    return success({
      message: 'Check-in successful',
      attendance: {
        registrationId: updateResult.Attributes.registrationId,
        eventId: updateResult.Attributes.eventId,
        attendeeId: updateResult.Attributes.attendeeId,
        attendeeName: updateResult.Attributes.attendeeName,
        attendeeEmail: updateResult.Attributes.attendeeEmail,
        eventTitle: updateResult.Attributes.eventTitle,
        checkedIn: true,
        checkedInAt: now,
        checkedInBy: user.name,
      },
    });
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return error('Already checked in (concurrent request).');
    }
    console.error('ProcessCheckin error:', err);
    return serverError('Failed to process check-in');
  }
};
