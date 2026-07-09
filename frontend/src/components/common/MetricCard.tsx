import { Box, Card, CardContent, Typography, Skeleton, LinearProgress } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  isLoading?: boolean;
  subtitle?: string;
  progress?: number;
}

/**
 * Enhanced KPI metric card with progress indicator and subtitle.
 */
export default function MetricCard({ icon, label, value, color, isLoading, subtitle, progress }: MetricCardProps) {
  const accentColor = color || '#14B8A6';

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          bgcolor: accentColor,
          opacity: 0.7,
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Icon + Trend */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: `${accentColor}14`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
            }}
          >
            {icon}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'rgba(34, 197, 94, 0.08)',
              color: '#22C55E',
            }}
          >
            <TrendingUp sx={{ fontSize: 12 }} />
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Live</Typography>
          </Box>
        </Box>

        {isLoading ? (
          <>
            <Skeleton variant="text" width={60} height={36} />
            <Skeleton variant="text" width={100} height={18} />
          </>
        ) : (
          <>
            {/* Value */}
            <Typography variant="h2" sx={{ mb: 0.25, fontSize: '1.75rem', fontWeight: 700 }}>
              {value}
            </Typography>

            {/* Label */}
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1 }}>
              {label}
            </Typography>

            {/* Progress bar (optional) */}
            {progress !== undefined && (
              <LinearProgress
                variant="determinate"
                value={Math.min(progress, 100)}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: `${accentColor}15`,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    bgcolor: accentColor,
                  },
                }}
              />
            )}

            {/* Subtitle */}
            {subtitle && (
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.75, display: 'block', fontSize: '0.7rem' }}>
                {subtitle}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
