/**
 * Safety Module types for CloudVigil — Phase 6
 */

export enum IncidentType {
  SOS = 'SOS',
  MEDICAL = 'MEDICAL',
  FIRE = 'FIRE',
  FOOD = 'FOOD',
}

export enum IncidentPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
}

export interface Incident {
  incidentId: string;
  eventId: string;
  eventName: string;
  attendeeId: string;
  attendeeName: string;
  attendeeEmail: string;
  incidentType: IncidentType;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  locationShared: boolean;
  locationTimestamp: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
}

export interface CreateIncidentInput {
  eventId: string;
  incidentType: IncidentType;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationShared?: boolean;
}

export interface UpdateIncidentInput {
  status?: IncidentStatus;
  resolutionNotes?: string;
}

export interface IncidentsResponse {
  incidents: Incident[];
  total: number;
}

export interface EventIncidentsResponse {
  incidents: Incident[];
  stats: {
    total: number;
    open: number;
    inProgress: number;
    escalated: number;
    resolved: number;
  };
  event: {
    eventId: string;
    title: string;
  };
}
