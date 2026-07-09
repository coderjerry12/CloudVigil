const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE, INCIDENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * GET /incidents/organizer
 * Get ALL incidents across all events owned by the current organizer.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can access this');

    // Get organizer's events
    const eventsResult = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'organizerId-index',
        KeyConditionExpression: 'organizerId = :uid',
        ExpressionAttributeValues: { ':uid': user.userId },
      })
    );

    const events = eventsResult.Items || [];
    const eventIds = events.map(e => e.eventId);

    // Fetch incidents for all events
    let allIncidents = [];
    for (const eventId of eventIds) {
      const incResult = await docClient.send(
        new QueryCommand({
          TableName: INCIDENTS_TABLE,
          IndexName: 'eventId-index',
          KeyConditionExpression: 'eventId = :eid',
          ExpressionAttributeValues: { ':eid': eventId },
          ScanIndexForward: false,
        })
      );
      allIncidents = allIncidents.concat(incResult.Items || []);
    }

    // Sort by createdAt descending
    allIncidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return success({
      incidents: allIncidents,
      total: allIncidents.length,
    });
  } catch (err) {
    console.error('GetAllOrganizerIncidents error:', err);
    return serverError('Failed to fetch incidents');
  }
};
