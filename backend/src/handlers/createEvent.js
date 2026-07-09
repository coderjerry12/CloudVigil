const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { docClient, EVENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, serverError } = require('../utils/response');
const { createNotification } = require('../utils/notifications');

/**
 * POST /events
 * Create a new event. Only organizers can create events.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can create events');

    const body = JSON.parse(event.body || '{}');

    // Validation
    const { title, description, category, venue, eventDate, registrationDeadline, capacity, requirements, organiserDetails, trainerDetails } = body;

    if (!title || !description || !category || !venue || !eventDate || !registrationDeadline || !capacity) {
      return error('Missing required fields: title, description, category, venue, eventDate, registrationDeadline, capacity');
    }

    if (new Date(eventDate) <= new Date()) {
      return error('Event date must be in the future');
    }

    if (new Date(registrationDeadline) >= new Date(eventDate)) {
      return error('Registration deadline must be before the event date');
    }

    if (capacity < 1) {
      return error('Capacity must be at least 1');
    }

    const now = new Date().toISOString();
    const newEvent = {
      eventId: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      category,
      venue: venue.trim(),
      eventDate,
      registrationDeadline,
      capacity: Number(capacity),
      registeredCount: 0,
      tags: body.tags || [],
      requirements: requirements ? requirements.trim() : '',
      imageUrl: body.imageUrl || null,
      accessCode: body.accessCode || null,
      waitlistEnabled: body.waitlistEnabled !== undefined ? body.waitlistEnabled : true,
      sessions: body.sessions || [],
      organiserDetails: organiserDetails || null,
      trainerDetails: trainerDetails || null,
      organizerId: user.userId,
      organizerName: user.name,
      organizerEmail: user.email,
      status: 'UPCOMING',
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: EVENTS_TABLE,
        Item: newEvent,
      })
    );

    // Notify the organizer that event was created successfully
    try {
      await createNotification({
        recipientId: user.userId,
        recipientRole: 'organizer',
        type: 'EVENT_CREATED',
        title: '🎉 Event Created',
        message: `"${title}" has been created and is now open for registrations.`,
        referenceId: newEvent.eventId,
      });
    } catch (notifErr) {
      console.warn('Failed to send event creation notification:', notifErr);
    }

    return success({ event: newEvent }, 201);
  } catch (err) {
    console.error('CreateEvent error:', err);
    return serverError('Failed to create event');
  }
};
