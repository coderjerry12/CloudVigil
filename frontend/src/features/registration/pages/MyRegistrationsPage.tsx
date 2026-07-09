import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Skeleton,
  Alert,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Collapse,
} from '@mui/material';
import { QrCode2, CalendarMonth, LocationOn, CheckCircle, Search, FilterList, Close, ExpandMore, ExpandLess } from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useMyRegistrations } from '../hooks/useRegistration';
import { RegistrationStatus } from '../types';
import type { Registration } from '../types';

export default function MyRegistrationsPage() {
  const navigate = useNavigate();
  const { registrations, isLoading, error } = useMyRegistrations();

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Extract unique venues
  const venues = useMemo(() => {
    const set = new Set(registrations.map(r => r.venue).filter(Boolean));
    return Array.from(set).sort();
  }, [registrations]);

  // Apply filters
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      // Text search
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          reg.eventTitle.toLowerCase().includes(q) ||
          reg.venue.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && reg.status !== statusFilter) return false;

      // Venue
      if (venueFilter && reg.venue !== venueFilter) return false;

      // Date range
      if (dateFrom) {
        const eventDate = new Date(reg.eventDate);
        if (eventDate < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const eventDate = new Date(reg.eventDate);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (eventDate > to) return false;
      }

      return true;
    });
  }, [registrations, search, statusFilter, venueFilter, dateFrom, dateTo]);

  const activeFilterCount = [
    statusFilter !== 'all',
    venueFilter !== '',
    dateFrom !== '',
    dateTo !== '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setVenueFilter('');
    setDateFrom('');
    setDateTo('');
    setExpanded(false);
  };

  return (
    <AppLayout title="My Tickets">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h3">My Registrations</Typography>
        <Typography variant="body2" color="text.secondary">
          Your event tickets and check-in QR codes
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: expanded ? 2 : 0, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by event or venue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField
            select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            {Object.values(RegistrationStatus).map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
          <Button
            variant={expanded ? 'contained' : 'outlined'}
            size="small"
            startIcon={<FilterList />}
            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setExpanded(!expanded)}
            sx={{ height: 40, whiteSpace: 'nowrap' }}
          >
            Filters
            {activeFilterCount > 0 && (
              <Chip
                label={activeFilterCount}
                size="small"
                color="primary"
                sx={{ ml: 0.75, height: 20, fontSize: '0.7rem', minWidth: 20 }}
              />
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button size="small" onClick={clearFilters} sx={{ height: 40, color: 'text.secondary' }}>
              Clear All
            </Button>
          )}
        </Box>

        <Collapse in={expanded}>
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="overline" sx={{ fontSize: '0.65rem', mb: 2, display: 'block', color: 'text.secondary' }}>
              ADVANCED FILTERS
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <TextField
                type="date"
                label="From Date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                label="To Date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              {venues.length > 0 && (
                <TextField
                  select
                  label="Venue"
                  value={venueFilter}
                  onChange={e => setVenueFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">All Venues</MenuItem>
                  {venues.map(v => (
                    <MenuItem key={v} value={v}>{v}</MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {isLoading ? 'Loading...' : `${filteredRegistrations.length} registration${filteredRegistrations.length !== 1 ? 's' : ''} found`}
      </Typography>

      {isLoading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton variant="rounded" height={180} />
            </Grid>
          ))}
        </Grid>
      ) : filteredRegistrations.length === 0 ? (
        <Card sx={{ border: '1px dashed', borderColor: 'divider' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              {registrations.length === 0 ? 'No registrations yet' : 'No matching registrations'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {registrations.length === 0
                ? 'Browse events and register to get your QR tickets.'
                : 'Try adjusting your search or filters.'}
            </Typography>
            {registrations.length === 0 && (
              <Button
                variant="contained"
                onClick={() => navigate('/attendee/events')}
              >
                Browse Events
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {filteredRegistrations.map(reg => (
            <Grid item xs={12} sm={6} key={reg.registrationId}>
              <RegistrationCard
                registration={reg}
                onViewTicket={() => navigate(`/attendee/tickets/${reg.registrationId}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </AppLayout>
  );
}

// --- Registration Card Component ---

interface RegistrationCardProps {
  registration: Registration;
  onViewTicket: () => void;
}

function RegistrationCard({ registration, onViewTicket }: RegistrationCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const eventDatePassed = new Date(registration.eventDate) < new Date();
  const isCancelled = registration.status === RegistrationStatus.CANCELLED;
  const isWaitlisted = registration.status === RegistrationStatus.WAITLISTED;

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.10)' },
      }}
      onClick={onViewTicket}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Status row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          <Chip
            label={registration.status}
            size="small"
            color={
              registration.status === RegistrationStatus.CONFIRMED ? 'success'
              : registration.status === RegistrationStatus.WAITLISTED ? 'warning'
              : 'error'
            }
            icon={registration.status === RegistrationStatus.CONFIRMED ? <CheckCircle /> : undefined}
            sx={{ fontSize: '0.7rem', fontWeight: 600 }}
          />
          {registration.checkedIn && (
            <Chip label="Checked In" size="small" color="info" sx={{ fontSize: '0.65rem' }} />
          )}
          {eventDatePassed && !isCancelled && (
            <Chip label="Event Completed" size="small" variant="outlined" sx={{ fontSize: '0.6rem', fontWeight: 600 }} />
          )}
          {!eventDatePassed && !isCancelled && !isWaitlisted && (
            <Chip label="Registration Open" size="small" color="success" variant="outlined" sx={{ fontSize: '0.6rem' }} />
          )}
        </Box>

        {/* Event title */}
        <Typography variant="h4" sx={{ mb: 1.5, lineHeight: 1.3 }}>
          {registration.eventTitle}
        </Typography>

        {/* Meta */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CalendarMonth sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              {formatDate(registration.eventDate)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {registration.venue}
            </Typography>
          </Box>
        </Box>

        {/* View Ticket button */}
        {!isCancelled && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<QrCode2 />}
            fullWidth
            onClick={e => { e.stopPropagation(); onViewTicket(); }}
          >
            View QR Ticket
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
