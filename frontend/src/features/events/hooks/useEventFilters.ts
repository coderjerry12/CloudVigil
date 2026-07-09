import { useState, useMemo } from 'react';
import type { EventItem } from '../types';
import type { EventFilterValues } from '../components/EventFilterPanel';
import { defaultFilters } from '../components/EventFilterPanel';

/**
 * Hook that manages filter state and applies filters to an event list.
 * Returns the filtered events, filter state, unique venues/organizers for dropdowns.
 */
export function useEventFilters(events: EventItem[]) {
  const [filters, setFilters] = useState<EventFilterValues>({ ...defaultFilters });

  // Extract unique venues and organizers for dropdown options
  const venues = useMemo(() => {
    const set = new Set(events.map(e => e.venue).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const organizers = useMemo(() => {
    const set = new Set(events.map(e => e.organizerName).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  // Apply all filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Text search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(q) ||
          event.venue.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q) ||
          event.organizerName.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Category
      if (filters.category !== 'all' && event.category !== filters.category) {
        return false;
      }

      // Status
      if (filters.status !== 'all' && event.status !== filters.status) {
        return false;
      }

      // Venue
      if (filters.venue && event.venue !== filters.venue) {
        return false;
      }

      // Organizer
      if (filters.organizer && event.organizerName !== filters.organizer) {
        return false;
      }

      // Date range
      if (filters.dateFrom) {
        const eventDate = new Date(event.eventDate);
        const fromDate = new Date(filters.dateFrom);
        if (eventDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const eventDate = new Date(event.eventDate);
        const toDate = new Date(filters.dateTo);
        // Include the entire "to" day
        toDate.setHours(23, 59, 59, 999);
        if (eventDate > toDate) return false;
      }

      // Capacity range
      if (filters.capacityMin) {
        const min = parseInt(filters.capacityMin, 10);
        if (!isNaN(min) && event.capacity < min) return false;
      }

      if (filters.capacityMax) {
        const max = parseInt(filters.capacityMax, 10);
        if (!isNaN(max) && event.capacity > max) return false;
      }

      return true;
    });
  }, [events, filters]);

  return {
    filters,
    setFilters,
    filteredEvents,
    venues,
    organizers,
  };
}
