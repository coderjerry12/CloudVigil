const { QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, REGISTRATIONS_TABLE, EVENTS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, notFound, serverError } = require('../utils/response');

/**
 * GET /events/{eventId}/attendance
 * Get attendance list for an event (only checked-in attendees).
 * Only the event organizer can view this.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can view attendance');

    const eventId = event.pathParameters?.eventId;
    if (!eventId) return notFound('Event ID is required');

    // Verify ownership
    const eventResult = await docClient.send(
      new GetCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId },
      })
    );

    if (!eventResult.Item) return notFound('Event not found');
    if (eventResult.Item.organizerId !== user.userId) {
      return forbidden('You can only view attendance for your own events');
    }

    // Query all registrations and filter checked-in ones
    const result = await docClient.send(
      new QueryCommand({
        TableName: REGISTRATIONS_TABLE,
        KeyConditionExpression: 'eventId = :eid',
        ExpressionAttributeValues: { ':eid': eventId },
      })
    );

    const allRegistrations = result.Items || [];
    const checkedIn = allRegistrations.filter(r => r.checkedIn === true);
    const totalRegistered = allRegistrations.filter(r => r.status === 'CONFIRMED').length;

    return success({
      attendance: checkedIn.map(r => ({
        registrationId: r.registrationId,
        attendeeId: r.attendeeId,
        attendeeName: r.attendeeName,
        attendeeEmail: r.attendeeEmail,
        checkedInAt: r.checkedInAt,
        checkedInBy: r.checkedInBy,
      })),
      stats: {
        totalRegistered,
        totalCheckedIn: checkedIn.length,
        checkInRate: totalRegistered > 0 ? Math.round((checkedIn.length / totalRegistered) * 100) : 0,
      },
      event: {
        eventId: eventResult.Item.eventId,
        title: eventResult.Item.title,
        venue: eventResult.Item.venue,
        eventDate: eventResult.Item.eventDate,
      },
    });
  } catch (err) {
    console.error('GetEventAttendance error:', err);
    return serverError('Failed to fetch attendance');
  }
};
