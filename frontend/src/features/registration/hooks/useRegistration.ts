import { useState, useEffect, useCallback } from 'react';
import { registrationService } from '../services/registrationService';
import type { Registration, EventRegistrationsResponse } from '../types';

/**
 * Hook for attendee to register for an event.
 */
export function useRegisterForEvent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (eventId: string, accessCode?: string): Promise<Registration> => {
    setIsLoading(true);
    setError(null);
    try {
      const registration = await registrationService.registerForEvent(eventId, accessCode);
      return registration;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { register, isLoading, error, clearError: () => setError(null) };
}

/**
 * Hook for fetching current attendee's registrations.
 */
export function useMyRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await registrationService.getMyRegistrations();
      setRegistrations(data.registrations);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return { registrations, isLoading, error, refetch: fetchRegistrations };
}

/**
 * Hook for fetching a single registration (for QR ticket view).
 */
export function useRegistration(registrationId: string | undefined) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationId) return;
    setIsLoading(true);
    setError(null);
    registrationService
      .getRegistration(registrationId)
      .then(data => {
        setRegistration(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Registration not found');
        setIsLoading(false);
      });
  }, [registrationId]);

  return { registration, isLoading, error };
}

/**
 * Hook for organizer to view registrations for their event.
 */
export function useEventRegistrations(eventId: string | undefined) {
  const [data, setData] = useState<EventRegistrationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await registrationService.getEventRegistrations(eventId);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
