import { useState, useEffect, useCallback } from 'react';
import { feedbackService } from '../services/feedbackService';
import type { MyFeedbackResponse, EventFeedbackResponse } from '../types';

export function useMyFeedback() {
  const [data, setData] = useState<MyFeedbackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await feedbackService.getMyFeedback();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return { data, isLoading, error, refetch: fetchFeedback };
}

export function useEventFeedback(eventId: string | undefined) {
  const [data, setData] = useState<EventFeedbackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await feedbackService.getEventFeedback(eventId);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return { data, isLoading, error, refetch: fetchFeedback };
}
