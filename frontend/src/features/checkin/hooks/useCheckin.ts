import { useState, useEffect, useCallback } from 'react';
import { checkinService } from '../services/checkinService';
import type {
  CheckinPayload,
  CheckinResult,
  EventAttendanceResponse,
  MyAttendanceResponse,
} from '../types';

/**
 * Hook for processing QR check-in (Organizer).
 */
export function useProcessCheckin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);

  const processCheckin = useCallback(async (payload: CheckinPayload) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await checkinService.processCheckin(payload);
      setResult(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Check-in failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return { processCheckin, isLoading, error, result, reset };
}

/**
 * Hook for fetching event attendance (Organizer).
 */
export function useEventAttendance(eventId: string | undefined) {
  const [data, setData] = useState<EventAttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkinService.getEventAttendance(eventId);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
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
 * Hook for fetching attendee's own attendance status.
 */
export function useMyAttendance() {
  const [data, setData] = useState<MyAttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkinService.getMyAttendance();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
