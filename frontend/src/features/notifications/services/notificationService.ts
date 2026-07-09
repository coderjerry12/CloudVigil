import { fetchAuthSession } from 'aws-amplify/auth';
import type { NotificationsResponse, UnreadCountResponse } from '../types';

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

export const notificationService = {
  async getMyNotifications(): Promise<NotificationsResponse> {
    const response = await authFetch(`${API_BASE}/notifications/my`);
    return response.json();
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await authFetch(`${API_BASE}/notifications/unread-count`);
    return response.json();
  },

  async markAsRead(notificationId: string): Promise<void> {
    await authFetch(`${API_BASE}/notifications/${notificationId}/read`, { method: 'PATCH' });
  },

  async markAllAsRead(): Promise<void> {
    await authFetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
  },
};
