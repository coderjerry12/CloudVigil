import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
  Alert,
  Button,
  Grid,
} from '@mui/material';
import {
  Emergency,
  LocalHospital,
  LocalFireDepartment,
  Restaurant,
  AccessTime,
} from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useMyIncidents } from '../hooks/useSafety';
import { useAuth } from '../../../auth/hooks/useAuth';
import { IncidentType, IncidentStatus } from '../types';
import type { Incident } from '../types';

export default function MyIncidentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOrganizer = user?.role === 'organizer';
  const { incidents, isLoading, error } = useMyIncidents(isOrganizer);

  return (
    <AppLayout title="Incident History">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3">My Incidents</Typography>
        <Typography variant="body2" color="text.secondary">
          Your reported safety incidents and their current status
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {isLoading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      ) : incidents.length === 0 ? (
        <Card sx={{ border: '1px dashed', borderColor: 'divider' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>No incidents reported</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You haven't reported any safety incidents yet.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/safety')}>
              Safety Center
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {incidents.map(incident => (
            <IncidentCard key={incident.incidentId} incident={incident} />
          ))}
        </Box>
      )}
    </AppLayout>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const getTypeIcon = (type: IncidentType) => {
    switch (type) {
      case IncidentType.SOS: return <Emergency />;
      case IncidentType.MEDICAL: return <LocalHospital />;
      case IncidentType.FIRE: return <LocalFireDepartment />;
      case IncidentType.FOOD: return <Restaurant />;
    }
  };

  const getTypeColor = (type: IncidentType) => {
    switch (type) {
      case IncidentType.SOS: return '#DC2626';
      case IncidentType.MEDICAL: return '#2563EB';
      case IncidentType.FIRE: return '#EA580C';
      case IncidentType.FOOD: return '#16A34A';
    }
  };

  const getStatusColor = (status: IncidentStatus): 'error' | 'warning' | 'success' | 'default' => {
    switch (status) {
      case IncidentStatus.OPEN: return 'error';
      case IncidentStatus.IN_PROGRESS: return 'warning';
      case IncidentStatus.ESCALATED: return 'error';
      case IncidentStatus.RESOLVED: return 'success';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ borderLeft: `4px solid ${getTypeColor(incident.incidentType)}` }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: `${getTypeColor(incident.incidentType)}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: getTypeColor(incident.incidentType),
                flexShrink: 0,
              }}
            >
              {getTypeIcon(incident.incidentType)}
            </Box>
            <Box>
              <Typography variant="body1" fontWeight={600}>
                {incident.incidentType} — {incident.eventName}
              </Typography>
              {incident.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {incident.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <AccessTime sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {new Date(incident.createdAt).toLocaleString()}
                </Typography>
              </Box>
              {incident.resolvedAt && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                  Resolved by {incident.resolvedBy} — {incident.resolutionNotes || 'No notes'}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
            <Chip
              label={incident.status}
              size="small"
              color={getStatusColor(incident.status)}
              sx={{ fontSize: '0.65rem', fontWeight: 600, height: 22 }}
            />
            <Chip
              label={incident.priority}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 20 }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
