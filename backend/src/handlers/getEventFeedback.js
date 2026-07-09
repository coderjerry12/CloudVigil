const { QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, FEEDBACK_TABLE, EVENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, serverError } = require('../utils/response');

/**
 * GET /events/{eventId}/feedback
 * Get feedback for a specific event.
 * Organizers see all feedback for their events.
 * Attendees see aggregate stats only.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const eventId = event.pathParameters?.eventId;
    if (!eventId) return error('eventId is required');

    // Verify event exists and check ownership
    const eventResult = await docClient.send(
      new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId } })
    );
    if (!eventResult.Item) return error('Event not found');

    const isOwner = user.role === 'organizer' && eventResult.Item.organizerId === user.userId;

    // Fetch all feedback for this event
    const feedbackResult = await docClient.send(
      new QueryCommand({
        TableName: FEEDBACK_TABLE,
        KeyConditionExpression: 'eventId = :eid',
        ExpressionAttributeValues: { ':eid': eventId },
      })
    );

    const feedbackItems = feedbackResult.Items || [];

    // Calculate aggregate stats
    const totalFeedback = feedbackItems.length;
    const avgRating = totalFeedback > 0
      ? Math.round((feedbackItems.reduce((sum, f) => sum + f.rating, 0) / totalFeedback) * 10) / 10
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackItems.forEach(f => {
      ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
    });

    const response = {
      eventId,
      eventTitle: eventResult.Item.title,
      totalFeedback,
      avgRating,
      ratingDistribution,
    };

    // Organizers get individual feedback comments too
    if (isOwner) {
      response.feedback = feedbackItems.map(f => ({
        attendeeName: f.attendeeName,
        rating: f.rating,
        comment: f.comment,
        tags: f.tags,
        submittedAt: f.submittedAt,
      }));
    }

    return success(response);
  } catch (err) {
    console.error('GetEventFeedback error:', err);
    return serverError('Failed to fetch feedback');
  }
};
