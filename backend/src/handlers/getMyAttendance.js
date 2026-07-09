const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * GET /attendance/my
 * Get attendance status for the current attendee across all events.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    // Query all registrations for this user
    const result = await docClient.send(
      new QueryCommand({
        TableName: REGISTRATIONS_TABLE,
        IndexName: 'attendeeId-index',
        KeyConditionExpression: 'attendeeId = :uid',
        ExpressionAttributeValues: { ':uid': user.userId },
        ScanIndexForward: false,
      })
    );

    const registrations = result.Items || [];

    const attendance = registrations.map(r => ({
      registrationId: r.registrationId,
      eventId: r.eventId,
      eventTitle: r.eventTitle,
      eventDate: r.eventDate,
      venue: r.venue,
      status: r.status,
      checkedIn: r.checkedIn || false,
      checkedInAt: r.checkedInAt || null,
    }));

    return success({
      attendance,
      stats: {
        totalRegistrations: registrations.length,
        totalCheckedIn: registrations.filter(r => r.checkedIn).length,
      },
    });
  } catch (err) {
    console.error('GetMyAttendance error:', err);
    return serverError('Failed to fetch attendance status');
  }
};
