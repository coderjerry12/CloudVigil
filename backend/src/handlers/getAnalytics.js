const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, EVENTS_TABLE, REGISTRATIONS_TABLE, INCIDENTS_TABLE, NOTIFICATIONS_TABLE } = require('../utils/dynamodb');
const { getUserFromEvent } = require('../utils/auth');
const { success, forbidden, serverError } = require('../utils/response');

/**
 * GET /analytics
 * Comprehensive analytics for the organizer — computes all metrics on-demand
 * from existing tables. Only shows data for events owned by the current organizer.
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Analytics are for organizers only');

    // 1. Fetch organizer's events
    const eventsResult = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'organizerId-index',
        KeyConditionExpression: 'organizerId = :uid',
        ExpressionAttributeValues: { ':uid': user.userId },
        ScanIndexForward: false,
      })
    );
    const events = eventsResult.Items || [];
    const eventIds = events.map(e => e.eventId);

    // 2. Fetch all registrations for organizer's events
    let allRegistrations = [];
    for (const eventId of eventIds) {
      const regResult = await docClient.send(
        new QueryCommand({
          TableName: REGISTRATIONS_TABLE,
          KeyConditionExpression: 'eventId = :eid',
          ExpressionAttributeValues: { ':eid': eventId },
        })
      );
      allRegistrations = allRegistrations.concat(regResult.Items || []);
    }

    // 3. Fetch all incidents for organizer's events
    let allIncidents = [];
    for (const eventId of eventIds) {
      const incResult = await docClient.send(
        new QueryCommand({
          TableName: INCIDENTS_TABLE,
          IndexName: 'eventId-index',
          KeyConditionExpression: 'eventId = :eid',
          ExpressionAttributeValues: { ':eid': eventId },
        })
      );
      allIncidents = allIncidents.concat(incResult.Items || []);
    }

    // 4. Fetch organizer's notifications
    const notifResult = await docClient.send(
      new QueryCommand({
        TableName: NOTIFICATIONS_TABLE,
        KeyConditionExpression: 'recipientId = :uid',
        ExpressionAttributeValues: { ':uid': user.userId },
      })
    );
    const notifications = notifResult.Items || [];

    // ========== CALCULATE METRICS ==========

    // Attendance Analytics
    const confirmedRegs = allRegistrations.filter(r => r.status === 'CONFIRMED');
    const checkedIn = confirmedRegs.filter(r => r.checkedIn === true);
    const attendanceRate = confirmedRegs.length > 0
      ? Math.round((checkedIn.length / confirmedRegs.length) * 100)
      : 0;

    const attendance = {
      totalRegistrations: confirmedRegs.length,
      totalCheckIns: checkedIn.length,
      attendanceRate,
      noShowCount: confirmedRegs.length - checkedIn.length,
    };

    // Registration Analytics
    const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
    const totalRegistered = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
    const capacityUtilization = totalCapacity > 0
      ? Math.round((totalRegistered / totalCapacity) * 100)
      : 0;

    const registrationsByEvent = events.map(e => ({
      eventId: e.eventId,
      title: e.title,
      registrations: e.registeredCount || 0,
      capacity: e.capacity,
      utilization: e.capacity > 0 ? Math.round(((e.registeredCount || 0) / e.capacity) * 100) : 0,
    }));

    const registrations = {
      totalRegistrations: totalRegistered,
      totalCapacity,
      capacityUtilization,
      byEvent: registrationsByEvent,
    };

    // Safety Analytics
    const incidentsByType = {
      SOS: allIncidents.filter(i => i.incidentType === 'SOS').length,
      MEDICAL: allIncidents.filter(i => i.incidentType === 'MEDICAL').length,
      FIRE: allIncidents.filter(i => i.incidentType === 'FIRE').length,
      FOOD: allIncidents.filter(i => i.incidentType === 'FOOD').length,
    };

    const resolvedIncidents = allIncidents.filter(i => i.status === 'RESOLVED');
    let avgResolutionTime = 0;
    if (resolvedIncidents.length > 0) {
      const totalResTime = resolvedIncidents.reduce((sum, i) => {
        if (i.resolvedAt && i.createdAt) {
          return sum + (new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime());
        }
        return sum;
      }, 0);
      avgResolutionTime = Math.round(totalResTime / resolvedIncidents.length / 60000); // in minutes
    }

    const safety = {
      totalIncidents: allIncidents.length,
      openIncidents: allIncidents.filter(i => i.status === 'OPEN').length,
      inProgressIncidents: allIncidents.filter(i => i.status === 'IN_PROGRESS').length,
      escalatedIncidents: allIncidents.filter(i => i.status === 'ESCALATED').length,
      resolvedIncidents: resolvedIncidents.length,
      avgResolutionTimeMinutes: avgResolutionTime,
      byType: incidentsByType,
    };

    // Crowd Analytics
    const crowdData = events.map(e => ({
      eventId: e.eventId,
      title: e.title,
      status: e.crowdStatus || 'NORMAL',
      occupancy: e.occupancyPercentage || 0,
    }));
    const warningAlerts = events.filter(e => e.crowdStatus === 'WARNING' || e.crowdStatus === 'HIGH').length;
    const criticalAlerts = events.filter(e => e.crowdStatus === 'CRITICAL').length;

    const crowd = {
      events: crowdData,
      warningAlerts,
      criticalAlerts,
    };

    // Notification Analytics
    const notificationsByType = {};
    for (const n of notifications) {
      const type = n.notificationType || 'OTHER';
      notificationsByType[type] = (notificationsByType[type] || 0) + 1;
    }

    const notificationMetrics = {
      totalNotifications: notifications.length,
      readNotifications: notifications.filter(n => n.readAt).length,
      unreadNotifications: notifications.filter(n => !n.readAt).length,
      byType: notificationsByType,
    };

    // Recommendation Analytics
    const totalRecClicks = events.reduce((sum, e) => sum + (e.recommendationClicks || 0), 0);
    const totalRecRegistrations = events.reduce((sum, e) => sum + (e.recommendationRegistrations || 0), 0);
    const recConversionRate = totalRecClicks > 0
      ? Math.round((totalRecRegistrations / totalRecClicks) * 100)
      : 0;

    const recommendationMetrics = {
      totalClicks: totalRecClicks,
      totalRegistrations: totalRecRegistrations,
      conversionRate: recConversionRate,
    };

    // Event Insights
    const sortedByRegistrations = [...events].sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0));
    const sortedByIncidents = [...events].sort((a, b) => {
      const aCount = allIncidents.filter(i => i.eventId === a.eventId).length;
      const bCount = allIncidents.filter(i => i.eventId === b.eventId).length;
      return bCount - aCount;
    });

    const insights = {
      mostPopularEvent: sortedByRegistrations[0] ? { title: sortedByRegistrations[0].title, registrations: sortedByRegistrations[0].registeredCount || 0 } : null,
      highestAttendance: sortedByRegistrations[0] ? { title: sortedByRegistrations[0].title, checkIns: checkedIn.filter(r => r.eventId === sortedByRegistrations[0].eventId).length } : null,
      mostIncidentsEvent: sortedByIncidents[0] ? { title: sortedByIncidents[0].title, incidents: allIncidents.filter(i => i.eventId === sortedByIncidents[0].eventId).length } : null,
      totalEvents: events.length,
    };

    return success({
      attendance,
      registrations,
      safety,
      crowd,
      notifications: notificationMetrics,
      recommendations: recommendationMetrics,
      insights,
    });
  } catch (err) {
    console.error('GetAnalytics error:', err);
    return serverError('Failed to compute analytics');
  }
};
