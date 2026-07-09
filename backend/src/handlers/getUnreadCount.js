const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, NOTIFICATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * GET /notifications/unread-count
 * Get the count of unread notifications for badge display.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const result = await docClient.send(
      new QueryCommand({
        TableName: NOTIFICATIONS_TABLE,
        KeyConditionExpression: 'recipientId = :uid',
        FilterExpression: 'attribute_not_exists(readAt) OR readAt = :null',
        ExpressionAttributeValues: {
          ':uid': user.userId,
          ':null': null,
        },
        Select: 'COUNT',
      })
    );

    return success({ unreadCount: result.Count || 0 });
  } catch (err) {
    console.error('GetUnreadCount error:', err);
    return serverError('Failed to get unread count');
  }
};
