import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Skeleton,
  Alert,
  Avatar,
} from '@mui/material';
import { Star, RateReview } from '@mui/icons-material';
import { useEventFeedback } from '../hooks/useFeedback';

interface EventFeedbackCardProps {
  eventId: string;
}

/**
 * Shows aggregate feedback stats + individual comments for organizers.
 * Attendees see only aggregate stats.
 */
export default function EventFeedbackCard({ eventId }: EventFeedbackCardProps) {
  const { data, isLoading, error } = useEventFeedback(eventId);

  if (isLoading) {
    return <Skeleton variant="rounded" height={200} sx={{ mt: 2.5 }} />;
  }

  if (error) {
    return <Alert severity="info" sx={{ mt: 2.5 }}>Feedback not available</Alert>;
  }

  if (!data || data.totalFeedback === 0) {
    return (
      <Card sx={{ mt: 2.5 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <RateReview sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No feedback submitted yet for this event.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const maxRatingCount = Math.max(...Object.values(data.ratingDistribution));

  return (
    <Card sx={{ mt: 2.5 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <RateReview sx={{ color: 'secondary.main', fontSize: 20 }} />
          <Typography variant="h4">Attendee Feedback</Typography>
          <Chip
            label={`${data.totalFeedback} review${data.totalFeedback !== 1 ? 's' : ''}`}
            size="small"
            sx={{ ml: 'auto', fontSize: '0.7rem' }}
          />
        </Box>

        {/* Average rating display */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ color: 'primary.main', lineHeight: 1 }}>
              {data.avgRating}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  sx={{ fontSize: 16, color: s <= Math.round(data.avgRating) ? '#F59E0B' : 'text.disabled' }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">out of 5</Typography>
          </Box>

          {/* Rating distribution bars */}
          <Box sx={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map(star => (
              <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="caption" sx={{ width: 12, textAlign: 'center' }}>{star}</Typography>
                <Star sx={{ fontSize: 14, color: '#F59E0B' }} />
                <LinearProgress
                  variant="determinate"
                  value={maxRatingCount > 0 ? ((data.ratingDistribution[star] || 0) / maxRatingCount) * 100 : 0}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(0,0,0,0.06)',
                    '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#F59E0B' },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ width: 20, textAlign: 'right' }}>
                  {data.ratingDistribution[star] || 0}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Individual comments (organizer only) */}
        {data.feedback && data.feedback.length > 0 && (
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Comments
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {data.feedback.filter(f => f.comment).slice(0, 10).map((fb, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.light' }}>
                      {fb.attendeeName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>{fb.attendeeName}</Typography>
                    <Box sx={{ display: 'flex', ml: 'auto' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          sx={{ fontSize: 14, color: s <= fb.rating ? '#F59E0B' : 'text.disabled' }}
                        />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {fb.comment}
                  </Typography>
                  {fb.tags && fb.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {fb.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 20 }} />
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
