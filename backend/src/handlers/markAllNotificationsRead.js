const { QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, NOTIFICATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * POST /notifications/read-all
 * Mark ALL notifications for the current user as read.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const now = new Date().toISOString();
    let markedCount = 0;
    let lastKey = undefined;

    // Paginate through all notifications for this user
    do {
      const result = await docClient.send(
        new QueryCommand({
          TableName: NOTIFICATIONS_TABLE,
          KeyConditionExpression: 'recipientId = :rid',
          FilterExpression: 'attribute_not_exists(readAt)',
          ExpressionAttributeValues: { ':rid': user.userId },
          ExclusiveStartKey: lastKey,
        })
      );

      // Batch update all unread to read
      for (const item of result.Items || []) {
        await docClient.send(
          new UpdateCommand({
            TableName: NOTIFICATIONS_TABLE,
            Key: { recipientId: item.recipientId, createdAt: item.createdAt },
            UpdateExpression: 'SET readAt = :now',
            ExpressionAttributeValues: { ':now': now },
          })
        );
        markedCount++;
      }

      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    return success({ message: `Marked ${markedCount} notifications as read`, markedCount });
  } catch (err) {
    console.error('MarkAllNotificationsRead error:', err);
    return serverError('Failed to mark notifications as read');
  }
};
