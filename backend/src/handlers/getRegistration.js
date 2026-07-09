const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, REGISTRATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, notFound, forbidden, serverError } = require('../utils/response');

/**
 * GET /registrations/{registrationId}
 * Get a single registration by ID.
 * Since registrationId is not the PK, we scan the attendeeId-index for the current user.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const registrationId = event.pathParameters?.registrationId;
    if (!registrationId) return notFound('Registration ID is required');

    // Query user's registrations and find the one with matching registrationId
    const result = await docClient.send(
      new QueryCommand({
        TableName: REGISTRATIONS_TABLE,
        IndexName: 'attendeeId-index',
        KeyConditionExpression: 'attendeeId = :uid',
        FilterExpression: 'registrationId = :regId',
        ExpressionAttributeValues: {
          ':uid': user.userId,
          ':regId': registrationId,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return notFound('Registration not found');
    }

    return success({ registration: result.Items[0] });
  } catch (err) {
    console.error('GetRegistration error:', err);
    return serverError('Failed to fetch registration');
  }
};
