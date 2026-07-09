import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Skeleton,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Avatar,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CalendarMonth,
  LocationOn,
  People,
  AccessTime,
  Description,
  Assignment,
  Person,
  Edit,
  ArrowBack,
  HowToReg,
  CheckCircle,
  Security,
  QrCode2,
  Warning,
  School,
  Email,
  Phone,
  Business,
  Link as LinkIcon,
} from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useEvent } from '../hooks/useEvents';
import { useAuth } from '../../../auth/hooks/useAuth';
import { UserRole } from '../../../auth/types';
import { EventStatus } from '../types';
import { useRegisterForEvent, useMyRegistrations } from '../../registration/hooks/useRegistration';
import { useEventRegistrations } from '../../registration/hooks/useRegistration';
import { registrationService } from '../../registration/services/registrationService';
import AgendaView from '../components/AgendaView';
import EventFeedbackCard from '../../feedback/components/EventFeedbackCard';

export default function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { event, isLoading, error, refetch } = useEvent(eventId);
  const { user } = useAuth();
  const { register, isLoading: registering, error: regError, clearError } = useRegisterForEvent();

  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');

  const { registrations } = useMyRegistrations();
  const { data: eventRegsData } = useEventRegistrations(eventId);

  const isOrganizer = user?.role === UserRole.ORGANIZER;
  const isAttendee = user?.role === UserRole.ATTENDEE;
  const isOwner = isOrganizer && event?.organizerId === user?.id;
  const isRegistered = isAttendee && registrations.some(r => r.eventId === eventId && r.status === 'CONFIRMED');
  const isWaitlisted = isAttendee && registrations.some(r => r.eventId === eventId && r.status === 'WAITLISTED');

  const canRegister = () => {
    if (!event || !isAttendee) return false;
    if (event.status !== EventStatus.UPCOMING && event.status !== EventStatus.ONGOING) return false;
    if (new Date(event.registrationDeadline) < new Date()) return false;
    if (event.registeredCount >= event.capacity) return false;
    return true;
  };

  const handleRegister = async () => {
    if (!eventId) return;
    try {
      clearError();
      const reg = await register(eventId, event?.accessCode ? accessCodeInput : undefined);
      setRegistrationId(reg.registrationId);
      setSuccessMessage('Registration successful! Your QR ticket is ready.');
      setRegisterDialogOpen(false);
      setAccessCodeInput('');
      refetch();
    } catch { /* Error shown via regError */ }
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case EventStatus.UPCOMING: return 'info';
      case EventStatus.ONGOING: return 'success';
      case EventStatus.COMPLETED: return 'default';
      case EventStatus.CANCELLED: return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Event Details">
        <Box sx={{ maxWidth: 1000 }}>
          <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={300} />
        </Box>
      </AppLayout>
    );
  }

  if (error || !event) {
    return (
      <AppLayout title="Event Details">
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Event not found'}</Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Go Back</Button>
      </AppLayout>
    );
  }

  const capacityPercent = Math.round((event.registeredCount / event.capacity) * 100);
  const deadlinePassed = new Date(event.registrationDeadline) < new Date();
  const isFull = event.registeredCount >= event.capacity;

  return (
    <AppLayout title="Event Details">
      <Box sx={{ maxWidth: 1000 }}>
        {/* Success message */}
        {successMessage && (
          <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}
            action={registrationId && (
              <Button color="inherit" size="small" onClick={() => navigate(`/attendee/tickets/${registrationId}`)}>View Ticket</Button>
            )}
          >
            {successMessage}
          </Alert>
        )}

        {/* Action Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {isOwner && event.status !== EventStatus.CANCELLED && event.status !== EventStatus.COMPLETED && (
              <Button variant="contained" startIcon={<Edit />} onClick={() => navigate(`/organizer/events/${event.eventId}/edit`)}>
                Edit Event
              </Button>
            )}
            {isOwner && (
              <Button variant="outlined" startIcon={<People />} onClick={() => navigate(`/organizer/events/${event.eventId}/registrations`)}>
                Registrations
              </Button>
            )}
            {isOwner && (
              <Button variant="outlined" color="error" startIcon={<Warning />} onClick={() => navigate(`/organizer/events/${event.eventId}/incidents`)}>
                Incidents
              </Button>
            )}
            {isAttendee && canRegister() && !successMessage && !isRegistered && (
              <Button variant="contained" startIcon={<HowToReg />} onClick={() => setRegisterDialogOpen(true)} size="large">
                Register for Event
              </Button>
            )}
            {isAttendee && isRegistered && !successMessage && !deadlinePassed && (
              <Button variant="outlined" color="error" onClick={() => setCancelDialogOpen(true)}>
                Cancel Registration
              </Button>
            )}
            {isAttendee && isRegistered && deadlinePassed && !successMessage && (
              <Chip label="Registration Closed" color="default" variant="outlined" />
            )}
            {isAttendee && deadlinePassed && !successMessage && <Chip label="Registration Closed" color="warning" />}
            {isAttendee && isFull && !deadlinePassed && !successMessage && !isRegistered && !isWaitlisted && (
              <Button variant="contained" color="warning" startIcon={<HowToReg />} onClick={() => setRegisterDialogOpen(true)} size="large">
                Join Waitlist
              </Button>
            )}
            {isAttendee && isWaitlisted && !successMessage && (
              <Chip label="On Waitlist" color="warning" sx={{ fontWeight: 600 }} />
            )}
          </Box>
        </Box>

        {/* Header Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Chips */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={event.status} size="small" color={getStatusColor(event.status)} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
              <Chip label={event.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              {event.accessCode && (
                <Chip label="🔒 Restricted" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
              )}
            </Box>

            {/* Title */}
            <Typography variant="h2" sx={{ mb: 1.5 }}>{event.title}</Typography>

            {/* Event Link */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Event link</Typography>
              <Typography
                variant="caption"
                sx={{ flex: 1, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}
              >
                {`${window.location.origin}/attendee/events/${event.eventId}`}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/attendee/events/${event.eventId}`);
                }}
                sx={{ fontSize: '0.7rem', textTransform: 'none', whiteSpace: 'nowrap' }}
              >
                📋 Copy link
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: event.title, url: `${window.location.origin}/attendee/events/${event.eventId}` });
                  } else {
                    navigator.clipboard.writeText(`${window.location.origin}/attendee/events/${event.eventId}`);
                  }
                }}
                sx={{ fontSize: '0.7rem', textTransform: 'none', whiteSpace: 'nowrap' }}
              >
                ↗ Share
              </Button>
            </Box>

            {/* Info Grid - 4 columns */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CalendarMonth sx={{ color: 'secondary.main', fontSize: 20, mt: 0.25 }} />
                  <Box>
                    <Typography variant="overline" sx={{ fontSize: '0.6rem', display: 'block' }}>Event Date</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      at {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOn sx={{ color: 'secondary.main', fontSize: 20, mt: 0.25 }} />
                  <Box>
                    <Typography variant="overline" sx={{ fontSize: '0.6rem', display: 'block' }}>Venue</Typography>
                    <Typography variant="body2" fontWeight={600}>{event.venue}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <AccessTime sx={{ color: 'secondary.main', fontSize: 20, mt: 0.25 }} />
                  <Box>
                    <Typography variant="overline" sx={{ fontSize: '0.6rem', display: 'block' }}>Deadline</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(event.registrationDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      at {new Date(event.registrationDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Person sx={{ color: 'secondary.main', fontSize: 20, mt: 0.25 }} />
                  <Box>
                    <Typography variant="overline" sx={{ fontSize: '0.6rem', display: 'block' }}>Organizer</Typography>
                    <Typography variant="body2" fontWeight={600}>{event.organizerName}</Typography>
                    <Typography
                      variant="caption"
                      component="a"
                      href={`mailto:${event.organiserDetails?.email || event.organizerEmail || ''}`}
                      sx={{ color: 'secondary.main', textDecoration: 'none', display: 'block', '&:hover': { textDecoration: 'underline' } }}
                    >
                      ✉ {event.organiserDetails?.email || event.organizerEmail || ''}
                    </Typography>
                    {event.organiserDetails?.phone && (
                      <Typography
                        variant="caption"
                        component="a"
                        href={`tel:${event.organiserDetails.phone}`}
                        sx={{ color: 'text.secondary', textDecoration: 'none', display: 'block' }}
                      >
                        📞 {event.organiserDetails.phone}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Capacity Bar */}
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People sx={{ color: 'secondary.main', fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600}>Capacity</Typography>
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {event.registeredCount} / {event.capacity} registered
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(capacityPercent, 100)}
                sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: capacityPercent >= 90 ? 'warning.main' : 'secondary.main' } }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {capacityPercent}% filled{capacityPercent >= 90 && ' — Almost full!'}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Two Column: About + Location/Security */}
        <Grid container spacing={2.5}>
          {/* Left: About + Requirements */}
          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Description sx={{ color: 'secondary.main', fontSize: 20 }} />
                  <Typography variant="h4">About this Event</Typography>
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {event.description}
                </Typography>
              </CardContent>
            </Card>

            {event.requirements && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Assignment sx={{ color: 'secondary.main', fontSize: 20 }} />
                    <Typography variant="h4">Requirements</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {event.requirements.split('.').filter(Boolean).map((req, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="body2">{req.trim()}.</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Organiser Details */}
            {event.organiserDetails && (
              <Card sx={{ mt: 2.5 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Person sx={{ color: 'secondary.main', fontSize: 20 }} />
                    <Typography variant="h4">Organiser Details</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2.5 }}>
                    <Avatar
                      src={event.organiserDetails.photoUrl}
                      alt={event.organiserDetails.name}
                      sx={{ width: 72, height: 72, bgcolor: 'primary.light', fontSize: '1.5rem', flexShrink: 0 }}
                    >
                      {event.organiserDetails.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body1" fontWeight={600}>{event.organiserDetails.name}</Typography>
                      {event.organiserDetails.organization && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{event.organiserDetails.organization}</Typography>
                        </Box>
                      )}
                      {event.organiserDetails.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{event.organiserDetails.email}</Typography>
                        </Box>
                      )}
                      {event.organiserDetails.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{event.organiserDetails.phone}</Typography>
                        </Box>
                      )}
                      {event.organiserDetails.bio && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                          {event.organiserDetails.bio}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Trainer / Speaker Details */}
            {event.trainerDetails && (
              <Card sx={{ mt: 2.5 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <School sx={{ color: 'secondary.main', fontSize: 20 }} />
                    <Typography variant="h4">Trainer / Speaker</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2.5 }}>
                    <Avatar
                      src={event.trainerDetails.photoUrl}
                      alt={event.trainerDetails.name}
                      sx={{ width: 72, height: 72, bgcolor: 'secondary.light', fontSize: '1.5rem', flexShrink: 0 }}
                    >
                      {event.trainerDetails.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body1" fontWeight={600}>{event.trainerDetails.name}</Typography>
                      {event.trainerDetails.expertise && (
                        <Chip
                          label={event.trainerDetails.expertise}
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ alignSelf: 'flex-start', fontSize: '0.7rem' }}
                        />
                      )}
                      {event.trainerDetails.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{event.trainerDetails.email}</Typography>
                        </Box>
                      )}
                      {event.trainerDetails.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{event.trainerDetails.phone}</Typography>
                        </Box>
                      )}
                      {event.trainerDetails.linkedin && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography
                            variant="body2"
                            component="a"
                            href={event.trainerDetails.linkedin}
                            target="_blank"
                            rel="noopener"
                            sx={{ color: 'secondary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            LinkedIn Profile
                          </Typography>
                        </Box>
                      )}
                      {event.trainerDetails.bio && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                          {event.trainerDetails.bio}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Event Agenda / Sessions */}
            {event.sessions && event.sessions.length > 0 && (
              <AgendaView sessions={event.sessions} eventId={event.eventId} />
            )}

            {/* Attendee Feedback */}
            <EventFeedbackCard eventId={event.eventId} />
          </Grid>

          {/* Right: Location + Security */}
          <Grid item xs={12} md={5}>
            {/* Location Card */}
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box
                  component="a"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
                  target="_blank"
                  rel="noopener"
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: 160,
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'secondary.main' },
                  }}
                >
                  <img
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=77.5,12.9,77.7,13.1&layer=mapnik`}
                    alt=""
                    style={{ display: 'none' }}
                  />
                  <iframe
                    title="Event Location"
                    width="100%"
                    height="100%"
                    style={{ border: 0, pointerEvents: 'none' }}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  />
                </Box>
                <Typography variant="overline" sx={{ color: 'secondary.main', fontSize: '0.65rem' }}>LOCATION</Typography>
                <Typography variant="body1" fontWeight={600}>{event.venue}</Typography>
              </CardContent>
            </Card>

            {/* Event Security Card */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Security sx={{ color: 'secondary.main', fontSize: 20 }} />
                  <Typography variant="h4">Event Security</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Security sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">Encryption</Typography>
                    </Box>
                    <Chip label="ACTIVE" size="small" color="success" sx={{ fontSize: '0.6rem', height: 20, fontWeight: 700 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QrCode2 sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">QR Integrity</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="secondary.main">100%</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tickets Sold + Recent Orders — Organizer Only */}
        {isOwner && (
          <>
            {/* Tickets Sold Card */}
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>Tickets Sold</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h1" sx={{ fontSize: '2.5rem', fontWeight: 700 }}>
                    {event.registeredCount}
                  </Typography>
                  <Typography variant="h4" color="text.secondary">/{event.capacity}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {event.registeredCount} confirmed • 0 paid • {event.registeredCount} free
                </Typography>
              </CardContent>
            </Card>

            {/* Recent Orders Table */}
            <Card sx={{ mt: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4">Recent Orders</Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate(`/organizer/events/${event.eventId}/registrations`)}
                    sx={{ color: 'primary.main', fontSize: '0.8rem' }}
                  >
                    Go to all orders
                  </Button>
                </Box>
                {!eventRegsData || eventRegsData.registrations.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No orders for this event yet</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary' }}>Order #</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary' }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary' }}>Check-in</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary' }}>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {eventRegsData.registrations.slice(0, 5).map(reg => (
                          <TableRow key={reg.registrationId} hover>
                            <TableCell>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                {reg.registrationId.slice(0, 8)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{reg.attendeeName}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={reg.status}
                                size="small"
                                color={reg.status === 'CONFIRMED' ? 'success' : reg.status === 'WAITLISTED' ? 'warning' : 'error'}
                                sx={{ fontSize: '0.6rem', height: 20, fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color={reg.checkedIn ? 'success.main' : 'text.disabled'}>
                                {reg.checkedIn ? '✓ Yes' : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(reg.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* Registration Dialog */}
      <Dialog open={registerDialogOpen} onClose={() => { setRegisterDialogOpen(false); clearError(); setAccessCodeInput(''); }} maxWidth="xs" fullWidth>
        <DialogTitle>{isFull ? 'Join Waitlist?' : 'Register for Event?'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isFull
              ? <>The event <strong>{event.title}</strong> is currently full. You'll be added to the waitlist and notified automatically when a spot opens up.</>
              : <>You are about to register for <strong>{event.title}</strong>. A QR ticket will be generated for check-in.</>
            }
          </DialogContentText>
          {event.accessCode && (
            <TextField
              fullWidth
              label="Access Code"
              placeholder="Enter the event access code"
              value={accessCodeInput}
              onChange={e => setAccessCodeInput(e.target.value)}
              sx={{ mt: 2 }}
              helperText="This event requires an access code to register. Ask the organizer for the code."
              required
            />
          )}
          {regError && <Alert severity="error" sx={{ mt: 2 }}>{regError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setRegisterDialogOpen(false); clearError(); setAccessCodeInput(''); }} disabled={registering}>Cancel</Button>
          <Button
            onClick={handleRegister}
            variant="contained"
            color={isFull ? 'warning' : 'primary'}
            disabled={registering || (!!event.accessCode && !accessCodeInput.trim())}
          >
            {registering ? <CircularProgress size={20} color="inherit" /> : (isFull ? 'Join Waitlist' : 'Confirm Registration')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Registration Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Registration?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your registration for <strong>{event.title}</strong>? Your QR ticket will become invalid.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>Keep Registration</Button>
          <Button
            onClick={async () => {
              setCancelling(true);
              try {
                await registrationService.cancelRegistration(event.eventId);
                setCancelDialogOpen(false);
                setSuccessMessage('Registration cancelled. Your QR ticket is no longer valid.');
                refetch();
              } catch { /* silent */ }
              setCancelling(false);
            }}
            variant="contained"
            color="error"
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={20} color="inherit" /> : 'Cancel Registration'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
