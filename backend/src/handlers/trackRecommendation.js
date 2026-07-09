const { UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, serverError } = require('../utils/response');

/**
 * POST /recommendations/track
 * Track recommendation interactions (clicks and registrations).
 * Updates a counter on the event record for analytics.
 *
 * Body: { eventId, action: 'click' | 'register' }
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const body = JSON.parse(event.body || '{}');
    const { eventId, action } = body;

    if (!eventId || !action) return error('eventId and action are required');
    if (!['click', 'register'].includes(action)) return error('action must be "click" or "register"');

    const field = action === 'click' ? 'recommendationClicks' : 'recommendationRegistrations';

    await docClient.send(
      new UpdateCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId },
        UpdateExpression: `ADD ${field} :inc`,
        ExpressionAttributeValues: { ':inc': 1 },
      })
    );

    return success({ message: `Tracked ${action} for event ${eventId}` });
  } catch (err) {
    console.error('TrackRecommendation error:', err);
    return serverError('Failed to track recommendation');
  }
};
