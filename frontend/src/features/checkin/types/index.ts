/**
 * Check-In & Attendance types for CloudVigil — Phase 5
 */

export interface CheckinPayload {
  registrationId: string;
  eventId: string;
  attendeeId: string;
}

export interface CheckinResult {
  message: string;
  attendance: {
    registrationId: string;
    eventId: string;
    attendeeId: string;
    attendeeName: string;
    attendeeEmail: string;
    eventTitle: string;
    checkedIn: boolean;
    checkedInAt: string;
    checkedInBy: string;
  };
}

export interface AttendanceRecord {
  registrationId: string;
  attendeeId: string;
  attendeeName: string;
  attendeeEmail: string;
  checkedInAt: string;
  checkedInBy: string;
}

export interface EventAttendanceResponse {
  attendance: AttendanceRecord[];
  stats: {
    totalRegistered: number;
    totalCheckedIn: number;
    checkInRate: number;
  };
  event: {
    eventId: string;
    title: string;
    venue: string;
    eventDate: string;
  };
}

export interface MyAttendanceRecord {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  status: string;
  checkedIn: boolean;
  checkedInAt: string | null;
}

export interface MyAttendanceResponse {
  attendance: MyAttendanceRecord[];
  stats: {
    totalRegistrations: number;
    totalCheckedIn: number;
  };
}
