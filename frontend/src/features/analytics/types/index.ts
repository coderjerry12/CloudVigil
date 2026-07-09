export interface AnalyticsResponse {
  attendance: {
    totalRegistrations: number;
    totalCheckIns: number;
    attendanceRate: number;
    noShowCount: number;
  };
  registrations: {
    totalRegistrations: number;
    totalCapacity: number;
    capacityUtilization: number;
    byEvent: { eventId: string; title: string; registrations: number; capacity: number; utilization: number }[];
  };
  safety: {
    totalIncidents: number;
    openIncidents: number;
    inProgressIncidents: number;
    escalatedIncidents: number;
    resolvedIncidents: number;
    avgResolutionTimeMinutes: number;
    byType: { SOS: number; MEDICAL: number; FIRE: number; FOOD: number };
  };
  crowd: {
    events: { eventId: string; title: string; status: string; occupancy: number }[];
    warningAlerts: number;
    criticalAlerts: number;
  };
  notifications: {
    totalNotifications: number;
    readNotifications: number;
    unreadNotifications: number;
    byType: Record<string, number>;
  };
  recommendations: {
    totalClicks: number;
    totalRegistrations: number;
    conversionRate: number;
  };
  insights: {
    mostPopularEvent: { title: string; registrations: number } | null;
    highestAttendance: { title: string; checkIns: number } | null;
    mostIncidentsEvent: { title: string; incidents: number } | null;
    totalEvents: number;
  };
}
