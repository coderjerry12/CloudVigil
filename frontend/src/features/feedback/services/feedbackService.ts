import { fetchAuthSession } from 'aws-amplify/auth';
import type { SubmitFeedbackInput, EventFeedbackResponse, MyFeedbackResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function getAuthToken(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || '';
  } catch {
    return '';
  }
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `Request failed (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.message || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  return response;
}

export const feedbackService = {
  async submitFeedback(input: SubmitFeedbackInput): Promise<void> {
    await authFetch(`${API_BASE}/feedback`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getEventFeedback(eventId: string): Promise<EventFeedbackResponse> {
    const response = await authFetch(`${API_BASE}/events/${eventId}/feedback`);
    const data = await response.json();
    return data;
  },

  async getMyFeedback(): Promise<MyFeedbackResponse> {
    const response = await authFetch(`${API_BASE}/feedback/my`);
    const data = await response.json();
    return data;
  },
};
