import { Box, Typography, Card, CardContent, Button, Chip, Skeleton } from '@mui/material';
import { EventAvailable, QrCode2, Recommend, HealthAndSafety, CalendarMonth, LocationOn, People } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { useRecommendations } from '../features/recommendations/hooks/useRecommendations';
import { recommendationService } from '../features/recommendations/services/recommendationService';
import PendingFeedbackBanner from '../features/feedback/components/PendingFeedbackBanner';
import { EventCategory } from '../features/events/types';

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

/**
 * Attendee Dashboard — with recommendations widget.
 */
export default function AttendeeDashboard() {
  const navigate = useNavigate();
  const { recommendations, isLoading: recsLoading } = useRecommendations();

  return (
    <AppLayout title="Dashboard">
      {/* Quick action cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        {[
          { icon: <EventAvailable />, label: 'Browse Events', desc: 'Find upcoming events', path: '/attendee/events' },
          { icon: <QrCode2 />, label: 'My Tickets', desc: 'View QR check-in codes', path: '/attendee/tickets' },
          { icon: <Recommend />, label: 'Recommended', desc: 'AI-powered suggestions', path: '/attendee/events' },
          { icon: <HealthAndSafety />, label: 'Safety', desc: 'Emergency assistance', path: '/safety' },
        ].map(item => (
          <Card
            key={item.label}
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate(item.path)}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: 'rgba(20, 184, 166, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  color: 'secondary.main',
                }}
              >
                {item.icon}
              </Box>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {item.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.desc}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Pending Feedback Banner */}
      <PendingFeedbackBanner />

      {/* Recommended Events */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h4">Recommended for You</Typography>
              <Typography variant="body2" color="text.secondary">
                Based on your registration and attendance history
              </Typography>
            </Box>
            <Button variant="text" size="small" onClick={() => navigate('/attendee/events')}>
              Browse All →
            </Button>
          </Box>

          {recsLoading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {[1, 2].map(i => (
                <Skeleton key={i} variant="rounded" height={140} />
              ))}
            </Box>
          ) : recommendations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Register for events to get personalized recommendations.
              </Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1.5 }} onClick={() => navigate('/attendee/events')}>
                Explore Events
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
              {recommendations.slice(0, 4).map(rec => {
                const gradient = CATEGORY_GRADIENTS[rec.category] || CATEGORY_GRADIENTS[EventCategory.OTHER];
                const formattedDate = new Date(rec.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                const formattedTime = new Date(rec.eventDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                return (
                  <Card
                    key={rec.eventId}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' },
                    }}
                    onClick={() => {
                      recommendationService.trackClick(rec.eventId);
                      navigate(`/attendee/events/${rec.eventId}`);
                    }}
                  >
                    {/* Gradient Banner */}
                    <Box
                      sx={{
                        height: 100,
                        background: rec.imageUrl ? 'none' : gradient,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {rec.imageUrl && (
                        <img src={rec.imageUrl} alt={rec.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                      )}
                      {!rec.imageUrl && (
                        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                      )}
                      <Chip
                        label={`${rec.score} pts`}
                        size="small"
                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                      />
                    </Box>

                    {/* Card Content */}
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body1" fontWeight={600} sx={{ mb: 0.75, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {rec.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <CalendarMonth sx={{ fontSize: 14, color: 'primary.main' }} />
                        <Typography variant="caption" fontWeight={500}>{formattedDate} • {formattedTime}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <LocationOn sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary" noWrap>{rec.venue}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <People sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary">{rec.registeredCount}/{rec.capacity} attending</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip label={rec.category} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, borderRadius: 1.5 }} />
                        <Typography variant="caption" sx={{ color: 'secondary.main', fontStyle: 'italic', fontSize: '0.65rem' }}>
                          {rec.reason}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
