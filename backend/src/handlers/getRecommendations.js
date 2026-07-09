const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * GET /recommendations
 * Personalized event recommendations for attendees.
 *
 * Algorithm:
 * 1. Fetch user's registration history
 * 2. Calculate category preference scores:
 *    - Registration: +3 points per category
 *    - Attended (checkedIn): +5 points per category
 *    - Check-in bonus: +2 points
 * 3. Fetch all UPCOMING events
 * 4. Filter out already-registered events
 * 5. Score each event by category match
 * 6. Sort by score, return top 5
 */

const REGISTRATION_WEIGHT = 3;
const ATTENDANCE_WEIGHT = 5;
const CHECKIN_BONUS = 2;

exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'attendee') return forbidden('Recommendations are for attendees only');

    // 1. Fetch user's registration history
    const regsResult = await docClient.send(
      new QueryCommand({
        TableName: REGISTRATIONS_TABLE,
        IndexName: 'attendeeId-index',
        KeyConditionExpression: 'attendeeId = :uid',
        ExpressionAttributeValues: { ':uid': user.userId },
      })
    );

    const userRegistrations = regsResult.Items || [];

    // 2. Calculate category preference scores
    const categoryScores = {};
    const registeredEventIds = new Set();

    for (const reg of userRegistrations) {
      registeredEventIds.add(reg.eventId);

      // Get category from the registration (stored as eventTitle — we need to look up the event)
      // For efficiency, we'll fetch events later and match. Store eventIds for now.
    }

    // Fetch event details for user's registrations to get categories
    // Since registrations store eventTitle but not category, we need to query events
    // Optimization: batch the lookup
    const userEventCategories = [];
    for (const reg of userRegistrations) {
      // Query the event to get its category
      const eventResult = await docClient.send(
        new QueryCommand({
          TableName: EVENTS_TABLE,
          KeyConditionExpression: 'eventId = :eid',
          ExpressionAttributeValues: { ':eid': reg.eventId },
          Limit: 1,
        })
      );

      if (eventResult.Items && eventResult.Items.length > 0) {
        const eventItem = eventResult.Items[0];
        const category = eventItem.category;
        if (category) {
          userEventCategories.push({
            category,
            tags: eventItem.tags || [],
            checkedIn: reg.checkedIn || false,
          });
        }
      }
    }

    // Calculate scores per category
    for (const entry of userEventCategories) {
      if (!categoryScores[entry.category]) {
        categoryScores[entry.category] = 0;
      }
      categoryScores[entry.category] += REGISTRATION_WEIGHT;
      if (entry.checkedIn) {
        categoryScores[entry.category] += ATTENDANCE_WEIGHT + CHECKIN_BONUS;
      }
      // Also score tags
      if (entry.tags && Array.isArray(entry.tags)) {
        for (const tag of entry.tags) {
          if (!categoryScores[`tag:${tag}`]) categoryScores[`tag:${tag}`] = 0;
          categoryScores[`tag:${tag}`] += REGISTRATION_WEIGHT;
          if (entry.checkedIn) categoryScores[`tag:${tag}`] += CHECKIN_BONUS;
        }
      }
    }

    // 3. Fetch all UPCOMING events
    const upcomingResult = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'status-eventDate-index',
        KeyConditionExpression: '#status = :upcoming',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':upcoming': 'UPCOMING' },
        ScanIndexForward: true,
      })
    );

    const upcomingEvents = upcomingResult.Items || [];

    // 4. Filter out already-registered events, full events, and events with past dates
    const now = new Date().toISOString();
    const candidateEvents = upcomingEvents.filter(
      e => !registeredEventIds.has(e.eventId) && e.registeredCount < e.capacity && e.eventDate > now
    );

    // 5. Score each event
    const scoredEvents = candidateEvents.map(event => {
      let score = 0;
      let reasons = [];

      // Category match
      if (event.category && categoryScores[event.category]) {
        score += categoryScores[event.category];
        reasons.push(`interest in ${event.category} events`);
      }

      // Tag matches
      if (event.tags && Array.isArray(event.tags)) {
        for (const tag of event.tags) {
          if (categoryScores[`tag:${tag}`]) {
            score += categoryScores[`tag:${tag}`];
            reasons.push(`${tag} tag`);
          }
        }
      }

      // Recency boost — events happening sooner get a small boost
      const daysUntilEvent = Math.max(1, (new Date(event.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilEvent <= 7) score += 3;
      else if (daysUntilEvent <= 14) score += 1;

      // Build reason string
      let reason = '';
      if (reasons.length > 0) {
        reason = `Based on your ${reasons.slice(0, 2).join(' and ')}`;
      } else {
        score = 1;
        reason = 'Explore something new';
      }

      return {
        eventId: event.eventId,
        title: event.title,
        description: event.description,
        category: event.category,
        tags: event.tags || [],
        venue: event.venue,
        eventDate: event.eventDate,
        registrationDeadline: event.registrationDeadline,
        capacity: event.capacity,
        registeredCount: event.registeredCount,
        imageUrl: event.imageUrl || null,
        score,
        reason,
      };
    });

    // 6. Sort by score descending, return top 5
    scoredEvents.sort((a, b) => b.score - a.score);
    const recommendations = scoredEvents.slice(0, 5);

    return success({
      recommendations,
      total: recommendations.length,
      preferences: categoryScores,
    });
  } catch (err) {
    console.error('GetRecommendations error:', err);
    return serverError('Failed to generate recommendations');
  }
};
