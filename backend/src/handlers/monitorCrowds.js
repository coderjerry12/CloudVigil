const { QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE } = require('../utils/dynamodb');
const { createNotification } = require('../utils/notifications');

/**
 * Crowd Monitoring Lambda — Triggered by EventBridge every 5 minutes.
 *
 * Responsibilities:
 * - Fetch active events (UPCOMING/ONGOING)
 * - Calculate occupancy from registrations vs capacity
 * - Determine crowd status (NORMAL, WARNING, HIGH, CRITICAL)
 * - Update event with crowd metrics
 * - Send notifications for HIGH and CRITICAL
 *
 * Thresholds:
 *   <70% → NORMAL
 *   70-89% → WARNING
 *   90-99% → HIGH
 *   100% → CRITICAL
 */
exports.handler = async () => {
  try {
    // Get all UPCOMING and ONGOING events
    const upcomingResult = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'status-eventDate-index',
        KeyConditionExpression: '#status = :upcoming',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':upcoming': 'UPCOMING' },
      })
    );

    const ongoingResult = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'status-eventDate-index',
        KeyConditionExpression: '#status = :ongoing',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':ongoing': 'ONGOING' },
      })
    );

    const activeEvents = [
      ...(upcomingResult.Items || []),
      ...(ongoingResult.Items || []),
    ];

    const now = new Date().toISOString();
    let processedCount = 0;

    for (const event of activeEvents) {
      const { eventId, capacity, registeredCount, organizerId, title, crowdStatus: previousStatus } = event;

      // Calculate occupancy
      const count = registeredCount || 0;
      const occupancyPercentage = capacity > 0 ? Math.round((count / capacity) * 100) : 0;

      // Determine crowd status
      let crowdStatus = 'NORMAL';
      if (occupancyPercentage >= 100) {
        crowdStatus = 'CRITICAL';
      } else if (occupancyPercentage >= 90) {
        crowdStatus = 'HIGH';
      } else if (occupancyPercentage >= 70) {
        crowdStatus = 'WARNING';
      }

      // Update event with crowd metrics
      await docClient.send(
        new UpdateCommand({
          TableName: EVENTS_TABLE,
          Key: { eventId },
          UpdateExpression: 'SET crowdStatus = :cs, occupancyPercentage = :op, lastCrowdCheckAt = :now',
          ExpressionAttributeValues: {
            ':cs': crowdStatus,
            ':op': occupancyPercentage,
            ':now': now,
          },
        })
      );

      // Send notification if status escalated to HIGH or CRITICAL (and wasn't already)
      if (organizerId && (crowdStatus === 'HIGH' || crowdStatus === 'CRITICAL') && previousStatus !== crowdStatus) {
        try {
          await createNotification({
            recipientId: organizerId,
            recipientRole: 'organizer',
            type: 'CROWD_ALERT',
            title: crowdStatus === 'CRITICAL' ? '🚨 Capacity Critical' : '⚠️ High Occupancy',
            message: crowdStatus === 'CRITICAL'
              ? `"${title}" has reached maximum capacity (${occupancyPercentage}%). New registrations blocked.`
              : `"${title}" is at ${occupancyPercentage}% occupancy. Approaching maximum capacity.`,
            referenceId: eventId,
          });
        } catch (notifErr) {
          console.warn('Failed to send crowd notification:', notifErr);
        }
      }

      processedCount++;
    }

    console.log(`Crowd monitoring complete. ${processedCount} events processed.`);
    return { statusCode: 200, body: JSON.stringify({ processed: processedCount }) };
  } catch (err) {
    console.error('Crowd Monitoring error:', err);
    throw err;
  }
};
