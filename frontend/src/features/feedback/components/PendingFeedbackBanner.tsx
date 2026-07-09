import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
} from '@mui/material';
import { RateReview, CalendarToday, LocationOn } from '@mui/icons-material';
import { useMyFeedback } from '../hooks/useFeedback';
import FeedbackDialog from './FeedbackDialog';

/**
 * Shows a banner/card on the attendee dashboard prompting them
 * to leave feedback for events they attended but haven't reviewed.
 */
export default function PendingFeedbackBanner() {
  const { data, isLoading, refetch } = useMyFeedback();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ eventId: string; eventTitle: string } | null>(null);

  if (isLoading || !data || data.pending.length === 0) return null;

  const openFeedback = (eventId: string, eventTitle: string) => {
    setSelectedEvent({ eventId, eventTitle });
    setDialogOpen(true);
  };

  return (
    <>
      <Card
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'warning.main',
          bgcolor: 'warning.light',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <RateReview sx={{ color: 'warning.main' }} />
            <Typography variant="h4" sx={{ flex: 1 }}>
              Rate Your Recent Events
            </Typography>
            <Chip
              label={`${data.pending.length} pending`}
              size="small"
              color="warning"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Help organizers improve by sharing your experience. Your feedback also helps us recommend better events for you.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {data.pending.slice(0, 3).map(event => (
              <Box
                key={event.eventId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{event.eventTitle}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 12, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn sx={{ fontSize: 12, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">{event.venue}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => openFeedback(event.eventId, event.eventTitle)}
                >
                  Rate
                </Button>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Feedback dialog */}
      {selectedEvent && (
        <FeedbackDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setSelectedEvent(null); }}
          eventId={selectedEvent.eventId}
          eventTitle={selectedEvent.eventTitle}
          onSubmitted={refetch}
        />
      )}
    </>
  );
}
