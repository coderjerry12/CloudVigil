import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Skeleton,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  CalendarMonth,
  LocationOn,
  Person,
  ConfirmationNumber,
  CheckCircle,
} from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { AppLayout } from '../../../components/layout';
import { useRegistration } from '../hooks/useRegistration';
import { RegistrationStatus } from '../types';

export default function QRTicketPage() {
  const { registrationId } = useParams<{ registrationId: string }>();
  const navigate = useNavigate();
  const { registration, isLoading, error } = useRegistration(registrationId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <AppLayout title="QR Ticket">
        <Box sx={{ maxWidth: 500, mx: 'auto' }}>
          <Skeleton variant="rounded" height={600} />
        </Box>
      </AppLayout>
    );
  }

  if (error || !registration) {
    return (
      <AppLayout title="QR Ticket">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Registration not found'}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="QR Ticket">
      <Box sx={{ maxWidth: 480, mx: 'auto' }}>
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/attendee/tickets')}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          My Tickets
        </Button>

        {/* Ticket Card */}
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {/* Ticket Header */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 2 }}>
              EVENT TICKET
            </Typography>
            <Typography variant="h3" sx={{ color: 'white', mt: 0.5 }}>
              {registration.eventTitle}
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {/* Status */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Chip
                label={registration.status}
                color={registration.status === RegistrationStatus.CONFIRMED ? 'success' : 'error'}
                icon={registration.status === RegistrationStatus.CONFIRMED ? <CheckCircle /> : undefined}
                sx={{ fontWeight: 600 }}
              />
              {registration.checkedIn && (
                <Chip label="Checked In" color="info" sx={{ ml: 1 }} />
              )}
            </Box>

            {/* QR Code */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 3,
                bgcolor: 'white',
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider',
                mb: 3,
              }}
            >
              <QRCode
                value={registration.qrCodeData}
                size={200}
                level="H"
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
            </Box>

            <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mb: 3 }}>
              Show this QR code at the venue for check-in
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* Ticket Details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CalendarMonth sx={{ color: 'primary.main', fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Date & Time</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(registration.eventDate)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocationOn sx={{ color: 'primary.main', fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Venue</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {registration.venue}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Person sx={{ color: 'primary.main', fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Attendee</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {registration.attendeeName}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ConfirmationNumber sx={{ color: 'primary.main', fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Registration ID</Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {registration.registrationId}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
              Registered on {new Date(registration.registeredAt).toLocaleDateString()}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
