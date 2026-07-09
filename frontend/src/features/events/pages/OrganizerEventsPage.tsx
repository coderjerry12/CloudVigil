import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, Visibility, LocationOn, CalendarToday, People, ViewList, CalendarMonth, ContentCopy } from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useOrganizerEvents } from '../hooks/useEvents';
import { useEventFilters } from '../hooks/useEventFilters';
import EventFilterPanel from '../components/EventFilterPanel';
import EventCalendar from '../components/EventCalendar';
import { EventStatus, EventCategory } from '../types';
import type { EventItem } from '../types';

// Category gradient backgrounds for event cards
const CATEGORY_GRADIENTS: Record<string, string> = {
  [EventCategory.CONFERENCE]: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  [EventCategory.WORKSHOP]: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  [EventCategory.SEMINAR]: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  [EventCategory.MEETUP]: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  [EventCategory.HACKATHON]: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  [EventCategory.CULTURAL]: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  [EventCategory.SPORTS]: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  [EventCategory.SOCIAL]: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  [EventCategory.MUSIC]: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  [EventCategory.NIGHTLIFE]: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
  [EventCategory.FOOD_DRINK]: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
  [EventCategory.HEALTH_WELLNESS]: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  [EventCategory.TECH]: 'linear-gradient(135deg, #0D3B30 0%, #14B8A6 100%)',
  [EventCategory.BUSINESS]: 'linear-gradient(135deg, #1B5E4B 0%, #4CA68E 100%)',
  [EventCategory.OTHER]: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
};

export default function OrganizerEventsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { events, isLoading, deleteEvent } = useOrganizerEvents();

  const { filters, setFilters, filteredEvents, venues } = useEventFilters(events);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const successMessage = (location.state as { message?: string })?.message;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: EventItem) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedEvent(item);
  };

  const handleMenuClose = () => { setAnchorEl(null); };
  const handleView = () => { if (selectedEvent) navigate(`/organizer/events/${selectedEvent.eventId}`); handleMenuClose(); };
  const handleEdit = () => { if (selectedEvent) navigate(`/organizer/events/${selectedEvent.eventId}/edit`); handleMenuClose(); };
  const handleDeleteClick = () => { setDeleteDialogOpen(true); handleMenuClose(); };
  const handleClone = () => {
    if (selectedEvent) {
      // Store event data in sessionStorage for the create page to pick up
      const cloneData = {
        title: `${selectedEvent.title} (Copy)`,
        description: selectedEvent.description,
        category: selectedEvent.category,
        venue: selectedEvent.venue,
        capacity: selectedEvent.capacity,
        requirements: selectedEvent.requirements,
      };
      sessionStorage.setItem('clone-event', JSON.stringify(cloneData));
      navigate('/organizer/events/create');
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteEvent(selectedEvent.eventId);
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel event');
    } finally {
      setDeleting(false);
    }
  };

  /** Compute the display status based on event date (in case backend hasn't transitioned yet) */
  const getDisplayStatus = (event: EventItem): { label: string; color: 'info' | 'success' | 'default' | 'error' | 'warning' } => {
    if (event.status === EventStatus.CANCELLED) return { label: 'CANCELLED', color: 'error' };
    if (event.status === EventStatus.COMPLETED) return { label: 'COMPLETED', color: 'default' };

    const now = new Date();
    const eventDate = new Date(event.eventDate);

    // If event date has passed, it's completed
    if (eventDate < now) return { label: 'COMPLETED', color: 'default' };

    // If event is today (within same day), it's ongoing
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    if (eventDay.getTime() === today.getTime()) return { label: 'ONGOING', color: 'success' };

    return { label: 'UPCOMING', color: 'info' };
  };

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (a.status === EventStatus.CANCELLED && b.status !== EventStatus.CANCELLED) return 1;
    if (a.status !== EventStatus.CANCELLED && b.status === EventStatus.CANCELLED) return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <AppLayout title="My Events">
      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Event Portfolio</Typography>
          <Typography variant="body2" color="text.secondary">
            Organize and monitor your events across all scheduled venues.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton
            onClick={() => setViewMode('grid')}
            sx={{ color: viewMode === 'grid' ? 'primary.main' : 'text.disabled', border: '1px solid', borderColor: viewMode === 'grid' ? 'primary.main' : 'divider' }}
            size="small"
          >
            <ViewList />
          </IconButton>
          <IconButton
            onClick={() => setViewMode('calendar')}
            sx={{ color: viewMode === 'calendar' ? 'primary.main' : 'text.disabled', border: '1px solid', borderColor: viewMode === 'calendar' ? 'primary.main' : 'divider' }}
            size="small"
          >
            <CalendarMonth />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/organizer/events/create')}>
            Create Event
          </Button>
        </Box>
      </Box>

      {/* Filter Panel */}
      <EventFilterPanel
        filters={filters}
        onChange={setFilters}
        venues={venues}
        hideFields={['organizer']}
      />

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <EventCalendar
              events={filteredEvents}
              onEventClick={(event) => navigate(`/organizer/events/${event.eventId}`)}
            />
          </CardContent>
        </Card>
      )}

      {/* Event Grid */}
      {viewMode === 'grid' && (isLoading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} key={i}>
              <Skeleton variant="rounded" height={80} />
            </Grid>
          ))}
        </Grid>
      ) : sortedEvents.length === 0 ? (
        <Card sx={{ border: '1px dashed', borderColor: 'divider' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>No events yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Create your first event to get started.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/organizer/events/create')}>Create Event</Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {sortedEvents.map(event => {
            const capacityPct = event.capacity > 0 ? Math.round((event.registeredCount / event.capacity) * 100) : 0;
            const isCancelled = event.status === EventStatus.CANCELLED;
            const gradient = CATEGORY_GRADIENTS[event.category] || CATEGORY_GRADIENTS[EventCategory.OTHER];
            const hasImage = !!event.imageUrl;

            const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const formattedTime = new Date(event.eventDate).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <Card
                key={event.eventId}
                onClick={() => navigate(`/organizer/events/${event.eventId}`)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  overflow: 'hidden',
                  opacity: isCancelled ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  },
                }}
              >
                {/* Image/Gradient Banner */}
                <Box
                  sx={{
                    height: 140,
                    background: hasImage ? 'none' : gradient,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {hasImage && (
                    <img
                      src={event.imageUrl!}
                      alt={event.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                    />
                  )}
                  {!hasImage && (
                    <Box sx={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  )}

                  {/* Status chip */}
                  {(() => {
                    const displayStatus = getDisplayStatus(event);
                    return (
                      <Chip
                        label={displayStatus.label}
                        size="small"
                        color={displayStatus.color}
                        sx={{ position: 'absolute', top: 10, left: 10, fontSize: '0.6rem', height: 22, fontWeight: 700 }}
                      />
                    );
                  })()}

                  {/* Menu button */}
                  <IconButton
                    size="small"
                    onClick={e => { e.stopPropagation(); handleMenuOpen(e, event); }}
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
                  >
                    <MoreVert sx={{ fontSize: 16 }} />
                  </IconButton>

                  {/* Capacity badge */}
                  {capacityPct >= 80 && !isCancelled && (
                    <Chip
                      label={capacityPct >= 100 ? 'Full' : 'Almost Full'}
                      size="small"
                      sx={{ position: 'absolute', bottom: 10, right: 10, bgcolor: capacityPct >= 100 ? 'error.main' : 'warning.main', color: 'white', fontWeight: 700, fontSize: '0.6rem', height: 22 }}
                    />
                  )}
                </Box>

                {/* Card Content */}
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h4" sx={{ mb: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3, minHeight: '2.6em' }}>
                    {event.title}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <CalendarToday sx={{ fontSize: 15, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formattedDate} • {formattedTime}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <LocationOn sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {event.venue}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                    <People sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {event.registeredCount}/{event.capacity} attending
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={event.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22, borderRadius: 1.5 }} />
                    {!isCancelled && (
                      <Typography variant="caption" color="primary.main" fontWeight={600}>
                        {capacityPct}% filled
                      </Typography>
                    )}
                    {isCancelled && (
                      <Typography variant="caption" color="error.main" fontWeight={600}>
                        Cancelled
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ))}

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { minWidth: 160, borderRadius: 2 } }}>
        <MenuItem onClick={handleView}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        {selectedEvent?.status !== EventStatus.CANCELLED && selectedEvent?.status !== EventStatus.COMPLETED && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {selectedEvent?.status !== EventStatus.CANCELLED && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText>Cancel Event</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleClone}>
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
          <ListItemText>Clone Event</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Event?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel <strong>{selectedEvent?.title}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Keep Event</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Cancel Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
