import { fetchAuthSession } from 'aws-amplify/auth';
import type {
  CheckinPayload,
  CheckinResult,
  EventAttendanceResponse,
  MyAttendanceResponse,
} from '../types';

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
  if (!token) throw new Error('Not authenticated. Please sign in again.');

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
    } catch {
      // Use default
    }
    throw new Error(message);
  }

  return response;
}

/**
 * Check-In & Attendance API service.
 */
export const checkinService = {
  /**
   * Process a QR code check-in (Organizer only).
   */
  async processCheckin(payload: CheckinPayload): Promise<CheckinResult> {
    const response = await authFetch(`${API_BASE}/attendance/checkin`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  },

  /**
   * Get attendance list for an event (Organizer only).
   */
  async getEventAttendance(eventId: string): Promise<EventAttendanceResponse> {
    const response = await authFetch(`${API_BASE}/events/${eventId}/attendance`);
    const data = await response.json();
    return data;
  },

  /**
   * Get current user's attendance status across all events.
   */
  async getMyAttendance(): Promise<MyAttendanceResponse> {
    const response = await authFetch(`${API_BASE}/attendance/my`);
    const data = await response.json();
    return data;
  },
};
