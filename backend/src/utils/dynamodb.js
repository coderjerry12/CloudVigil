/**
 * DynamoDB Document Client singleton.
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const EVENTS_TABLE = process.env.EVENTS_TABLE || 'EventShield-Events-dev';
const REGISTRATIONS_TABLE = process.env.REGISTRATIONS_TABLE || 'EventShield-Registrations-dev';
const INCIDENTS_TABLE = process.env.INCIDENTS_TABLE || 'EventShield-Incidents-dev';
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || 'EventShield-Notifications-dev';
const CHAT_HISTORY_TABLE = process.env.CHAT_HISTORY_TABLE || 'EventShield-ChatHistory-dev';
const FEEDBACK_TABLE = process.env.FEEDBACK_TABLE || 'EventShield-Feedback-dev';

module.exports = { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE, INCIDENTS_TABLE, NOTIFICATIONS_TABLE, CHAT_HISTORY_TABLE, FEEDBACK_TABLE };
