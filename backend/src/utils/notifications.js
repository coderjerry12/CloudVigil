const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { docClient, NOTIFICATIONS_TABLE } = require('./dynamodb');

/**
 * Notification utility — creates notification records in DynamoDB.
 * Used by all modules (registration, safety, crowd monitoring) to store
 * notifications for the dashboard notification center.
 */

/**
 * Create a notification for a user.
 * @param {Object} params
 * @param {string} params.recipientId - User ID of the recipient
 * @param {string} params.recipientRole - 'organizer' or 'attendee'
 * @param {string} params.type - Notification type (REGISTRATION, SAFETY, CROWD, REMINDER, EVENT_UPDATE)
 * @param {string} params.title - Short notification title
 * @param {string} params.message - Notification body
 * @param {string} params.referenceId - Related entity ID (eventId, incidentId, etc.)
 * @param {string} [params.channel] - Delivery channel: 'dashboard', 'email', 'sms'
 */
async function createNotification({
  recipientId,
  recipientRole,
  type,
  title,
  message,
  referenceId,
  channel = 'dashboard',
}) {
  const now = new Date().toISOString();
  const notification = {
    notificationId: uuidv4(),
    recipientId,
    recipientRole,
    notificationType: type,
    title,
    message,
    deliveryChannel: channel,
    status: 'DELIVERED',
    referenceId: referenceId || null,
    createdAt: now,
    readAt: null,
  };

  await docClient.send(
    new PutCommand({
      TableName: NOTIFICATIONS_TABLE,
      Item: notification,
    })
  );

  return notification;
}

module.exports = { createNotification };
