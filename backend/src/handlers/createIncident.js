const { PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE, INCIDENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, notFound, serverError } = require('../utils/response');
const { createNotification } = require('../utils/notifications');

/**
 * POST /incidents
 * Create a safety incident (SOS, MEDICAL, FIRE, FOOD).
 *
 * Business Rules:
 * - Only attendees can create incidents
 * - Must be registered for the event
 * - Event must exist and not be cancelled
 * - Auto-assigns priority based on incident type
 */

const PRIORITY_MAP = {
  SOS: 'HIGH',
  MEDICAL: 'HIGH',
  FIRE: 'HIGH',
  FOOD: 'MEDIUM',
};

const VALID_TYPES = ['SOS', 'MEDICAL', 'FIRE', 'FOOD'];

exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'attendee') return forbidden('Only attendees can report incidents');

    const body = JSON.parse(event.body || '{}');
    const { eventId, incidentType, description, latitude, longitude, locationAccuracy, locationShared } = body;

    // Validate required fields
    if (!eventId || !incidentType) {
      return error('eventId and incidentType are required');
    }

    if (!VALID_TYPES.includes(incidentType)) {
      return error(`Invalid incidentType. Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    // Validate event exists and is not cancelled
    const eventResult = await docClient.send(
      new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId } })
    );

    if (!eventResult.Item) return notFound('Event not found');
    if (eventResult.Item.status === 'CANCELLED') return error('Cannot report incident for a cancelled event');

    // Validate user is registered and checked in for this event
    const regResult = await docClient.send(
      new GetCommand({
        TableName: REGISTRATIONS_TABLE,
        Key: { eventId, attendeeId: user.userId },
      })
    );

    if (!regResult.Item || regResult.Item.status !== 'CONFIRMED') {
      return error('You must be registered for this event to report an incident');
    }

    if (!regResult.Item.checkedIn) {
      return error('You must be checked in to this event to report a safety incident');
    }

    // Cooldown check — prevent spam (max 1 unresolved incident per type per event per 10 min)
    const cooldownThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const recentIncidents = await docClient.send(
      new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: 'attendeeId-index',
        KeyConditionExpression: 'attendeeId = :aid AND createdAt > :cooldown',
        FilterExpression: 'eventId = :eid AND incidentType = :type AND #status <> :resolved',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':aid': user.userId,
          ':eid': eventId,
          ':type': incidentType,
          ':resolved': 'RESOLVED',
          ':cooldown': cooldownThreshold,
        },
      })
    );

    if (recentIncidents.Items && recentIncidents.Items.length > 0) {
      return error(`You already have an active ${incidentType} incident for this event. Please wait for it to be resolved or try again in 10 minutes.`);
    }

    // Create incident
    const now = new Date().toISOString();
    const incident = {
      incidentId: uuidv4(),
      eventId,
      eventName: eventResult.Item.title,
      attendeeId: user.userId,
      attendeeName: user.name,
      attendeeEmail: user.email,
      incidentType,
      description: description || '',
      priority: PRIORITY_MAP[incidentType],
      status: 'OPEN',
      latitude: locationShared ? latitude || null : null,
      longitude: locationShared ? longitude || null : null,
      locationAccuracy: locationShared ? locationAccuracy || null : null,
      locationShared: locationShared || false,
      locationTimestamp: locationShared ? now : null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolvedBy: null,
      resolutionNotes: null,
    };

    await docClient.send(
      new PutCommand({ TableName: INCIDENTS_TABLE, Item: incident })
    );

    // Notify the event organizer about the incident
    try {
      await createNotification({
        recipientId: eventResult.Item.organizerId,
        recipientRole: 'organizer',
        type: 'SAFETY_INCIDENT',
        title: `🚨 ${incidentType} Incident Reported`,
        message: `${user.name} reported a ${incidentType} incident at "${eventResult.Item.title}".${description ? ' Details: ' + description.substring(0, 100) : ''}`,
        referenceId: incident.incidentId,
      });
    } catch (notifErr) {
      console.warn('Failed to send incident notification:', notifErr);
    }

    return success({ incident }, 201);
  } catch (err) {
    console.error('CreateIncident error:', err);
    return serverError('Failed to create incident');
  }
};
