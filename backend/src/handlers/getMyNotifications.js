const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, NOTIFICATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * GET /notifications/my
 * Get all notifications for the current user (newest first).
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const limit = parseInt(event.queryStringParameters?.limit || '50', 10);

    const result = await docClient.send(
      new QueryCommand({
        TableName: NOTIFICATIONS_TABLE,
        KeyConditionExpression: 'recipientId = :uid',
        ExpressionAttributeValues: { ':uid': user.userId },
        ScanIndexForward: false, // newest first
        Limit: limit,
      })
    );

    return success({
      notifications: result.Items || [],
      total: result.Count || 0,
    });
  } catch (err) {
    console.error('GetMyNotifications error:', err);
    return serverError('Failed to fetch notifications');
  }
};
