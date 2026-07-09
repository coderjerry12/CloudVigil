const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, FEEDBACK_TABLE, EVENTS_TABLE, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, serverError } = require('../utils/response');
const { createNotification } = require('../utils/notifications');

/**
 * POST /feedback
 * Submit feedback for a completed/attended event.
 * Body: { eventId, rating (1-5), comment?, tags? }
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'attendee') return forbidden('Only attendees can submit feedback');

    const body = JSON.parse(event.body || '{}');
    const { eventId, rating, comment, tags } = body;

    if (!eventId) return error('eventId is required');
    if (!rating || rating < 1 || rating > 5) return error('Rating must be between 1 and 5');

    // Verify the event exists and is completed
    const eventResult = await docClient.send(
      new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId } })
    );
    if (!eventResult.Item) return error('Event not found');
    if (eventResult.Item.status !== 'COMPLETED') return error('You can only submit feedback for completed events');

    // Verify the attendee was registered and checked in
    const regResult = await docClient.send(
      new GetCommand({
        TableName: REGISTRATIONS_TABLE,
        Key: { eventId, attendeeId: user.userId },
      })
    );
    if (!regResult.Item) return error('You must be registered for this event to submit feedback');
    if (!regResult.Item.checkedIn) return error('You must have attended (checked in) this event to submit feedback');

    // Check if feedback already submitted
    const existingFeedback = await docClient.send(
      new GetCommand({
        TableName: FEEDBACK_TABLE,
        Key: { eventId, attendeeId: user.userId },
      })
    );
    if (existingFeedback.Item) return error('You have already submitted feedback for this event');

    const now = new Date().toISOString();
    const feedback = {
      eventId,
      attendeeId: user.userId,
      attendeeName: user.name,
      rating: Number(rating),
      comment: comment ? comment.trim().slice(0, 500) : '',
      tags: tags || [],
      eventTitle: eventResult.Item.title,
      eventCategory: eventResult.Item.category,
      submittedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: FEEDBACK_TABLE,
        Item: feedback,
      })
    );

    // Notify the organizer about new feedback
    try {
      await createNotification({
        recipientId: eventResult.Item.organizerId,
        recipientRole: 'organizer',
        type: 'FEEDBACK',
        title: '⭐ New Feedback Received',
        message: `${user.name} rated "${eventResult.Item.title}" ${rating}/5 stars.`,
        referenceId: eventId,
      });
    } catch (notifErr) {
      console.warn('Failed to send organizer notification:', notifErr);
    }

    // Notify the attendee (confirmation)
    try {
      await createNotification({
        recipientId: user.userId,
        recipientRole: 'attendee',
        type: 'FEEDBACK',
        title: '✅ Feedback Submitted',
        message: `Thanks for rating "${eventResult.Item.title}"! Your feedback helps improve future events.`,
        referenceId: eventId,
      });
    } catch (notifErr) {
      console.warn('Failed to send attendee notification:', notifErr);
    }

    return success({ feedback }, 201);
  } catch (err) {
    console.error('SubmitFeedback error:', err);
    return serverError('Failed to submit feedback');
  }
};
