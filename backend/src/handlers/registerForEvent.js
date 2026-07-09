const { PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, notFound, serverError } = require('../utils/response');
const { createNotification } = require('../utils/notifications');
const { sendRegistrationEmailWithQR } = require('../utils/ses');

/**
 * POST /registrations
 * Register an attendee for an event.
 *
 * Business Rules:
 * - Only attendees can register
 * - Cannot register twice for same event
 * - Cannot register for cancelled/completed events
 * - Cannot register after registration deadline
 * - If capacity is full → joins WAITLIST instead of being rejected
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'attendee') return forbidden('Only attendees can register for events');

    const body = JSON.parse(event.body || '{}');
    const { eventId } = body;

    if (!eventId) return error('eventId is required');

    // 1. Fetch the event to validate
    const eventResult = await docClient.send(
      new GetCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId },
      })
    );

    const eventItem = eventResult.Item;
    if (!eventItem) return notFound('Event not found');

    // 2. Validate event status
    if (eventItem.status === 'CANCELLED') {
      return error('Cannot register for a cancelled event');
    }
    if (eventItem.status === 'COMPLETED') {
      return error('Cannot register for a completed event');
    }

    // 3. Validate registration deadline
    if (new Date(eventItem.registrationDeadline) < new Date()) {
      return error('Registration deadline has passed');
    }

    // 3.5 Validate access code (if event is restricted)
    if (eventItem.accessCode) {
      const { accessCode } = body;
      if (!accessCode || accessCode.trim().toUpperCase() !== eventItem.accessCode.trim().toUpperCase()) {
        return error('Invalid access code. This event requires a valid access code to register.');
      }
    }

    // 4. Check for duplicate registration
    const existingReg = await docClient.send(
      new GetCommand({
        TableName: REGISTRATIONS_TABLE,
        Key: { eventId, attendeeId: user.userId },
      })
    );

    if (existingReg.Item && existingReg.Item.status === 'CONFIRMED') {
      return error('You are already registered for this event');
    }
    if (existingReg.Item && existingReg.Item.status === 'WAITLISTED') {
      return error('You are already on the waitlist for this event');
    }

    // 5. Determine if capacity is full → WAITLIST or CONFIRMED
    const isFull = eventItem.registeredCount >= eventItem.capacity;
    const waitlistEnabled = eventItem.waitlistEnabled !== false; // default true
    
    if (isFull && !waitlistEnabled) {
      return error('Event is at full capacity and waitlist is not enabled');
    }
    
    const status = isFull ? 'WAITLISTED' : 'CONFIRMED';

    // 6. Create registration
    const now = new Date().toISOString();
    const registrationId = existingReg.Item ? existingReg.Item.registrationId : uuidv4();

    const qrCodeData = JSON.stringify({
      registrationId,
      eventId,
      attendeeId: user.userId,
      eventTitle: eventItem.title,
      timestamp: now,
    });

    const registration = {
      eventId,
      attendeeId: user.userId,
      registrationId,
      attendeeName: user.name,
      attendeeEmail: user.email,
      eventTitle: eventItem.title,
      eventDate: eventItem.eventDate,
      venue: eventItem.venue,
      status,
      qrCodeData,
      checkedIn: false,
      checkedInAt: null,
      registeredAt: now,
      waitlistedAt: isFull ? now : null,
    };

    // 7. Write registration
    await docClient.send(
      new PutCommand({
        TableName: REGISTRATIONS_TABLE,
        Item: registration,
      })
    );

    // 8. If CONFIRMED, increment registeredCount
    if (status === 'CONFIRMED') {
      await docClient.send(
        new UpdateCommand({
          TableName: EVENTS_TABLE,
          Key: { eventId },
          UpdateExpression: 'ADD registeredCount :inc',
          ExpressionAttributeValues: { ':inc': 1 },
        })
      );
    }

    // 9. Notify the organizer
    try {
      const notifMessage = isFull
        ? `${user.name} joined the waitlist for "${eventItem.title}" (event is full).`
        : `${user.name} registered for "${eventItem.title}".`;
      await createNotification({
        recipientId: eventItem.organizerId,
        recipientRole: 'organizer',
        type: isFull ? 'WAITLIST' : 'REGISTRATION',
        title: isFull ? '📋 New Waitlist Entry' : '🎉 New Registration',
        message: notifMessage,
        referenceId: eventId,
      });
    } catch (notifErr) {
      console.warn('Failed to create notification:', notifErr);
    }

    // 10. Send email (only for confirmed registrations — waitlisted get a different email)
    if (status === 'CONFIRMED') {
      try {
        await sendRegistrationEmailWithQR({
          to: user.email,
          from: eventItem.organizerEmail || process.env.SES_SENDER_EMAIL,
          attendeeName: user.name,
          eventTitle: eventItem.title,
          venue: eventItem.venue,
          eventDate: eventItem.eventDate,
          registrationId,
          qrCodeData,
        });
      } catch (emailErr) {
        console.warn('Failed to send confirmation email:', emailErr);
      }
    } else {
      // Notify waitlisted attendee
      try {
        await createNotification({
          recipientId: user.userId,
          recipientRole: 'attendee',
          type: 'WAITLIST',
          title: '📋 Added to Waitlist',
          message: `"${eventItem.title}" is currently full. You've been added to the waitlist. We'll notify you if a spot opens up!`,
          referenceId: eventId,
        });
      } catch (notifErr) {
        console.warn('Failed to send waitlist notification:', notifErr);
      }
    }

    return success({ registration, waitlisted: isFull }, 201);
  } catch (err) {
    console.error('RegisterForEvent error:', err);
    return serverError('Failed to register for event');
  }
};
