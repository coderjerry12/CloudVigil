const { GetCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, notFound, forbidden, serverError } = require('../utils/response');
const { createNotification } = require('../utils/notifications');

/**
 * DELETE /events/{eventId}
 * Soft-delete: sets status to CANCELLED.
 * Notifies all registered attendees about the cancellation.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can cancel events');

    const eventId = event.pathParameters?.eventId;
    if (!eventId) return notFound('Event ID is required');

    const existing = await docClient.send(
      new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId } })
    );

    if (!existing.Item) return notFound('Event not found');
    if (existing.Item.organizerId !== user.userId) return forbidden('You can only cancel your own events');
    if (existing.Item.status === 'CANCELLED') return error('Event is already cancelled');

    // Soft delete
    const result = await docClient.send(
      new UpdateCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId },
        UpdateExpression: 'SET #status = :cancelled, #updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status', '#updatedAt': 'updatedAt' },
        ExpressionAttributeValues: {
          ':cancelled': 'CANCELLED',
          ':now': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    // Notify all registered attendees about cancellation
    try {
      const regsResult = await docClient.send(
        new QueryCommand({
          TableName: REGISTRATIONS_TABLE,
          KeyConditionExpression: 'eventId = :eid',
          FilterExpression: '#status = :confirmed OR #status = :waitlisted',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':eid': eventId, ':confirmed': 'CONFIRMED', ':waitlisted': 'WAITLISTED' },
        })
      );

      for (const reg of regsResult.Items || []) {
        // Cancel all registrations
        await docClient.send(
          new UpdateCommand({
            TableName: REGISTRATIONS_TABLE,
            Key: { eventId, attendeeId: reg.attendeeId },
            UpdateExpression: 'SET #status = :cancelled, updatedAt = :now',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':cancelled': 'CANCELLED', ':now': new Date().toISOString() },
          })
        );

        // Notify each attendee
        await createNotification({
          recipientId: reg.attendeeId,
          recipientRole: 'attendee',
          type: 'EVENT_CANCELLED',
          title: '❌ Event Cancelled',
          message: `"${existing.Item.title}" has been cancelled by the organizer. Your registration and QR ticket are no longer valid.`,
          referenceId: eventId,
        });
      }
    } catch (notifErr) {
      console.warn('Failed to send cancellation notifications:', notifErr);
    }

    return success({ message: 'Event cancelled successfully', event: result.Attributes });
  } catch (err) {
    console.error('DeleteEvent error:', err);
    return serverError('Failed to cancel event');
  }
};
