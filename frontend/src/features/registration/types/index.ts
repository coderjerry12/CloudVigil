/**
 * Registration & QR Ticket types for CloudVigil — Phase 4
 */

export enum RegistrationStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  WAITLISTED = 'WAITLISTED',
}

export interface Registration {
  eventId: string;
  attendeeId: string;
  registrationId: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  status: RegistrationStatus;
  qrCodeData: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  registeredAt: string;
}

export interface RegisterInput {
  eventId: string;
}

export interface RegistrationsResponse {
  registrations: Registration[];
  total: number;
}

export interface EventRegistrationsResponse {
  registrations: Registration[];
  total: number;
  event: {
    eventId: string;
    title: string;
    capacity: number;
    registeredCount: number;
  };
}
