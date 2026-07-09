const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * GET /registrations/my
 * Get all registrations for the current attendee.
 * Uses the attendeeId-index GSI.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const result = await docClient.send(
      new QueryCommand({
        TableName: REGISTRATIONS_TABLE,
        IndexName: 'attendeeId-index',
        KeyConditionExpression: 'attendeeId = :uid',
        ExpressionAttributeValues: {
          ':uid': user.userId,
        },
        ScanIndexForward: false, // newest first
      })
    );

    return success({
      registrations: result.Items || [],
      total: result.Count || 0,
    });
  } catch (err) {
    console.error('GetMyRegistrations error:', err);
    return serverError('Failed to fetch registrations');
  }
};
