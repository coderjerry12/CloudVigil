const { GetCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, notFound, forbidden, serverError } = require('../utils/response');
const { createNotification } = require('../utils/notifications');

/**
 * PUT /events/{eventId}
 * Update an event. Only the organizer who created it can update.
 * Cannot update COMPLETED or CANCELLED events.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can update events');

    const eventId = event.pathParameters?.eventId;
    if (!eventId) return notFound('Event ID is required');

    // Fetch existing event
    const existing = await docClient.send(
      new GetCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId },
      })
    );

    if (!existing.Item) return notFound('Event not found');
    if (existing.Item.organizerId !== user.userId) return forbidden('You can only edit your own events');
    if (existing.Item.status === 'COMPLETED') return error('Cannot edit completed events');
    if (existing.Item.status === 'CANCELLED') return error('Cannot edit cancelled events');

    const body = JSON.parse(event.body || '{}');
    const allowedFields = ['title', 'description', 'category', 'venue', 'eventDate', 'registrationDeadline', 'capacity', 'requirements', 'imageUrl', 'accessCode', 'waitlistEnabled', 'status', 'organiserDetails', 'trainerDetails'];

    // Build update expression dynamically
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = field === 'capacity' ? Number(body[field]) : body[field];
      }
    }

    // Always update updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      return error('No valid fields to update');
    }

    // Validate dates if provided
    if (body.eventDate && body.registrationDeadline) {
      if (new Date(body.registrationDeadline) >= new Date(body.eventDate)) {
        return error('Registration deadline must be before the event date');
      }
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    // Notify attendees if venue or date changed
    const importantFieldsChanged = body.venue || body.eventDate;
    if (importantFieldsChanged) {
      try {
        const regsResult = await docClient.send(
          new QueryCommand({
            TableName: REGISTRATIONS_TABLE,
            KeyConditionExpression: 'eventId = :eid',
            FilterExpression: '#status = :confirmed',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':eid': eventId, ':confirmed': 'CONFIRMED' },
          })
        );

        const changes = [];
        if (body.venue) changes.push(`Venue: ${body.venue}`);
        if (body.eventDate) changes.push(`Date: ${new Date(body.eventDate).toLocaleDateString()}`);

        for (const reg of regsResult.Items || []) {
          await createNotification({
            recipientId: reg.attendeeId,
            recipientRole: 'attendee',
            type: 'EVENT_UPDATE',
            title: 'Event Updated',
            message: `"${existing.Item.title}" has been updated. Changes: ${changes.join(', ')}`,
            referenceId: eventId,
          });
        }
      } catch (notifErr) {
        console.warn('Failed to send update notifications:', notifErr);
      }
    }

    return success({ event: result.Attributes });
  } catch (err) {
    console.error('UpdateEvent error:', err);
    return serverError('Failed to update event');
  }
};
