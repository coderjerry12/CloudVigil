import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
  Alert,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Tab,
  Tabs,
} from '@mui/material';
import {
  CheckCircle,
  Search,
  Close,
  MusicNote,
  Nightlife,
  TheaterComedy,
  SportsEsports,
  Restaurant,
  FitnessCenter,
  Computer,
  Business,
  School,
  Groups,
  Code,
  Celebration,
  MoreHoriz,
  LocationOn,
  CalendarToday,
  People,
  ViewList,
  CalendarMonth,
} from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useBrowseEvents } from '../hooks/useEvents';
import { useMyRegistrations } from '../../registration/hooks/useRegistration';
import EventCalendar from '../components/EventCalendar';
import { EventCategory } from '../types';
import type { EventItem } from '../types';

// --- Category definitions with icons ---
const CATEGORIES = [
  { key: 'all', label: 'All', icon: <MoreHoriz /> },
  { key: EventCategory.MUSIC, label: 'Music', icon: <MusicNote /> },
  { key: EventCategory.NIGHTLIFE, label: 'Nightlife', icon: <Nightlife /> },
  { key: EventCategory.CULTURAL, label: 'Performing Arts', icon: <TheaterComedy /> },
  { key: EventCategory.SPORTS, label: 'Sports', icon: <SportsEsports /> },
  { key: EventCategory.FOOD_DRINK, label: 'Food & Drink', icon: <Restaurant /> },
  { key: EventCategory.HEALTH_WELLNESS, label: 'Health', icon: <FitnessCenter /> },
  { key: EventCategory.TECH, label: 'Tech', icon: <Computer /> },
  { key: EventCategory.BUSINESS, label: 'Business', icon: <Business /> },
  { key: EventCategory.CONFERENCE, label: 'Conference', icon: <School /> },
  { key: EventCategory.WORKSHOP, label: 'Workshop', icon: <Groups /> },
  { key: EventCategory.HACKATHON, label: 'Hackathon', icon: <Code /> },
  { key: EventCategory.SOCIAL, label: 'Social', icon: <Celebration /> },
  { key: EventCategory.MEETUP, label: 'Meetup', icon: <Groups /> },
  { key: EventCategory.SEMINAR, label: 'Seminar', icon: <School /> },
];

// --- Time filter tabs ---
type TimeFilter = 'all' | 'today' | 'this-weekend' | 'this-month';

// --- Category gradient backgrounds for event cards ---
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

export default function BrowseEventsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { events, isLoading, error } = useBrowseEvents();
  const { registrations } = useMyRegistrations();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'newest'>('date');

  // Set of event IDs the user is registered for (only CONFIRMED)
  const registeredEventIds = useMemo(() => {
    return new Set(registrations.filter(r => r.status === 'CONFIRMED').map(r => r.eventId));
  }, [registrations]);

  // Apply all filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Category filter
      if (selectedCategory !== 'all' && event.category !== selectedCategory) {
        return false;
      }

      // Time filter
      if (timeFilter !== 'all') {
        const eventDate = new Date(event.eventDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (timeFilter === 'today') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (eventDate < today || eventDate >= tomorrow) return false;
        } else if (timeFilter === 'this-weekend') {
          const dayOfWeek = today.getDay();
          const saturday = new Date(today);
          saturday.setDate(today.getDate() + (6 - dayOfWeek));
          const monday = new Date(saturday);
          monday.setDate(saturday.getDate() + 2);
          if (eventDate < saturday || eventDate >= monday) return false;
        } else if (timeFilter === 'this-month') {
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
          if (eventDate < today || eventDate > endOfMonth) return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(q) ||
          event.venue.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q) ||
          event.organizerName.toLowerCase().includes(q) ||
          event.category.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [events, selectedCategory, timeFilter, searchQuery]);

  // Sort filtered events
  const sortedFilteredEvents = useMemo(() => {
    const sorted = [...filteredEvents];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      sorted.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    }
    return sorted;
  }, [filteredEvents, sortBy]);

  return (
    <AppLayout title="Browse Events">
      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          placeholder="Search for events, venues, organizers..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          fullWidth
          size="medium"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'background.paper',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <Close sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      {/* Category Icons Row */}
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 2, md: 3 },
          overflowX: 'auto',
          pb: 2,
          mb: 3,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
        }}
      >
        {CATEGORIES.map(cat => (
          <Box
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              minWidth: 72,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: selectedCategory === cat.key ? 'primary.main' : 'divider',
                bgcolor: selectedCategory === cat.key ? 'rgba(27, 94, 75, 0.08)' : 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedCategory === cat.key ? 'primary.main' : 'text.secondary',
                transition: 'all 0.2s',
              }}
            >
              {cat.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                textAlign: 'center',
                fontWeight: selectedCategory === cat.key ? 600 : 400,
                color: selectedCategory === cat.key ? 'primary.main' : 'text.secondary',
                fontSize: '0.7rem',
                lineHeight: 1.2,
                maxWidth: 72,
              }}
            >
              {cat.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Time Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={timeFilter}
          onChange={(_, v) => setTimeFilter(v)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
              px: 2,
            },
          }}
        >
          <Tab label="All" value="all" />
          <Tab label="Today" value="today" />
          <Tab label="This Weekend" value="this-weekend" />
          <Tab label="This Month" value="this-month" />
        </Tabs>
      </Box>

      {/* Results header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3" sx={{ fontSize: '1.4rem' }}>
          {selectedCategory === 'all' ? 'All Events' : `${CATEGORIES.find(c => c.key === selectedCategory)?.label} Events`}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            select
            size="small"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'newest')}
            sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { height: 34, fontSize: '0.8rem' } }}
          >
            <MenuItem value="date">Soonest First</MenuItem>
            <MenuItem value="newest">Recently Added</MenuItem>
          </TextField>
          <IconButton
            size="small"
            onClick={() => setViewMode('grid')}
            sx={{ color: viewMode === 'grid' ? 'primary.main' : 'text.disabled', border: '1px solid', borderColor: viewMode === 'grid' ? 'primary.main' : 'divider' }}
          >
            <ViewList />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setViewMode('calendar')}
            sx={{ color: viewMode === 'calendar' ? 'primary.main' : 'text.disabled', border: '1px solid', borderColor: viewMode === 'calendar' ? 'primary.main' : 'divider' }}
          >
            <CalendarMonth />
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {isLoading ? 'Loading...' : `${sortedFilteredEvents.length} event${sortedFilteredEvents.length !== 1 ? 's' : ''}`}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <EventCalendar
              events={sortedFilteredEvents}
              onEventClick={(event) => navigate(`/attendee/events/${event.eventId}`)}
            />
          </CardContent>
        </Card>
      )}

      {/* Event Cards Grid */}
      {viewMode === 'grid' && (isLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} variant="rounded" height={320} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : sortedFilteredEvents.length === 0 ? (
        <Card sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              No events found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or category filter.'
                : 'No upcoming events available right now. Check back later!'}
            </Typography>
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setTimeFilter('all'); }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {sortedFilteredEvents.map(event => (
            <BrowseEventCard
              key={event.eventId}
              event={event}
              isRegistered={registeredEventIds.has(event.eventId)}
              onClick={() => navigate(`/attendee/events/${event.eventId}`)}
            />
          ))}
        </Box>
      ))}
    </AppLayout>
  );
}

// --- Event Card Component (Eventbrite-style with image banner) ---

interface BrowseEventCardProps {
  event: EventItem;
  isRegistered: boolean;
  onClick: () => void;
}

function BrowseEventCard({ event, isRegistered, onClick }: BrowseEventCardProps) {
  const capacityPercent = Math.round((event.registeredCount / event.capacity) * 100);
  const isAlmostFull = capacityPercent >= 80;
  const gradient = CATEGORY_GRADIENTS[event.category] || CATEGORY_GRADIENTS[EventCategory.OTHER];
  const hasImage = !!event.imageUrl;
  const registrationClosed = new Date(event.registrationDeadline) < new Date();

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
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 3,
        overflow: 'hidden',
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
          height: 160,
          background: hasImage ? 'none' : gradient,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Uploaded image */}
        {hasImage && (
          <img
            src={event.imageUrl!}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              inset: 0,
            }}
          />
        )}

        {/* Decorative pattern overlay (only for gradient fallback) */}
        {!hasImage && (
          <>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                opacity: 0.1,
                backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            {/* Category icon in center */}
            <Box
              sx={{
                color: 'rgba(255,255,255,0.25)',
                fontSize: 80,
                display: 'flex',
                '& .MuiSvgIcon-root': { fontSize: 80 },
              }}
            >
              {CATEGORIES.find(c => c.key === event.category)?.icon || <Celebration />}
            </Box>
          </>
        )}

        {/* Almost Full badge */}
        {isAlmostFull && (
          <Chip
            label={capacityPercent >= 100 ? 'Sold Out' : 'Almost Full'}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: capacityPercent >= 100 ? 'error.main' : 'warning.main',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 24,
            }}
          />
        )}
        {!isAlmostFull && event.accessCode && (
          <Chip
            label="🔒 Restricted"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 22,
            }}
          />
        )}

        {/* Status badge */}
        {registrationClosed && (
          <Chip
            label="Registration Closed"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 24,
            }}
          />
        )}
        {!registrationClosed && isRegistered && (
          <Chip
            icon={<CheckCircle sx={{ fontSize: '14px !important', color: 'white !important' }} />}
            label="Registered"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: 'success.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 24,
            }}
          />
        )}
      </Box>

      {/* Card Content */}
      <CardContent sx={{ p: 2.5 }}>
        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            mb: 1,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
            minHeight: '2.6em',
          }}
        >
          {event.title}
        </Typography>

        {/* Date & Time */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <CalendarToday sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
            {formattedDate} • {formattedTime}
          </Typography>
        </Box>

        {/* Venue */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.venue}
          </Typography>
        </Box>

        {/* Capacity indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
          <People sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {event.registeredCount}/{event.capacity} attending
          </Typography>
        </Box>

        {/* Bottom: Category chip + Organizer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={event.category}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 22, borderRadius: 1.5 }}
          />
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
            by {event.organizerName}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
