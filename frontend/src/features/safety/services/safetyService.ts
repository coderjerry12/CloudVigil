import { fetchAuthSession } from 'aws-amplify/auth';
import type {
  Incident,
  CreateIncidentInput,
  UpdateIncidentInput,
  IncidentsResponse,
  EventIncidentsResponse,
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
 * Safety Module API service.
 */
export const safetyService = {
  /**
   * Create a new incident (Attendee only).
   */
  async createIncident(input: CreateIncidentInput): Promise<Incident> {
    const response = await authFetch(`${API_BASE}/incidents`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    const data = await response.json();
    return data.incident;
  },

  /**
   * Get current attendee's incidents.
   */
  async getMyIncidents(): Promise<IncidentsResponse> {
    const response = await authFetch(`${API_BASE}/incidents/my`);
    const data = await response.json();
    return data;
  },

  /**
   * Get all incidents across organizer's events.
   */
  async getOrganizerIncidents(): Promise<IncidentsResponse> {
    const response = await authFetch(`${API_BASE}/incidents/organizer`);
    const data = await response.json();
    return data;
  },

  /**
   * Get incidents for an event (Organizer only).
   */
  async getEventIncidents(eventId: string): Promise<EventIncidentsResponse> {
    const response = await authFetch(`${API_BASE}/events/${eventId}/incidents`);
    const data = await response.json();
    return data;
  },

  /**
   * Update incident status (Organizer only).
   */
  async updateIncident(incidentId: string, input: UpdateIncidentInput): Promise<Incident> {
    const response = await authFetch(`${API_BASE}/incidents/${incidentId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    const data = await response.json();
    return data.incident;
  },
};
