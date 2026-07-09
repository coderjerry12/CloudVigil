const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { createNotification } = require('../utils/notifications');

/**
 * Event Reminder Lambda — Triggered by EventBridge every 30 minutes.
 *
 * Checks for:
 * - Events starting in ~24 hours → sends 24h reminder
 * - Events starting in ~1 hour → sends 1h reminder
 *
 * Uses time windows to avoid duplicate reminders:
 * - 24h: events between 23.5h and 24.5h from now
 * - 1h: events between 0.5h and 1.5h from now
 */
exports.handler = async () => {
  const now = new Date();
  let remindersSent = 0;

  try {
    // Get UPCOMING events
    const eventsResult = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'status-eventDate-index',
        KeyConditionExpression: '#status = :upcoming',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':upcoming': 'UPCOMING' },
      })
    );

    const events = eventsResult.Items || [];

    for (const event of events) {
      const eventTime = new Date(event.eventDate).getTime();
      const hoursUntilEvent = (eventTime - now.getTime()) / (1000 * 60 * 60);

      let reminderType = null;
      let reminderTitle = null;
      let reminderMessage = null;

      // 24-hour reminder window (23.5h to 24.5h)
      if (hoursUntilEvent >= 23.5 && hoursUntilEvent <= 24.5) {
        reminderType = 'REMINDER_24H';
        reminderTitle = 'Event Tomorrow';
        reminderMessage = `"${event.title}" starts tomorrow at ${new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Venue: ${event.venue}. Don't forget your QR ticket!`;
      }
      // 1-hour reminder window (0.5h to 1.5h)
      else if (hoursUntilEvent >= 0.5 && hoursUntilEvent <= 1.5) {
        reminderType = 'REMINDER_1H';
        reminderTitle = 'Event Starting Soon';
        reminderMessage = `"${event.title}" starts in about 1 hour at ${event.venue}. Have your QR ticket ready!`;
      }

      if (!reminderType) continue;

      // Get all confirmed registrations for this event
      const regsResult = await docClient.send(
        new QueryCommand({
          TableName: REGISTRATIONS_TABLE,
          KeyConditionExpression: 'eventId = :eid',
          FilterExpression: '#status = :confirmed',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':eid': event.eventId, ':confirmed': 'CONFIRMED' },
        })
      );

      for (const reg of regsResult.Items || []) {
        try {
          await createNotification({
            recipientId: reg.attendeeId,
            recipientRole: 'attendee',
            type: reminderType,
            title: reminderTitle,
            message: reminderMessage,
            referenceId: event.eventId,
          });
          remindersSent++;
        } catch (err) {
          console.warn(`Failed to send reminder to ${reg.attendeeId}:`, err);
        }
      }
    }

    console.log(`Reminders complete. ${remindersSent} reminders sent.`);
    return { statusCode: 200, body: JSON.stringify({ remindersSent }) };
  } catch (err) {
    console.error('SendReminders error:', err);
    throw err;
  }
};
