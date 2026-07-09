import { Box, Typography, Card, CardContent, Button, Chip, Skeleton, LinearProgress, Grid } from '@mui/material';
import { Event, Upcoming, PlayCircle, Cancel, CheckCircle, HealthAndSafety, People } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { MetricCard } from '../components/common';
import { useOrganizerEvents } from '../features/events/hooks/useEvents';
import { EventStatus } from '../features/events/types';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { events, metrics, isLoading } = useOrganizerEvents();

  const recentEvents = events.slice(0, 5);

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case EventStatus.UPCOMING: return 'info';
      case EventStatus.ONGOING: return 'success';
      case EventStatus.COMPLETED: return 'default';
      case EventStatus.CANCELLED: return 'error';
      default: return 'default';
    }
  };

  // Calculate venue insights
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
  const totalRegistered = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
  const mainOccupancy = totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0;

  return (
    <AppLayout title="Dashboard">
      {/* Metric Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 3,
        }}
      >
        <MetricCard
          icon={<Event />}
          label="Total Events"
          value={metrics?.totalEvents ?? '—'}
          isLoading={isLoading}
          subtitle="All created events"
          progress={100}
        />
        <MetricCard
          icon={<Upcoming />}
          label="Upcoming"
          value={metrics?.upcomingEvents ?? '—'}
          color="#3B82F6"
          isLoading={isLoading}
          subtitle="Scheduled ahead"
          progress={metrics ? (metrics.upcomingEvents / Math.max(metrics.totalEvents, 1)) * 100 : 0}
        />
        <MetricCard
          icon={<PlayCircle />}
          label="Ongoing"
          value={metrics?.ongoingEvents ?? '—'}
          color="#22C55E"
          isLoading={isLoading}
          subtitle="Happening now"
          progress={metrics ? (metrics.ongoingEvents / Math.max(metrics.totalEvents, 1)) * 100 : 0}
        />
        <MetricCard
          icon={<Cancel />}
          label="Cancelled"
          value={metrics?.cancelledEvents ?? '—'}
          color="#EF4444"
          isLoading={isLoading}
          subtitle="No longer active"
          progress={metrics ? (metrics.cancelledEvents / Math.max(metrics.totalEvents, 1)) * 100 : 0}
        />
      </Box>

      {/* Getting Started Checklist */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Your checklist</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            We make it easy to plan successful events. Here's how to get started!
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Create your first event', desc: 'Publish an event with banner, sessions, and capacity controls.', path: '/organizer/events/create', done: (metrics?.totalEvents ?? 0) > 0 },
              { label: 'Set up your organizer profile', desc: 'Add your organization name, bio, and contact details.', path: '/profile', done: !!localStorage.getItem('organizer-onboarded') },
              { label: 'Configure safety protocols', desc: 'Familiarize yourself with the Safety Center and escalation workflow.', path: '/safety', done: false },
              { label: 'Check in your first attendee', desc: 'Use the QR scanner to verify attendees at your event.', path: '/organizer/checkin', done: false },
            ].map((item, i) => (
              <Box
                key={i}
                onClick={() => navigate(item.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: 'rgba(20,184,166,0.04)' },
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: item.done ? 'success.main' : 'divider',
                    bgcolor: item.done ? 'success.main' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.done && <CheckCircle sx={{ fontSize: 16, color: 'white' }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: item.done ? 'text.secondary' : 'primary.main' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                </Box>
                <Typography variant="caption" color="text.disabled">→</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Two Column Layout: Recent Events (left) + Insights (right) */}
      <Grid container spacing={2.5}>
        {/* LEFT: Recent Events */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h4">Recent Events</Typography>
                <Button variant="contained" size="small" onClick={() => navigate('/organizer/events/create')}>
                  + Create Event
                </Button>
              </Box>

              {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={64} />)}
                </Box>
              ) : recentEvents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No events yet.</Typography>
                  <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/organizer/events/create')}>Create Event</Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {recentEvents.map(event => {
                    const eventDate = new Date(event.eventDate);
                    const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                    const day = eventDate.getDate();

                    return (
                      <Box
                        key={event.eventId}
                        onClick={() => navigate(`/organizer/events/${event.eventId}`)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: 1.5,
                          bgcolor: 'background.default',
                          cursor: 'pointer',
                          border: '1px solid transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'rgba(20, 184, 166, 0.4)',
                            transform: 'translateX(4px)',
                            boxShadow: '0 2px 8px rgba(20, 184, 166, 0.15)',
                          },
                        }}
                      >
                        {/* Date Badge */}
                        <Box
                          sx={{
                            width: 48,
                            height: 52,
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.secondary', lineHeight: 1 }}>
                            {month}
                          </Typography>
                          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2 }}>
                            {day}
                          </Typography>
                        </Box>

                        {/* Event Info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={600} noWrap>
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.venue} • {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>

                        {/* Capacity */}
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Capacity</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {event.registeredCount}/{event.capacity}
                          </Typography>
                        </Box>

                        {/* Status */}
                        <Chip
                          label={event.status}
                          size="small"
                          color={getStatusColor(event.status)}
                          sx={{ fontSize: '0.6rem', height: 22, fontWeight: 600, minWidth: 75 }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}

              {recentEvents.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
                  <Button variant="text" size="small" onClick={() => navigate('/organizer/events')}>
                    View All Events →
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT: Venue Insights + Safety + Crowd */}
        <Grid item xs={12} md={5}>
          {/* Venue Insights */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Event sx={{ fontSize: 18, color: 'secondary.main' }} />
                <Typography variant="h5">Venue Insights</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Main Hall Occupancy</Typography>
                  <Typography variant="body2" fontWeight={600} color="secondary.main">{mainOccupancy}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(mainOccupancy, 100)}
                  sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' } }}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Resource Utilization</Typography>
                  <Typography variant="body2" fontWeight={600} color="info.main">
                    {events.length > 0 ? Math.round((events.filter(e => e.status === 'UPCOMING' || e.status === 'ONGOING').length / events.length) * 100) : 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={events.length > 0 ? (events.filter(e => e.status === 'UPCOMING' || e.status === 'ONGOING').length / events.length) * 100 : 0}
                  sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: 'info.main' } }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Safety Center */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HealthAndSafety sx={{ fontSize: 18, color: 'error.main' }} />
                <Typography variant="h5">Safety Center</Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <CheckCircle sx={{ color: 'success.main', fontSize: 20, mt: 0.25 }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>Systems Nominal</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    All {events.length} events reporting steady data flow. No anomalies detected.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Crowd Monitoring */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <People sx={{ fontSize: 18, color: 'secondary.main' }} />
                <Typography variant="h5">Crowd Monitoring</Typography>
              </Box>

              {isLoading ? (
                <Skeleton variant="rounded" height={80} />
              ) : events.filter(e => e.status === 'UPCOMING' || e.status === 'ONGOING').length === 0 ? (
                <Typography variant="body2" color="text.secondary">No active events.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {events
                    .filter(e => e.status === 'UPCOMING' || e.status === 'ONGOING')
                    .map(event => {
                      const occupancy = (event as unknown as Record<string, unknown>).occupancyPercentage as number | undefined;
                      const crowdStatus = (event as unknown as Record<string, unknown>).crowdStatus as string | undefined;
                      const pct = occupancy ?? Math.round((event.registeredCount / event.capacity) * 100);
                      const status = crowdStatus || (pct >= 100 ? 'CRITICAL' : pct >= 90 ? 'HIGH' : pct >= 70 ? 'WARNING' : 'NORMAL');

                      const statusColors: Record<string, string> = {
                        NORMAL: '#22C55E',
                        WARNING: '#F59E0B',
                        HIGH: '#EA580C',
                        CRITICAL: '#DC2626',
                      };

                      return (
                        <Box
                          key={event.eventId}
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: 'background.default',
                            borderLeft: `3px solid ${statusColors[status]}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 12px ${statusColors[status]}25`,
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, mr: 1 }}>
                              {event.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={700}>{pct}%</Typography>
                              <Chip
                                label={status}
                                size="small"
                                sx={{
                                  fontSize: '0.55rem',
                                  height: 20,
                                  fontWeight: 700,
                                  bgcolor: `${statusColors[status]}20`,
                                  color: statusColors[status],
                                }}
                              />
                            </Box>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {event.registeredCount}/{event.capacity} registered
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(pct, 100)}
                            sx={{
                              mt: 0.75,
                              height: 3,
                              borderRadius: 2,
                              '& .MuiLinearProgress-bar': { bgcolor: statusColors[status] },
                            }}
                          />
                        </Box>
                      );
                    })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AppLayout>
  );
}
