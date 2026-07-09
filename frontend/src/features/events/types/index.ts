/**
 * Event Management types for CloudVigil — Phase 3
 */

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EventCategory {
  CONFERENCE = 'Conference',
  WORKSHOP = 'Workshop',
  SEMINAR = 'Seminar',
  MEETUP = 'Meetup',
  HACKATHON = 'Hackathon',
  CULTURAL = 'Cultural',
  SPORTS = 'Sports',
  SOCIAL = 'Social',
  MUSIC = 'Music',
  NIGHTLIFE = 'Nightlife',
  FOOD_DRINK = 'Food & Drink',
  HEALTH_WELLNESS = 'Health & Wellness',
  TECH = 'Tech',
  BUSINESS = 'Business',
  OTHER = 'Other',
}

export interface EventItem {
  eventId: string;
  title: string;
  description: string;
  category: EventCategory;
  tags?: string[];
  venue: string;
  eventDate: string; // ISO date string
  registrationDeadline: string; // ISO date string
  capacity: number;
  registeredCount: number;
  requirements: string;
  imageUrl?: string | null;
  accessCode?: string | null;
  waitlistEnabled?: boolean;
  sessions?: EventSession[];
  organizerId: string;
  organizerName: string;
  organizerEmail?: string;
  organiserDetails?: OrganiserDetails;
  trainerDetails?: TrainerDetails;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrganiserDetails {
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  bio?: string;
  photoUrl?: string;
}

export interface TrainerDetails {
  name: string;
  email?: string;
  phone?: string;
  expertise?: string;
  bio?: string;
  linkedin?: string;
  photoUrl?: string;
}

export interface EventSession {
  sessionId: string;
  title: string;
  description?: string;
  speaker?: string;
  speakerBio?: string;
  startTime: string; // ISO time string
  endTime: string; // ISO time string
  room?: string;
  track?: string;
  type?: 'keynote' | 'workshop' | 'panel' | 'networking' | 'break' | 'general';
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: EventCategory;
  tags?: string[];
  venue: string;
  eventDate: string;
  registrationDeadline: string;
  capacity: number;
  requirements?: string;
  imageUrl?: string;
  accessCode?: string;
  waitlistEnabled?: boolean;
  sessions?: EventSession[];
  organiserDetails?: OrganiserDetails;
  trainerDetails?: TrainerDetails;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  category?: EventCategory;
  venue?: string;
  eventDate?: string;
  registrationDeadline?: string;
  capacity?: number;
  requirements?: string;
  imageUrl?: string;
  status?: EventStatus;
  organiserDetails?: OrganiserDetails;
  trainerDetails?: TrainerDetails;
}

export interface EventsResponse {
  events: EventItem[];
  total: number;
}

export interface EventFilters {
  status?: EventStatus;
  category?: EventCategory;
  search?: string;
}

export interface OrganizerMetrics {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  cancelledEvents: number;
}
