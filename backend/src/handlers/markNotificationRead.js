const { QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, NOTIFICATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, notFound, serverError } = require('../utils/response');

/**
 * PATCH /notifications/{notificationId}/read
 * Mark a notification as read.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const notificationId = event.pathParameters?.notificationId;
    if (!notificationId) return notFound('Notification ID is required');

    // Find the notification (we need the sort key: createdAt)
    const queryResult = await docClient.send(
      new QueryCommand({
        TableName: NOTIFICATIONS_TABLE,
        KeyConditionExpression: 'recipientId = :uid',
        FilterExpression: 'notificationId = :nid',
        ExpressionAttributeValues: {
          ':uid': user.userId,
          ':nid': notificationId,
        },
      })
    );

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return notFound('Notification not found');
    }

    const notification = queryResult.Items[0];

    // Update readAt
    await docClient.send(
      new UpdateCommand({
        TableName: NOTIFICATIONS_TABLE,
        Key: { recipientId: user.userId, createdAt: notification.createdAt },
        UpdateExpression: 'SET readAt = :now',
        ExpressionAttributeValues: { ':now': new Date().toISOString() },
      })
    );

    return success({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('MarkNotificationRead error:', err);
    return serverError('Failed to update notification');
  }
};
