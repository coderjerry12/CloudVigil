const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, notFound, forbidden, serverError } = require('../utils/response');

/**
 * GET /events/{eventId}
 * Get a single event by ID. Any authenticated user can view.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const eventId = event.pathParameters?.eventId;
    if (!eventId) return notFound('Event ID is required');

    const result = await docClient.send(
      new GetCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId },
      })
    );

    if (!result.Item) {
      return notFound('Event not found');
    }

    return success({ event: result.Item });
  } catch (err) {
    console.error('GetEvent error:', err);
    return serverError('Failed to fetch event');
  }
};
