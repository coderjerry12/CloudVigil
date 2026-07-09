const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, INCIDENTS_TABLE, EVENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, notFound, serverError } = require('../utils/response');
const { createNotification } = require('../utils/notifications');

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'];

/**
 * PATCH /incidents/{incidentId}
 * Update incident status (Organizer only).
 * Allowed updates: status, resolutionNotes
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can update incidents');

    const incidentId = event.pathParameters?.incidentId;
    if (!incidentId) return notFound('Incident ID is required');

    const body = JSON.parse(event.body || '{}');
    const { status: newStatus, resolutionNotes } = body;

    // Fetch existing incident
    const incidentResult = await docClient.send(
      new GetCommand({ TableName: INCIDENTS_TABLE, Key: { incidentId } })
    );

    if (!incidentResult.Item) return notFound('Incident not found');

    const incident = incidentResult.Item;

    // Verify organizer owns the event
    const eventResult = await docClient.send(
      new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId: incident.eventId } })
    );

    if (!eventResult.Item || eventResult.Item.organizerId !== user.userId) {
      return forbidden('You can only update incidents for your own events');
    }

    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (newStatus) {
      if (!VALID_STATUSES.includes(newStatus)) {
        return error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = newStatus;

      // If resolving, record resolution details
      if (newStatus === 'RESOLVED') {
        updateExpressions.push('resolvedAt = :resolvedAt');
        updateExpressions.push('resolvedBy = :resolvedBy');
        expressionAttributeValues[':resolvedAt'] = new Date().toISOString();
        expressionAttributeValues[':resolvedBy'] = user.name;
      }
    }

    if (resolutionNotes !== undefined) {
      updateExpressions.push('resolutionNotes = :notes');
      expressionAttributeValues[':notes'] = resolutionNotes;
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length <= 1) {
      return error('No valid fields to update. Allowed: status, resolutionNotes');
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: INCIDENTS_TABLE,
        Key: { incidentId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    // Notify the attendee who reported the incident when it's resolved
    if (newStatus === 'RESOLVED') {
      try {
        await createNotification({
          recipientId: incident.attendeeId,
          recipientRole: 'attendee',
          type: 'INCIDENT_RESOLVED',
          title: '✅ Your Incident Has Been Resolved',
          message: `Your ${incident.incidentType} incident at "${incident.eventName}" has been resolved by the organizer.${resolutionNotes ? ' Notes: ' + resolutionNotes.substring(0, 100) : ''}`,
          referenceId: incidentId,
        });
      } catch (notifErr) {
        console.warn('Failed to send resolution notification:', notifErr);
      }
    }

    return success({ incident: result.Attributes });
  } catch (err) {
    console.error('UpdateIncident error:', err);
    return serverError('Failed to update incident');
  }
};
