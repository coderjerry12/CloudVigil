const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, CHAT_HISTORY_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * GET /chat/history
 * Get recent chat history for the current user (last 20 messages).
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const result = await docClient.send(
      new QueryCommand({
        TableName: CHAT_HISTORY_TABLE,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': user.userId },
        ScanIndexForward: false,
        Limit: 20,
      })
    );

    return success({
      history: (result.Items || []).reverse(), // oldest first
      total: result.Count || 0,
    });
  } catch (err) {
    console.error('GetChatHistory error:', err);
    return serverError('Failed to fetch chat history');
  }
};
