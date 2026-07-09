const { QueryCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');
const { docClient, INCIDENTS_TABLE, EVENTS_TABLE } = require('../utils/dynamodb');
const { createNotification } = require('../utils/notifications');

const sesClient = new SESClient({});
const SENDER_EMAIL = process.env.SES_SENDER_EMAIL || 'noreply@eventshield.ai';

/**
 * Escalation Lambda — Triggered by EventBridge every 5 minutes.
 *
 * Rules:
 * - OPEN incidents older than 5 minutes → IN_PROGRESS + notify organizer
 * - IN_PROGRESS incidents older than 15 minutes → ESCALATED + critical notification
 * - ESCALATED incidents still unresolved → repeated alerts every 5 minutes
 * - ESCALATED incidents older than 30 minutes → send EMAIL to organizer
 * - Only escalates SOS, MEDICAL, FIRE (not FOOD)
 */
exports.handler = async () => {
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  let escalatedCount = 0;

  try {
    // 1. Find OPEN incidents older than 5 minutes → move to IN_PROGRESS
    const openResult = await docClient.send(
      new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: 'status-priority-index',
        KeyConditionExpression: '#status = :open',
        FilterExpression: 'createdAt < :threshold AND incidentType <> :food',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':open': 'OPEN',
          ':threshold': fiveMinAgo,
          ':food': 'FOOD',
        },
      })
    );

    for (const incident of openResult.Items || []) {
      await docClient.send(
        new UpdateCommand({
          TableName: INCIDENTS_TABLE,
          Key: { incidentId: incident.incidentId },
          UpdateExpression: 'SET #status = :newStatus, updatedAt = :now, escalationNote = :note',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':newStatus': 'IN_PROGRESS',
            ':now': now.toISOString(),
            ':note': 'Auto-escalated: Open for more than 5 minutes',
          },
        })
      );

      // Notify organizer about first escalation
      try {
        const eventResult = await docClient.send(
          new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId: incident.eventId } })
        );
        if (eventResult.Item) {
          await createNotification({
            recipientId: eventResult.Item.organizerId,
            recipientRole: 'organizer',
            type: 'SAFETY_ESCALATION',
            title: `🔔 ${incident.incidentType} Incident Needs Attention`,
            message: `${incident.incidentType} incident at "${incident.eventName}" has been open for 5+ minutes. Please take action.`,
            referenceId: incident.incidentId,
          });
        }
      } catch (notifErr) {
        console.warn('Failed to send escalation notification:', notifErr);
      }

      escalatedCount++;
    }

    // 2. Find IN_PROGRESS incidents older than 15 minutes → move to ESCALATED
    const inProgressResult = await docClient.send(
      new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: 'status-priority-index',
        KeyConditionExpression: '#status = :inProgress',
        FilterExpression: 'createdAt < :threshold AND incidentType <> :food',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':inProgress': 'IN_PROGRESS',
          ':threshold': fifteenMinAgo,
          ':food': 'FOOD',
        },
      })
    );

    for (const incident of inProgressResult.Items || []) {
      await docClient.send(
        new UpdateCommand({
          TableName: INCIDENTS_TABLE,
          Key: { incidentId: incident.incidentId },
          UpdateExpression: 'SET #status = :newStatus, updatedAt = :now, escalationNote = :note',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':newStatus': 'ESCALATED',
            ':now': now.toISOString(),
            ':note': 'Critical escalation: Unresolved for more than 15 minutes',
          },
        })
      );

      // Critical notification to organizer
      try {
        const eventResult = await docClient.send(
          new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId: incident.eventId } })
        );
        if (eventResult.Item) {
          await createNotification({
            recipientId: eventResult.Item.organizerId,
            recipientRole: 'organizer',
            type: 'SAFETY_ESCALATION',
            title: '⚠️ Critical Incident Escalated',
            message: `${incident.incidentType} incident at "${incident.eventName}" has been unresolved for 15+ minutes and requires immediate attention.`,
            referenceId: incident.incidentId,
          });
        }
      } catch (notifErr) {
        console.warn('Failed to send escalation notification:', notifErr);
      }

      escalatedCount++;
    }

    // 3. Find ESCALATED incidents still unresolved → send repeated alerts every 5 min
    const escalatedResult = await docClient.send(
      new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: 'status-priority-index',
        KeyConditionExpression: '#status = :escalated',
        FilterExpression: 'incidentType <> :food',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':escalated': 'ESCALATED',
          ':food': 'FOOD',
        },
      })
    );

    for (const incident of escalatedResult.Items || []) {
      const minutesOpen = Math.round((now.getTime() - new Date(incident.createdAt).getTime()) / 60000);

      // Send repeated in-app notification
      try {
        const eventResult = await docClient.send(
          new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId: incident.eventId } })
        );
        if (eventResult.Item) {
          await createNotification({
            recipientId: eventResult.Item.organizerId,
            recipientRole: 'organizer',
            type: 'SAFETY_CRITICAL',
            title: `🚨 URGENT: ${incident.incidentType} Still Unresolved (${minutesOpen} min)`,
            message: `${incident.incidentType} incident at "${incident.eventName}" has been unresolved for ${minutesOpen} minutes. Immediate action required!`,
            referenceId: incident.incidentId,
          });

          // 4. At 30+ minutes → send EMAIL to organizer (one-time, tracked by emailSent flag)
          if (incident.createdAt < thirtyMinAgo && !incident.emailSent) {
            try {
              await sendEscalationEmail(eventResult.Item, incident, minutesOpen);
              // Mark email as sent so we don't spam
              await docClient.send(
                new UpdateCommand({
                  TableName: INCIDENTS_TABLE,
                  Key: { incidentId: incident.incidentId },
                  UpdateExpression: 'SET emailSent = :sent, updatedAt = :now',
                  ExpressionAttributeValues: {
                    ':sent': true,
                    ':now': now.toISOString(),
                  },
                })
              );
            } catch (emailErr) {
              console.warn('Failed to send escalation email:', emailErr.message);
            }
          }
        }
      } catch (notifErr) {
        console.warn('Failed to send repeated alert:', notifErr);
      }
    }

    console.log(`Escalation complete. ${escalatedCount} incidents escalated. ${escalatedResult.Items?.length || 0} critical incidents alerted.`);
    return { statusCode: 200, body: JSON.stringify({ escalated: escalatedCount }) };
  } catch (err) {
    console.error('Escalation Lambda error:', err);
    throw err;
  }
};

/**
 * Send escalation email to the event organizer.
 */
async function sendEscalationEmail(eventItem, incident, minutesOpen) {
  const organizerEmail = eventItem.organizerEmail;
  if (!organizerEmail) {
    console.warn('No organizer email found, skipping escalation email');
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #DC2626; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">🚨 CRITICAL SAFETY ALERT</h1>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #E0E0E0; border-radius: 0 0 12px 12px;">
        <h2 style="color: #DC2626; margin-top: 0;">Unresolved ${incident.incidentType} Incident — ${minutesOpen} Minutes</h2>
        <p style="color: #5F6368;">An incident at your event requires <strong>immediate action</strong>:</p>
        <div style="background: #FEE2E2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #DC2626;">
          <p style="margin: 4px 0;"><strong>Event:</strong> ${eventItem.title}</p>
          <p style="margin: 4px 0;"><strong>Type:</strong> ${incident.incidentType}</p>
          <p style="margin: 4px 0;"><strong>Reported by:</strong> ${incident.attendeeName}</p>
          <p style="margin: 4px 0;"><strong>Duration:</strong> ${minutesOpen} minutes unresolved</p>
          ${incident.description ? `<p style="margin: 4px 0;"><strong>Details:</strong> ${incident.description}</p>` : ''}
          ${incident.locationShared ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${incident.latitude}, ${incident.longitude}</p>` : ''}
        </div>
        <p style="color: #DC2626; font-weight: 600;">Please log in to EventShield AI immediately to resolve this incident.</p>
        <p style="color: #9E9E9E; font-size: 12px; margin-top: 24px;">This is an automated safety alert from EventShield AI. You received this because an incident at your event has been unresolved for over 30 minutes.</p>
      </div>
    </div>
  `;

  const boundary = `----=_Part_${Date.now()}`;
  const rawMessage = [
    `From: EventShield Safety Alert <${SENDER_EMAIL}>`,
    `To: ${organizerEmail}`,
    `Subject: 🚨 CRITICAL: Unresolved ${incident.incidentType} incident at ${eventItem.title} (${minutesOpen} min)`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    `CRITICAL SAFETY ALERT: ${incident.incidentType} incident at "${eventItem.title}" has been unresolved for ${minutesOpen} minutes. Reported by ${incident.attendeeName}. Please log in to EventShield AI immediately to resolve this.`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    html,
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  await sesClient.send(new SendRawEmailCommand({ RawMessage: { Data: Buffer.from(rawMessage) } }));
  console.log(`Escalation email sent to ${organizerEmail} for incident ${incident.incidentId}`);
}
