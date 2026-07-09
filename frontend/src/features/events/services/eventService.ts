import { fetchAuthSession } from 'aws-amplify/auth';
import type {
  EventItem,
  CreateEventInput,
  UpdateEventInput,
  EventsResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Get auth token for API requests.
 */
async function getAuthToken(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) {
      console.error('No ID token available');
      return '';
    }
    return token;
  } catch (err) {
    console.error('Failed to get auth session:', err);
    return '';
  }
}

/**
 * Authenticated fetch wrapper.
 */
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in again.');
  }

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
      // Use default message
    }
    throw new Error(message);
  }

  return response;
}

/**
 * Event Management API service.
 * Communicates with the backend Lambda APIs via API Gateway.
 */
export const eventService = {
  /**
   * Create a new event (Organizer only).
   */
  async createEvent(input: CreateEventInput): Promise<EventItem> {
    const response = await authFetch(`${API_BASE}/events`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    const data = await response.json();
    return data.event;
  },

  /**
   * Get all events for the current organizer.
   */
  async getOrganizerEvents(): Promise<EventsResponse> {
    const response = await authFetch(`${API_BASE}/events?scope=organizer`);
    const data = await response.json();
    return data;
  },

  /**
   * Get all upcoming/ongoing events (for attendee browsing).
   */
  async getBrowseEvents(): Promise<EventsResponse> {
    const response = await authFetch(`${API_BASE}/events?scope=browse`);
    const data = await response.json();
    return data;
  },

  /**
   * Get a single event by ID.
   */
  async getEvent(eventId: string): Promise<EventItem> {
    const response = await authFetch(`${API_BASE}/events/${eventId}`);
    const data = await response.json();
    return data.event;
  },

  /**
   * Update an event (Organizer only, own events).
   */
  async updateEvent(eventId: string, input: UpdateEventInput): Promise<EventItem> {
    const response = await authFetch(`${API_BASE}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    const data = await response.json();
    return data.event;
  },

  /**
   * Delete (cancel) an event (Organizer only, own events).
   */
  async deleteEvent(eventId: string): Promise<void> {
    await authFetch(`${API_BASE}/events/${eventId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get a pre-signed URL for uploading an event image to S3.
   */
  async getUploadUrl(fileName: string, contentType: string): Promise<{ uploadUrl: string; imageUrl: string; key: string }> {
    const response = await authFetch(`${API_BASE}/upload-url`, {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType }),
    });
    const data = await response.json();
    return data;
  },

  /**
   * Upload a file to S3 using a pre-signed URL.
   */
  async uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });
    if (!response.ok) {
      throw new Error('Failed to upload image to S3');
    }
  },
};
