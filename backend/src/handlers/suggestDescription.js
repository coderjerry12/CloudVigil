const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, serverError } = require('../utils/response');

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';

/**
 * POST /suggest-description
 * AI-powered event description generator.
 * Body: { title, category, venue?, tags? }
 * Returns: { description: string }
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can use AI suggestions');

    const body = JSON.parse(event.body || '{}');
    const { title, category, venue, tags } = body;

    if (!title) return error('Title is required to generate a description');

    const prompt = title.toLowerCase().includes('bio for') || title.toLowerCase().includes('speaker bio')
      ? `You are an expert event professional. Write a short, compelling professional bio (2-3 sentences max) for the following person. Make it sound authoritative and relevant to event speaking/organizing.

Person: ${title.replace(/^(Bio for |Speaker bio for )/i, '')}
${category ? `Context: ${category}` : ''}

Write the bio directly, in third person. Keep it under 100 words.`
      : `You are an expert event copywriter. Generate a compelling, professional event description for the following event. The description should be 2-3 paragraphs, engaging, and informative. Include what attendees can expect, key highlights, and a call-to-action.

Event Title: ${title}
${category ? `Category: ${category}` : ''}
${venue ? `Venue: ${venue}` : ''}
${tags ? `Tags: ${tags}` : ''}

Write the description directly without any preamble or labels. Keep it under 300 words.`;

    const command = new ConverseCommand({
      modelId: MODEL_ID,
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: {
        maxTokens: 500,
        temperature: 0.7,
      },
    });

    const response = await bedrockClient.send(command);
    const description = response.output?.message?.content?.[0]?.text || '';

    return success({ description: description.trim() });
  } catch (err) {
    console.error('SuggestDescription error:', err);
    return serverError('Failed to generate description. Please try again.');
  }
};
