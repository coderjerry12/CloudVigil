/**
 * Mock Event Service — used during frontend development before backend is deployed.
 * Replace with real eventService once Lambda APIs are live.
 */
import {
  EventItem,
  EventStatus,
  EventCategory,
  CreateEventInput,
  UpdateEventInput,
  EventsResponse,
  OrganizerMetrics,
} from '../types';

// In-memory mock data store
let mockEvents: EventItem[] = [
  {
    eventId: 'evt-001',
    title: 'Tech Conference 2025',
    description: 'Annual technology conference featuring industry leaders, workshops, and networking opportunities.',
    category: EventCategory.CONFERENCE,
    venue: 'Convention Center, Hall A',
    eventDate: '2025-08-15T09:00:00.000Z',
    registrationDeadline: '2025-08-10T23:59:59.000Z',
    capacity: 500,
    registeredCount: 142,
    requirements: 'Laptop required for workshops. Valid ID for entry.',
    organizerId: '',
    organizerName: '',
    status: EventStatus.UPCOMING,
    createdAt: '2025-06-01T10:00:00.000Z',
    updatedAt: '2025-06-01T10:00:00.000Z',
  },
  {
    eventId: 'evt-002',
    title: 'AI/ML Workshop',
    description: 'Hands-on workshop on building machine learning models with Python and TensorFlow.',
    category: EventCategory.WORKSHOP,
    venue: 'Innovation Lab, Room 201',
    eventDate: '2025-07-20T14:00:00.000Z',
    registrationDeadline: '2025-07-18T23:59:59.000Z',
    capacity: 50,
    registeredCount: 38,
    requirements: 'Python basics required. Bring your own laptop.',
    organizerId: '',
    organizerName: '',
    status: EventStatus.UPCOMING,
    createdAt: '2025-06-05T08:00:00.000Z',
    updatedAt: '2025-06-05T08:00:00.000Z',
  },
  {
    eventId: 'evt-003',
    title: 'Startup Meetup',
    description: 'Monthly startup community meetup for founders, investors, and enthusiasts.',
    category: EventCategory.MEETUP,
    venue: 'Coworking Space, Floor 3',
    eventDate: '2025-07-05T18:00:00.000Z',
    registrationDeadline: '2025-07-04T23:59:59.000Z',
    capacity: 100,
    registeredCount: 67,
    requirements: '',
    organizerId: '',
    organizerName: '',
    status: EventStatus.ONGOING,
    createdAt: '2025-05-20T12:00:00.000Z',
    updatedAt: '2025-06-10T09:00:00.000Z',
  },
  {
    eventId: 'evt-004',
    title: 'Cancelled Hackathon',
    description: 'A cancelled event for testing.',
    category: EventCategory.HACKATHON,
    venue: 'University Hall',
    eventDate: '2025-06-01T09:00:00.000Z',
    registrationDeadline: '2025-05-28T23:59:59.000Z',
    capacity: 200,
    registeredCount: 0,
    requirements: '',
    organizerId: '',
    organizerName: '',
    status: EventStatus.CANCELLED,
    createdAt: '2025-04-15T10:00:00.000Z',
    updatedAt: '2025-05-01T10:00:00.000Z',
  },
];

function delay(ms: number = 400): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Mock service that simulates backend API behavior.
 * All operations include realistic delays.
 */
export const mockEventService = {
  async createEvent(input: CreateEventInput, userId: string, userName: string): Promise<EventItem> {
    await delay();
    const now = new Date().toISOString();
    const newEvent: EventItem = {
      eventId: generateId(),
      ...input,
      requirements: input.requirements || '',
      registeredCount: 0,
      organizerId: userId,
      organizerName: userName,
      status: EventStatus.UPCOMING,
      createdAt: now,
      updatedAt: now,
    };
    mockEvents = [newEvent, ...mockEvents];
    return newEvent;
  },

  async getOrganizerEvents(userId: string): Promise<EventsResponse> {
    await delay();
    const userEvents = mockEvents.filter(e => e.organizerId === userId);
    return { events: userEvents, total: userEvents.length };
  },

  async getBrowseEvents(): Promise<EventsResponse> {
    await delay();
    const browsable = mockEvents.filter(
      e => e.status === EventStatus.UPCOMING || e.status === EventStatus.ONGOING
    );
    return { events: browsable, total: browsable.length };
  },

  async getEvent(eventId: string): Promise<EventItem> {
    await delay(200);
    const event = mockEvents.find(e => e.eventId === eventId);
    if (!event) throw new Error('Event not found');
    return event;
  },

  async updateEvent(eventId: string, input: UpdateEventInput, userId: string): Promise<EventItem> {
    await delay();
    const index = mockEvents.findIndex(e => e.eventId === eventId);
    if (index === -1) throw new Error('Event not found');
    if (mockEvents[index].organizerId !== userId) throw new Error('Not authorized');
    if (mockEvents[index].status === EventStatus.COMPLETED) throw new Error('Cannot edit completed events');

    mockEvents[index] = {
      ...mockEvents[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    return mockEvents[index];
  },

  async deleteEvent(eventId: string, userId: string): Promise<void> {
    await delay();
    const index = mockEvents.findIndex(e => e.eventId === eventId);
    if (index === -1) throw new Error('Event not found');
    if (mockEvents[index].organizerId !== userId) throw new Error('Not authorized');

    // Soft delete — set status to CANCELLED
    mockEvents[index] = {
      ...mockEvents[index],
      status: EventStatus.CANCELLED,
      updatedAt: new Date().toISOString(),
    };
  },

  async getOrganizerMetrics(userId: string): Promise<OrganizerMetrics> {
    await delay(200);
    const userEvents = mockEvents.filter(e => e.organizerId === userId);
    return {
      totalEvents: userEvents.length,
      upcomingEvents: userEvents.filter(e => e.status === EventStatus.UPCOMING).length,
      ongoingEvents: userEvents.filter(e => e.status === EventStatus.ONGOING).length,
      cancelledEvents: userEvents.filter(e => e.status === EventStatus.CANCELLED).length,
    };
  },

  /**
   * Initialize mock data with the current user's ID.
   * Call this once after auth loads to assign events to the logged-in organizer.
   */
  initializeForUser(userId: string, userName: string): void {
    mockEvents = mockEvents.map(event => ({
      ...event,
      organizerId: event.organizerId || userId,
      organizerName: event.organizerName || userName,
    }));
  },
};
