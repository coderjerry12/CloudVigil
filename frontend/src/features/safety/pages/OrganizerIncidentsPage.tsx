import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Skeleton,
  Alert,
  IconButton,
  Dialog,
  DialogContent,
  TextField,
  MenuItem,
  CircularProgress,
  Link,
  Divider,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Emergency,
  LocalHospital,
  LocalFireDepartment,
  Restaurant,
  LocationOn,
  Edit,
  Warning,
  CheckCircle,
  RadioButtonUnchecked,
  Refresh,
  Download,
} from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useEventIncidents, useUpdateIncident } from '../hooks/useSafety';
import { IncidentType, IncidentStatus } from '../types';
import type { Incident } from '../types';
import { exportToCsv } from '../../../utils/exportCsv';

export default function OrganizerIncidentsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useEventIncidents(eventId);
  const { updateIncident, isLoading: updating, error: updateError, clearError } = useUpdateIncident();

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleUpdateClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setNewStatus(incident.status);
    setResolutionNotes(incident.resolutionNotes || '');
    setUpdateDialogOpen(true);
    clearError();
  };

  const handleUpdateSubmit = async () => {
    if (!selectedIncident || !newStatus) return;
    try {
      await updateIncident(selectedIncident.incidentId, {
        status: newStatus as IncidentStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
      });
      setUpdateDialogOpen(false);
      refetch();
    } catch { /* Error shown in dialog */ }
  };

  const getTypeIcon = (type: IncidentType) => {
    switch (type) {
      case IncidentType.SOS: return <Emergency sx={{ fontSize: 18 }} />;
      case IncidentType.MEDICAL: return <LocalHospital sx={{ fontSize: 18 }} />;
      case IncidentType.FIRE: return <LocalFireDepartment sx={{ fontSize: 18 }} />;
      case IncidentType.FOOD: return <Restaurant sx={{ fontSize: 18 }} />;
    }
  };

  const getTypeColor = (type: IncidentType) => {
    switch (type) {
      case IncidentType.SOS: return '#DC2626';
      case IncidentType.MEDICAL: return '#F59E0B';
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

  if (isLoading) {
    return (
      <AppLayout title="Incidents">
        <Skeleton variant="rounded" height={120} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={400} />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Incidents">
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Go Back</Button>
      </AppLayout>
    );
  }

  const stats = data?.stats;
  const incidents = data?.incidents || [];

  return (
    <AppLayout title="Incidents">
      {/* Back */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate('/organizer/events')} sx={{ color: 'text.secondary' }}>
          Back to Events
        </Button>
        {incidents.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={() => {
              exportToCsv(
                incidents.map(inc => ({
                  ...inc,
                  createdDate: new Date(inc.createdAt).toLocaleString(),
                  resolvedDate: inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : '',
                  locationStr: inc.latitude && inc.longitude ? `${inc.latitude}, ${inc.longitude}` : 'Not shared',
                })),
                [
                  { key: 'incidentId', header: 'Incident ID' },
                  { key: 'incidentType', header: 'Type' },
                  { key: 'status', header: 'Status' },
                  { key: 'priority', header: 'Priority' },
                  { key: 'attendeeName', header: 'Reported By' },
                  { key: 'attendeeEmail', header: 'Reporter Email' },
                  { key: 'description', header: 'Description' },
                  { key: 'locationStr', header: 'Location' },
                  { key: 'createdDate', header: 'Reported At' },
                  { key: 'resolvedDate', header: 'Resolved At' },
                  { key: 'resolutionNotes', header: 'Resolution Notes' },
                ],
                `incidents-report-${eventId}`
              );
            }}
          >
            Export Incidents
          </Button>
        )}
      </Box>

      {/* Status KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="overline" sx={{ fontSize: '0.6rem', display: 'block' }}>ESCALATED</Typography>
                  <Typography variant="h2" color="error.main">{String(stats?.escalated || 0).padStart(2, '0')}</Typography>
                </Box>
                <Warning sx={{ color: 'error.main', fontSize: 24 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="overline" sx={{ fontSize: '0.6rem', display: 'block' }}>OPEN</Typography>
                  <Typography variant="h2" color="warning.main">{String(stats?.open || 0).padStart(2, '0')}</Typography>
                </Box>
                <RadioButtonUnchecked sx={{ color: 'warning.main', fontSize: 24 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="overline" sx={{ fontSize: '0.6rem', display: 'block' }}>IN PROGRESS</Typography>
                  <Typography variant="h2" color="info.main">{String(stats?.inProgress || 0).padStart(2, '0')}</Typography>
                </Box>
                <Refresh sx={{ color: 'info.main', fontSize: 24 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="overline" sx={{ fontSize: '0.6rem', display: 'block' }}>RESOLVED</Typography>
                  <Typography variant="h2" color="success.main">{String(stats?.resolved || 0).padStart(2, '0')}</Typography>
                </Box>
                <CheckCircle sx={{ color: 'success.main', fontSize: 24 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Incident Feed */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Live Incident Feed</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={refetch}>
                Refresh
              </Button>
            </Box>
          </Box>

          {incidents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>All Clear</Typography>
              <Typography variant="body2" color="text.secondary">No safety incidents reported for this event.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {incidents.map(incident => (
                <Box
                  key={incident.incidentId}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: 'rgba(20,184,166,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
                  }}
                >
                  {/* Type Icon */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: `${getTypeColor(incident.incidentType)}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getTypeColor(incident.incidentType),
                      flexShrink: 0,
                      mt: 0.5,
                    }}
                  >
                    {getTypeIcon(incident.incidentType)}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={incident.incidentType}
                        size="small"
                        sx={{
                          fontSize: '0.6rem',
                          height: 20,
                          fontWeight: 700,
                          bgcolor: `${getTypeColor(incident.incidentType)}20`,
                          color: getTypeColor(incident.incidentType),
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>

                    <Typography variant="body1" fontWeight={600} sx={{ mb: 0.25 }}>
                      {incident.description || `${incident.incidentType} Alert`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Attendee: {incident.attendeeName} ({incident.attendeeEmail})
                    </Typography>

                    {incident.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>
                        "{incident.description}"
                      </Typography>
                    )}
                  </Box>

                  {/* Right: Location + Status + Action */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
                    {/* Status + Priority */}
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Chip
                        label={incident.status}
                        size="small"
                        color={getStatusColor(incident.status)}
                        sx={{ fontSize: '0.6rem', height: 22, fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      PRIORITY: {incident.priority}
                    </Typography>

                    {/* Location */}
                    {incident.locationShared && incident.latitude && incident.longitude && (
                      <Link
                        href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                        target="_blank"
                        rel="noopener"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}
                      >
                        <LocationOn sx={{ fontSize: 14 }} />
                        VIEW ON MAP ↗
                      </Link>
                    )}

                    {/* Edit button */}
                    {incident.status !== IncidentStatus.RESOLVED && (
                      <IconButton size="small" onClick={() => handleUpdateClick(incident)} sx={{ mt: 0.5 }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Update Incident Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="overline" sx={{ color: 'secondary.main', fontSize: '0.7rem' }}>UPDATE INCIDENT</Typography>
              <Typography variant="h3" sx={{ mt: 0.5 }}>{selectedIncident?.incidentType} — {selectedIncident?.attendeeName}</Typography>
              {selectedIncident?.locationShared && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Location shared</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />
          {updateError && <Alert severity="error" sx={{ mb: 2 }}>{updateError}</Alert>}

          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Current Status</Typography>
          <TextField fullWidth select value={newStatus} onChange={e => setNewStatus(e.target.value)} sx={{ mb: 3 }}>
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress (Active)</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
          </TextField>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Resolution Notes</Typography>
          <TextField fullWidth multiline rows={4} value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} placeholder="Enter security intervention details, medical updates, or closing remarks..." sx={{ mb: 3 }} />

          {selectedIncident?.description && (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Emergency sx={{ color: 'secondary.main', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'secondary.main' }}>LAST EVENT SNAPSHOT</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>"{selectedIncident.description}"</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setUpdateDialogOpen(false)} disabled={updating}>Cancel</Button>
            <Button onClick={handleUpdateSubmit} variant="contained" disabled={updating} sx={{ minWidth: 140 }}>
              {updating ? <CircularProgress size={20} color="inherit" /> : 'Update Status'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
