const { QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE } = require('../utils/dynamodb');

/**
 * Auto-Complete Events Lambda — Triggered by EventBridge every 30 minutes.
 * 
 * Finds events with status UPCOMING whose eventDate has passed,
 * and automatically transitions them to COMPLETED.
 */
exports.handler = async () => {
  const now = new Date().toISOString();
  let completedCount = 0;

  try {
    // Find UPCOMING events whose date has passed
    const upcomingResult = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'status-eventDate-index',
        KeyConditionExpression: '#status = :upcoming AND eventDate < :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':upcoming': 'UPCOMING',
          ':now': now,
        },
      })
    );

    for (const event of upcomingResult.Items || []) {
      await docClient.send(
        new UpdateCommand({
          TableName: EVENTS_TABLE,
          Key: { eventId: event.eventId },
          UpdateExpression: 'SET #status = :completed, updatedAt = :now',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':completed': 'COMPLETED',
            ':now': now,
          },
        })
      );
      completedCount++;
    }

    // Also check ONGOING events
    const ongoingResult = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'status-eventDate-index',
        KeyConditionExpression: '#status = :ongoing AND eventDate < :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':ongoing': 'ONGOING',
          ':now': now,
        },
      })
    );

    for (const event of ongoingResult.Items || []) {
      await docClient.send(
        new UpdateCommand({
          TableName: EVENTS_TABLE,
          Key: { eventId: event.eventId },
          UpdateExpression: 'SET #status = :completed, updatedAt = :now',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':completed': 'COMPLETED',
            ':now': now,
          },
        })
      );
      completedCount++;
    }

    console.log(`Auto-completed ${completedCount} events.`);
    return { statusCode: 200, body: JSON.stringify({ completed: completedCount }) };
  } catch (err) {
    console.error('AutoCompleteEvents error:', err);
    throw err;
  }
};
