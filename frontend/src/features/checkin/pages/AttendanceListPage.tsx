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
} from '@mui/material';
import { ArrowBack, People, CheckCircle, QrCodeScanner } from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useEventAttendance } from '../hooks/useCheckin';

export default function AttendanceListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEventAttendance(eventId);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <AppLayout title="Attendance">
        <Box sx={{ maxWidth: 900 }}>
          <Skeleton variant="rounded" height={100} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={300} />
        </Box>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Attendance">
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </AppLayout>
    );
  }

  const stats = data?.stats;
  const attendance = data?.attendance || [];
  const event = data?.event;

  return (
    <AppLayout title="Attendance">
      <Box sx={{ maxWidth: 900 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/organizer/events')}
            sx={{ color: 'text.secondary' }}
          >
            Back to Events
          </Button>
          <Button
            variant="contained"
            startIcon={<QrCodeScanner />}
            onClick={() => navigate('/organizer/checkin')}
          >
            Scan QR
          </Button>
        </Box>

        {/* Event + Stats summary */}
        {event && stats && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {event.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {event.venue} • {new Date(event.eventDate).toLocaleDateString()}
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                <Box>
                  <Typography variant="h2" color="primary.main">{stats.totalCheckedIn}</Typography>
                  <Typography variant="caption" color="text.secondary">Checked In</Typography>
                </Box>
                <Box>
                  <Typography variant="h2">{stats.totalRegistered}</Typography>
                  <Typography variant="caption" color="text.secondary">Registered</Typography>
                </Box>
                <Box>
                  <Typography variant="h2" color="secondary.main">{stats.checkInRate}%</Typography>
                  <Typography variant="caption" color="text.secondary">Check-In Rate</Typography>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={stats.checkInRate}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(20,184,166,0.1)',
                  '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'secondary.main' },
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Attendance Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {attendance.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <People sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="h4" gutterBottom>No check-ins yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Start scanning attendee QR codes to record attendance.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<QrCodeScanner />}
                  onClick={() => navigate('/organizer/checkin')}
                >
                  Start Scanning
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Attendee</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Checked In At</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.map(record => (
                      <TableRow key={record.registrationId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {record.attendeeName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {record.attendeeEmail}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<CheckCircle />}
                            label={formatTime(record.checkedInAt)}
                            size="small"
                            color="success"
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {record.checkedInBy}
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
      </Box>
    </AppLayout>
  );
}
