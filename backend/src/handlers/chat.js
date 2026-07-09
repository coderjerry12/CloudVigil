const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE, CHAT_HISTORY_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, serverError } = require('../utils/response');

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-sonnet-4-6-v1';

/**
 * POST /chat
 * AI Event Assistant — processes user questions using Bedrock.
 * Fetches real event data to provide contextual responses.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');

    const body = JSON.parse(event.body || '{}');
    const { message } = body;

    if (!message || !message.trim()) {
      return error('Message is required');
    }

    // 1. Fetch user context (their events/registrations)
    const userContext = await getUserContext(user);

    // 2. Fetch recent chat history for conversation continuity
    const chatHistory = await getChatHistory(user.userId);

    // 3. Build the system prompt
    const systemPrompt = buildSystemPrompt(user, userContext);

    // 4. Build messages array (with history)
    const messages = [];
    for (const entry of chatHistory) {
      messages.push({ role: 'user', content: entry.question });
      messages.push({ role: 'assistant', content: entry.response });
    }
    messages.push({ role: 'user', content: message });

    // 5. Call Bedrock
    const aiResponse = await invokeModel(systemPrompt, messages);

    // 6. Store in chat history
    await storeChatHistory(user.userId, user.role, message, aiResponse);

    return success({ response: aiResponse });
  } catch (err) {
    console.error('Chat error:', err);
    return serverError('Failed to process your message. Please try again.');
  }
};

/**
 * Invoke Bedrock Claude model using the Converse API.
 */
async function invokeModel(systemPrompt, messages) {
  // Convert messages to Converse API format
  const converseMessages = messages.map(msg => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: systemPrompt }],
    messages: converseMessages,
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0.7,
    },
  });

  const response = await bedrockClient.send(command);
  return response.output?.message?.content?.[0]?.text || 'I apologize, I could not generate a response.';
}

/**
 * Build system prompt with platform context and user data.
 */
function buildSystemPrompt(user, context) {
  return `You are EventShield AI Assistant — a helpful, friendly AI assistant for the EventShield event management and safety platform.

ABOUT THE PLATFORM:
EventShield AI is a smart event management and safety platform that enables:
- Event creation and management (organizers)
- Event registration with QR tickets (attendees)
- QR code-based check-in at events
- Safety assistance (SOS, Medical, Fire, Food support)
- Real-time crowd monitoring
- Automated notifications and reminders
- Incident tracking and escalation

CURRENT USER:
- Name: ${user.name}
- Role: ${user.role}
- Email: ${user.email}

${context.events.length > 0 ? `USER'S EVENTS:\n${context.events.map(e => `- ${e.title} | Venue: ${e.venue} | Date: ${e.eventDate} | Status: ${e.status}`).join('\n')}` : 'No events found for this user.'}

${context.registrations.length > 0 ? `USER'S REGISTRATIONS:\n${context.registrations.map(r => `- ${r.eventTitle} | Venue: ${r.venue} | Date: ${r.eventDate} | Check-in: ${r.checkedIn ? 'Yes' : 'No'}`).join('\n')}` : ''}

GUIDELINES:
1. Be helpful, concise, and friendly. Use emojis liberally to make conversations engaging and warm. 🎉
2. Answer questions about events, registrations, check-in, and safety features.
3. For safety emergencies, always advise the user to use the Safety Center in the app or contact event staff directly. 🚨
4. Do NOT provide medical diagnoses or replace emergency services.
5. If someone says they feel unwell or are in danger, suggest using the app's SOS or Medical Assistance feature immediately. 🆘
6. Stay within the scope of event management. Politely decline unrelated questions.
7. For organizers: assist with event management, incident monitoring, crowd density, and notifications.
8. For attendees: assist with event info, registration, QR tickets, check-in, and safety.
9. Keep responses under 200 words unless detailed explanation is requested.
10. Use markdown formatting for lists and important information.
11. Start responses with a relevant emoji. Use emojis for bullet points and to highlight key information.`;
}

/**
 * Fetch user's events or registrations for context.
 */
async function getUserContext(user) {
  const context = { events: [], registrations: [] };

  try {
    if (user.role === 'organizer') {
      // Fetch organizer's events
      const result = await docClient.send(
        new QueryCommand({
          TableName: EVENTS_TABLE,
          IndexName: 'organizerId-index',
          KeyConditionExpression: 'organizerId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
          Limit: 10,
          ScanIndexForward: false,
        })
      );
      context.events = result.Items || [];
    } else {
      // Fetch attendee's registrations
      const result = await docClient.send(
        new QueryCommand({
          TableName: REGISTRATIONS_TABLE,
          IndexName: 'attendeeId-index',
          KeyConditionExpression: 'attendeeId = :uid',
          ExpressionAttributeValues: { ':uid': user.userId },
          Limit: 10,
          ScanIndexForward: false,
        })
      );
      context.registrations = result.Items || [];
    }
  } catch (err) {
    console.warn('Failed to fetch user context:', err);
  }

  return context;
}

/**
 * Get recent chat history (last 5 exchanges).
 */
async function getChatHistory(userId) {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: CHAT_HISTORY_TABLE,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        ScanIndexForward: false,
        Limit: 5,
      })
    );
    return (result.Items || []).reverse(); // oldest first for conversation flow
  } catch {
    return [];
  }
}

/**
 * Store chat interaction in history.
 */
async function storeChatHistory(userId, role, question, response) {
  try {
    await docClient.send(
      new PutCommand({
        TableName: CHAT_HISTORY_TABLE,
        Item: {
          userId,
          createdAt: new Date().toISOString(),
          chatId: uuidv4(),
          role,
          question,
          response,
        },
      })
    );
  } catch (err) {
    console.warn('Failed to store chat history:', err);
  }
}
