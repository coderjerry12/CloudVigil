const { QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, FEEDBACK_TABLE, REGISTRATIONS_TABLE, EVENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * GET /feedback/my
 * Get attendee's submitted feedback + events pending feedback.
 *
 * Pending feedback criteria:
 * - Attendee is registered (CONFIRMED)
 * - Attendee has checked in
 * - Event status is COMPLETED
 * - Feedback not yet submitted
 *
 * Returns:
 *   - submitted: feedback already given
 *   - pending: completed events attended but not yet reviewed
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'attendee') return forbidden('Only attendees can view their feedback');

    // 1. Get user's registrations
    const regsResult = await docClient.send(
      new QueryCommand({
        TableName: REGISTRATIONS_TABLE,
        IndexName: 'attendeeId-index',
        KeyConditionExpression: 'attendeeId = :uid',
        ExpressionAttributeValues: { ':uid': user.userId },
      })
    );
    const registrations = regsResult.Items || [];

    // Only consider checked-in registrations
    const checkedInRegs = registrations.filter(r => r.status === 'CONFIRMED' && r.checkedIn);

    // 2. For each checked-in registration, verify the event is COMPLETED
    const submittedFeedback = [];
    const pendingEvents = [];

    for (const reg of checkedInRegs) {
      try {
        // Check event status
        const eventResult = await docClient.send(
          new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId: reg.eventId } })
        );

        // Only show as pending if event is COMPLETED
        if (!eventResult.Item || eventResult.Item.status !== 'COMPLETED') {
          continue;
        }

        // Check if feedback already submitted
        const fbResult = await docClient.send(
          new QueryCommand({
            TableName: FEEDBACK_TABLE,
            KeyConditionExpression: 'eventId = :eid AND attendeeId = :aid',
            ExpressionAttributeValues: {
              ':eid': reg.eventId,
              ':aid': user.userId,
            },
          })
        );

        if (fbResult.Items && fbResult.Items.length > 0) {
          submittedFeedback.push(fbResult.Items[0]);
        } else {
          pendingEvents.push({
            eventId: reg.eventId,
            eventTitle: reg.eventTitle || eventResult.Item.title,
            eventDate: reg.eventDate || eventResult.Item.eventDate,
            venue: reg.venue || eventResult.Item.venue,
          });
        }
      } catch {
        // Skip if individual query fails
      }
    }

    return success({
      submitted: submittedFeedback,
      pending: pendingEvents,
      totalSubmitted: submittedFeedback.length,
      totalPending: pendingEvents.length,
    });
  } catch (err) {
    console.error('GetMyFeedback error:', err);
    return serverError('Failed to fetch feedback');
  }
};
