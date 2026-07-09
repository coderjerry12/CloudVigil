import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Alert,
  LinearProgress,
  Avatar,
  TextField,
  InputAdornment,
  Grid,
} from '@mui/material';
import { ArrowBack, People, CheckCircle, Cancel, Search, Circle, Download } from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useEventRegistrations } from '../hooks/useRegistration';
import { exportToCsv } from '../../../utils/exportCsv';

export default function EventRegistrationsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEventRegistrations(eventId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <AppLayout title="Registrations">
        <Box sx={{ maxWidth: 1000 }}>
          <Skeleton variant="rounded" height={140} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={400} />
        </Box>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Registrations">
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Go Back</Button>
      </AppLayout>
    );
  }

  const event = data?.event;
  const registrations = data?.registrations || [];
  const capacityPercent = event ? Math.round((event.registeredCount / event.capacity) * 100) : 0;
  const checkedInCount = registrations.filter(r => r.checkedIn).length;
  const checkInEfficiency = registrations.length > 0 ? Math.round((checkedInCount / registrations.length) * 100) : 0;

  return (
    <AppLayout title="Registrations">
      <Box sx={{ maxWidth: 1000 }}>
        {/* Back button */}
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/organizer/events')}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Events
        </Button>

        {/* Header Card: Registration Audit + Audit Status */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'secondary.main', mb: 0.5 }}>Registration Audit</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Live monitoring of {event?.title} attendee flow.
                    </Typography>
                  </Box>
                  <Chip
                    icon={<Circle sx={{ fontSize: '8px !important', color: '#22C55E !important' }} />}
                    label="LIVE SYSTEM"
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.65rem', borderColor: 'rgba(34,197,94,0.4)' }}
                  />
                </Box>

                {/* Capacity Bar */}
                <Typography variant="overline" sx={{ fontSize: '0.65rem', mb: 1, display: 'block' }}>
                  Total Registered Capacity
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Box />
                  <Typography variant="body2" fontWeight={600}>
                    {event?.registeredCount} / {event?.capacity}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(capacityPercent, 100)}
                  sx={{ height: 10, borderRadius: 5, '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main', borderRadius: 5 } }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Audit Status Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
                  <CheckCircle sx={{ color: 'secondary.main', fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600}>Audit Status</Typography>
                </Box>
                <Typography variant="overline" sx={{ fontSize: '0.6rem', display: 'block' }}>Check-In Efficiency</Typography>
                <Typography variant="h1" sx={{ color: 'secondary.main', fontSize: '2.5rem', my: 0.5 }}>
                  {checkInEfficiency}%
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  sx={{ mt: 1 }}
                  onClick={() => {
                    exportToCsv(
                      registrations.map(r => ({
                        ...r,
                        checkedInDisplay: r.checkedIn ? 'Yes' : 'No',
                        registeredDate: new Date(r.registeredAt).toLocaleDateString(),
                        checkedInDate: r.checkedInAt ? new Date(r.checkedInAt).toLocaleDateString() : '',
                      })),
                      [
                        { key: 'attendeeName', header: 'Attendee Name' },
                        { key: 'attendeeEmail', header: 'Email' },
                        { key: 'registrationId', header: 'Registration ID' },
                        { key: 'status', header: 'Status' },
                        { key: 'registeredDate', header: 'Registration Date' },
                        { key: 'checkedInDisplay', header: 'Checked In' },
                        { key: 'checkedInDate', header: 'Check-In Time' },
                      ],
                      `${event?.title || 'event'}-registrations`
                    );
                  }}
                >
                  Export CSV
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Bar */}
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Filter by name, email or badge ID..."
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              STATUS: <strong>All Statuses</strong>
            </Typography>
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {registrations.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <People sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="h4" gutterBottom>No registrations yet</Typography>
                <Typography variant="body2" color="text.secondary">
                  Attendees haven't registered for this event yet.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ATTENDEE NAME</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.5px' }}>EMAIL ADDRESS</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.5px' }}>REG. DATE</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.5px' }}>STATUS</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.5px' }}>CHECK-IN</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {registrations.map(reg => (
                        <TableRow key={reg.registrationId} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: 'secondary.main',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                }}
                              >
                                {getInitials(reg.attendeeName)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>
                                {reg.attendeeName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {reg.attendeeEmail}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(reg.registeredAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={reg.status}
                              size="small"
                              color={reg.status === 'CONFIRMED' ? 'success' : 'error'}
                              sx={{ fontSize: '0.6rem', fontWeight: 700, height: 22 }}
                            />
                          </TableCell>
                          <TableCell>
                            {reg.checkedIn ? (
                              <CheckCircle sx={{ color: 'secondary.main', fontSize: 22 }} />
                            ) : (
                              <Cancel sx={{ color: 'text.disabled', fontSize: 22 }} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Footer */}
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    Showing 1-{registrations.length} of {registrations.length} entries
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<Download sx={{ fontSize: 14 }} />}
                      onClick={() => {
                        const attended = registrations.filter(r => r.checkedIn);
                        exportToCsv(
                          attended.map(r => ({
                            ...r,
                            checkedInTime: r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : '',
                          })),
                          [
                            { key: 'attendeeName', header: 'Name' },
                            { key: 'attendeeEmail', header: 'Email' },
                            { key: 'checkedInTime', header: 'Check-In Time' },
                          ],
                          `${event?.title || 'event'}-attendance`
                        );
                      }}
                      sx={{ fontSize: '0.7rem' }}
                    >
                      Export Attendance
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
