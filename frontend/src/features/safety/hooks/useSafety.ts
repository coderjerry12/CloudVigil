import { useState, useEffect, useCallback } from 'react';
import { safetyService } from '../services/safetyService';
import type {
  Incident,
  CreateIncidentInput,
  UpdateIncidentInput,
  EventIncidentsResponse,
} from '../types';

/**
 * Hook for creating an incident.
 */
export function useCreateIncident() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createIncident = useCallback(async (input: CreateIncidentInput): Promise<Incident> => {
    setIsLoading(true);
    setError(null);
    try {
      const incident = await safetyService.createIncident(input);
      return incident;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to report incident';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createIncident, isLoading, error, clearError: () => setError(null) };
}

/**
 * Hook for incident history.
 * If isOrganizer=true, fetches all incidents across organizer's events.
 * Otherwise fetches attendee's own incidents.
 */
export function useMyIncidents(isOrganizer = false) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = isOrganizer
        ? await safetyService.getOrganizerIncidents()
        : await safetyService.getMyIncidents();
      setIncidents(data.incidents);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents');
    } finally {
      setIsLoading(false);
    }
  }, [isOrganizer]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return { incidents, isLoading, error, refetch: fetchIncidents };
}

/**
 * Hook for organizer viewing event incidents.
 */
export function useEventIncidents(eventId: string | undefined) {
  const [data, setData] = useState<EventIncidentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await safetyService.getEventIncidents(eventId);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Hook for updating an incident.
 */
export function useUpdateIncident() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateIncident = useCallback(async (incidentId: string, input: UpdateIncidentInput): Promise<Incident> => {
    setIsLoading(true);
    setError(null);
    try {
      const incident = await safetyService.updateIncident(incidentId, input);
      return incident;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update incident';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateIncident, isLoading, error, clearError: () => setError(null) };
}

/**
 * Hook for getting browser geolocation.
 */
export function useGeolocation() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to get location');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, getLocation, isLoading, error };
}
