import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { eventService } from '../services/eventService';
import type {
  EventItem,
  CreateEventInput,
  UpdateEventInput,
  OrganizerMetrics,
} from '../types';
import { EventStatus } from '../types';

/**
 * Hook for organizer event operations.
 * Uses the real API backend (Lambda + DynamoDB).
 */
export function useOrganizerEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [metrics, setMetrics] = useState<OrganizerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await eventService.getOrganizerEvents();
      setEvents(response.events);
      // Calculate metrics from events using real-time date-based status
      const evts = response.events;
      const now = new Date();
      const getEffectiveStatus = (e: EventItem) => {
        if (e.status === EventStatus.CANCELLED) return 'CANCELLED';
        if (e.status === EventStatus.COMPLETED) return 'COMPLETED';
        const eventDate = new Date(e.eventDate);
        if (eventDate < now) return 'COMPLETED';
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        if (eventDay.getTime() === today.getTime()) return 'ONGOING';
        return 'UPCOMING';
      };
      setMetrics({
        totalEvents: evts.length,
        upcomingEvents: evts.filter(e => getEffectiveStatus(e) === 'UPCOMING').length,
        ongoingEvents: evts.filter(e => getEffectiveStatus(e) === 'ONGOING').length,
        cancelledEvents: evts.filter(e => getEffectiveStatus(e) === 'CANCELLED').length,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createEvent = useCallback(
    async (input: CreateEventInput): Promise<EventItem> => {
      if (!user) throw new Error('Not authenticated');
      const event = await eventService.createEvent(input);
      setEvents(prev => [event, ...prev]);
      return event;
    },
    [user]
  );

  const updateEvent = useCallback(
    async (eventId: string, input: UpdateEventInput): Promise<EventItem> => {
      if (!user) throw new Error('Not authenticated');
      const updated = await eventService.updateEvent(eventId, input);
      setEvents(prev => prev.map(e => (e.eventId === eventId ? updated : e)));
      return updated;
    },
    [user]
  );

  const deleteEvent = useCallback(
    async (eventId: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');
      await eventService.deleteEvent(eventId);
      setEvents(prev =>
        prev.map(e =>
          e.eventId === eventId ? { ...e, status: EventStatus.CANCELLED } : e
        )
      );
    },
    [user]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    metrics,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
}

/**
 * Hook for attendee browsing events.
 */
export function useBrowseEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await eventService.getBrowseEvents();
      setEvents(response.events);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
}

/**
 * Hook for fetching a single event.
 */
export function useEvent(eventId: string | undefined) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(() => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    eventService
      .getEvent(eventId)
      .then(data => {
        setEvent(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Event not found');
        setIsLoading(false);
      });
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, isLoading, error, refetch: fetchEvent };
}
