import { fetchAuthSession } from 'aws-amplify/auth';
import type { ChatResponse, ChatHistoryResponse } from '../types';

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
    } catch { /* use default */ }
    throw new Error(message);
  }

  return response;
}

export const chatService = {
  async sendMessage(message: string): Promise<ChatResponse> {
    const response = await authFetch(`${API_BASE}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return response.json();
  },

  async getChatHistory(): Promise<ChatHistoryResponse> {
    const response = await authFetch(`${API_BASE}/chat/history`);
    return response.json();
  },
};
