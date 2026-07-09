const { QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, REGISTRATIONS_TABLE, EVENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, notFound, serverError } = require('../utils/response');

/**
 * GET /events/{eventId}/registrations
 * Get all registrations for an event. Only the event organizer can view this.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can view event registrations');

    const eventId = event.pathParameters?.eventId;
    if (!eventId) return notFound('Event ID is required');

    // Verify the user owns this event
    const eventResult = await docClient.send(
      new GetCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId },
      })
    );

    if (!eventResult.Item) return notFound('Event not found');
    if (eventResult.Item.organizerId !== user.userId) {
      return forbidden('You can only view registrations for your own events');
    }

    // Get all registrations for this event
    const result = await docClient.send(
      new QueryCommand({
        TableName: REGISTRATIONS_TABLE,
        KeyConditionExpression: 'eventId = :eid',
        ExpressionAttributeValues: {
          ':eid': eventId,
        },
        ScanIndexForward: false,
      })
    );

    return success({
      registrations: result.Items || [],
      total: result.Count || 0,
      event: {
        eventId: eventResult.Item.eventId,
        title: eventResult.Item.title,
        capacity: eventResult.Item.capacity,
        registeredCount: eventResult.Item.registeredCount,
      },
    });
  } catch (err) {
    console.error('GetEventRegistrations error:', err);
    return serverError('Failed to fetch event registrations');
  }
};
