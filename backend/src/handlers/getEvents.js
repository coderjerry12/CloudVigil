const { QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, serverError } = require('../utils/response');

/**
 * GET /events
 * Query params:
 *   scope=organizer — returns current user's events (uses organizerId-index)
 *   scope=browse — returns UPCOMING and ONGOING events (uses status-eventDate-index)
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const scope = event.queryStringParameters?.scope || 'browse';

    if (scope === 'organizer') {
      // Get organizer's own events
      if (user.role !== 'organizer') return forbidden('Only organizers can access this scope');

      const result = await docClient.send(
        new QueryCommand({
          TableName: EVENTS_TABLE,
          IndexName: 'organizerId-index',
          KeyConditionExpression: 'organizerId = :orgId',
          ExpressionAttributeValues: {
            ':orgId': user.userId,
          },
          ScanIndexForward: false, // newest first
        })
      );

      return success({
        events: result.Items || [],
        total: result.Count || 0,
      });
    }

    if (scope === 'browse') {
      // Get UPCOMING events
      const upcomingResult = await docClient.send(
        new QueryCommand({
          TableName: EVENTS_TABLE,
          IndexName: 'status-eventDate-index',
          KeyConditionExpression: '#status = :upcoming',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':upcoming': 'UPCOMING' },
          ScanIndexForward: true, // earliest first
        })
      );

      // Get ONGOING events
      const ongoingResult = await docClient.send(
        new QueryCommand({
          TableName: EVENTS_TABLE,
          IndexName: 'status-eventDate-index',
          KeyConditionExpression: '#status = :ongoing',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':ongoing': 'ONGOING' },
          ScanIndexForward: true,
        })
      );

      const events = [
        ...(upcomingResult.Items || []),
        ...(ongoingResult.Items || []),
      ];

      return success({
        events,
        total: events.length,
      });
    }

    return error('Invalid scope. Use scope=organizer or scope=browse');
  } catch (err) {
    console.error('GetEvents error:', err);
    return serverError('Failed to fetch events');
  }
};
