const { QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, INCIDENTS_TABLE, EVENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, notFound, serverError } = require('../utils/response');

/**
 * GET /events/{eventId}/incidents
 * Get all incidents for an event (Organizer only, must own event).
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can view event incidents');

    const eventId = event.pathParameters?.eventId;
    if (!eventId) return notFound('Event ID is required');

    // Verify ownership
    const eventResult = await docClient.send(
      new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId } })
    );
    if (!eventResult.Item) return notFound('Event not found');
    if (eventResult.Item.organizerId !== user.userId) {
      return forbidden('You can only view incidents for your own events');
    }

    // Fetch incidents
    const result = await docClient.send(
      new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: 'eventId-index',
        KeyConditionExpression: 'eventId = :eid',
        ExpressionAttributeValues: { ':eid': eventId },
        ScanIndexForward: false,
      })
    );

    const incidents = result.Items || [];
    const stats = {
      total: incidents.length,
      open: incidents.filter(i => i.status === 'OPEN').length,
      inProgress: incidents.filter(i => i.status === 'IN_PROGRESS').length,
      escalated: incidents.filter(i => i.status === 'ESCALATED').length,
      resolved: incidents.filter(i => i.status === 'RESOLVED').length,
    };

    return success({ incidents, stats, event: { eventId, title: eventResult.Item.title } });
  } catch (err) {
    console.error('GetEventIncidents error:', err);
    return serverError('Failed to fetch incidents');
  }
};
