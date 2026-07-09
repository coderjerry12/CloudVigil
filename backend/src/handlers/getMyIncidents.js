const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, INCIDENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * GET /incidents/my
 * Get all incidents reported by the current attendee.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const result = await docClient.send(
      new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: 'attendeeId-index',
        KeyConditionExpression: 'attendeeId = :uid',
        ExpressionAttributeValues: { ':uid': user.userId },
        ScanIndexForward: false,
      })
    );

    return success({
      incidents: result.Items || [],
      total: result.Count || 0,
    });
  } catch (err) {
    console.error('GetMyIncidents error:', err);
    return serverError('Failed to fetch incidents');
  }
};
