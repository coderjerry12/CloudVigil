import { fetchAuthSession } from 'aws-amplify/auth';
import type {
  Registration,
  RegistrationsResponse,
  EventRegistrationsResponse,
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
 * Registration API service.
 */
export const registrationService = {
  /**
   * Register the current attendee for an event.
   */
  async registerForEvent(eventId: string, accessCode?: string): Promise<Registration> {
    const response = await authFetch(`${API_BASE}/registrations`, {
      method: 'POST',
      body: JSON.stringify({ eventId, accessCode }),
    });
    const data = await response.json();
    return data.registration;
  },

  /**
   * Get all registrations for the current attendee.
   */
  async getMyRegistrations(): Promise<RegistrationsResponse> {
    const response = await authFetch(`${API_BASE}/registrations/my`);
    const data = await response.json();
    return data;
  },

  /**
   * Get a single registration by ID (for QR ticket view).
   */
  async getRegistration(registrationId: string): Promise<Registration> {
    const response = await authFetch(`${API_BASE}/registrations/${registrationId}`);
    const data = await response.json();
    return data.registration;
  },

  /**
   * Cancel a registration (Attendee only).
   */
  async cancelRegistration(eventId: string): Promise<void> {
    await authFetch(`${API_BASE}/registrations/cancel/${eventId}`, { method: 'POST' });
  },

  /**
   * Get all registrations for an event (organizer only).
   */
  async getEventRegistrations(eventId: string): Promise<EventRegistrationsResponse> {
    const response = await authFetch(`${API_BASE}/events/${eventId}/registrations`);
    const data = await response.json();
    return data;
  },
};
