import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import {
  Emergency,
  LocalHospital,
  LocalFireDepartment,
  Restaurant,
  LocationOn,
  CheckCircle,
  Circle,
  History,
} from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useCreateIncident, useGeolocation, useMyIncidents } from '../hooks/useSafety';
import { useBrowseEvents } from '../../events/hooks/useEvents';
import { IncidentType } from '../types';
import { useAuth } from '../../../auth/hooks/useAuth';

interface IncidentOption {
  type: IncidentType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  priority: string;
}

const INCIDENT_OPTIONS: IncidentOption[] = [
  { type: IncidentType.SOS, label: 'SOS Emergency', icon: <Emergency sx={{ fontSize: 28 }} />, color: '#DC2626', description: 'Immediate danger or life-threatening emergency protocol.', priority: 'HIGH PRIORITY' },
  { type: IncidentType.MEDICAL, label: 'Medical Assistance', icon: <LocalHospital sx={{ fontSize: 28 }} />, color: '#2563EB', description: 'Medical help needed for injury, illness, or allergic reactions.', priority: 'HIGH PRIORITY' },
  { type: IncidentType.FIRE, label: 'Fire Emergency', icon: <LocalFireDepartment sx={{ fontSize: 28 }} />, color: '#EA580C', description: 'Fire, smoke, or hazardous situation detected protocols.', priority: 'HIGH PRIORITY' },
  { type: IncidentType.FOOD, label: 'Food Support', icon: <Restaurant sx={{ fontSize: 28 }} />, color: '#16A34A', description: 'Food-related assistance or contamination complaints.', priority: 'MEDIUM' },
];

export default function SafetyAssistancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOrganizer = user?.role === 'organizer';
  const { createIncident, isLoading, error, clearError } = useCreateIncident();
  const { location, getLocation, isLoading: locationLoading } = useGeolocation();
  const { events } = useBrowseEvents();
  const { incidents } = useMyIncidents(isOrganizer);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [description, setDescription] = useState('');
  const [shareLocation, setShareLocation] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (shareLocation && !location) getLocation();
  }, [shareLocation, location, getLocation]);

  const handleEmergencyClick = (type: IncidentType) => {
    setSelectedType(type);
    setDialogOpen(true);
    clearError();
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedEventId) return;
    try {
      await createIncident({
        eventId: selectedEventId,
        incidentType: selectedType,
        description: description.trim() || undefined,
        latitude: shareLocation && location ? location.latitude : undefined,
        longitude: shareLocation && location ? location.longitude : undefined,
        locationAccuracy: shareLocation && location ? location.accuracy : undefined,
        locationShared: shareLocation && !!location,
      });
      setDialogOpen(false);
      setDescription('');
      setShareLocation(false);
      setSuccess(`${selectedType} incident reported successfully. Help is on the way.`);
      setSelectedType(null);
      setSelectedEventId('');
    } catch { /* handled by hook */ }
  };

  const handleCloseDialog = () => { setDialogOpen(false); setDescription(''); setShareLocation(false); clearError(); };

  // Recent incidents for the live feed
  const recentIncidents = incidents.slice(0, 5);

  return (
    <AppLayout title="Safety Center">
      {success && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>Active Safety Protocols</Typography>
        <Typography variant="body2" color="text.secondary">
          Standard operating procedures for current event status.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT: Emergency Action Cards (Attendee only) + Helplines */}
        <Grid item xs={12} md={7}>
          {/* Emergency Cards - Only for Attendees */}
          {!isOrganizer && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, mb: 3 }}>
              {INCIDENT_OPTIONS.map(option => (
                <Card
                  key={option.type}
                  onClick={() => handleEmergencyClick(option.type)}
                  sx={{
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${option.color}20` },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    {/* Priority Badge */}
                    <Chip
                      label={option.priority}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        fontSize: '0.55rem',
                        height: 20,
                        fontWeight: 700,
                        bgcolor: option.type === IncidentType.FOOD ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                        color: option.type === IncidentType.FOOD ? '#16A34A' : '#DC2626',
                      }}
                    />
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: `${option.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: option.color,
                        mb: 2,
                      }}
                    >
                      {option.icon}
                    </Box>
                    <Typography variant="h4" sx={{ mb: 0.5 }}>{option.label}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                      {option.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Organizer: Incident Management Overview */}
          {isOrganizer && (
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Emergency sx={{ color: 'error.main', fontSize: 20 }} />
                  <Typography variant="h4">Incident Management</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Monitor and resolve safety incidents reported by attendees across your events.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {INCIDENT_OPTIONS.map(option => (
                    <Box
                      key={option.type}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${option.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: option.color }}>
                        {option.icon}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.priority}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Emergency Helplines */}
          <Card sx={{ border: '1px solid', borderColor: 'error.main' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Emergency sx={{ color: 'error.main', fontSize: 20 }} />
                <Typography variant="h4" sx={{ color: 'error.main' }}>Emergency Helplines</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                In case of life-threatening emergencies, contact these units directly.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {[
                  { label: 'Emergency Services', desc: 'Police / Fire / Ambulance', number: '112' },
                  { label: 'Ambulance', desc: 'Medical Emergency', number: '108' },
                  { label: 'Fire Brigade', desc: 'Fire Emergency', number: '101' },
                  { label: 'Women Helpline', desc: '24/7 Support', number: '1091' },
                ].map(contact => (
                  <Box
                    key={contact.number}
                    component="a"
                    href={`tel:${contact.number}`}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'error.main' },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{contact.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{contact.desc}</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ color: 'error.main', fontFamily: 'monospace' }}>
                      {contact.number}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT: Incident History + Live Feed + Notifications */}
        <Grid item xs={12} md={5}>
          {/* Quick Actions */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2.5, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<History />}
                fullWidth
                onClick={() => navigate(isOrganizer ? '/organizer/events' : '/attendee/incidents')}
              >
                Incident History
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                <Circle sx={{ fontSize: 8, color: '#22C55E' }} />
                <Typography variant="caption" fontWeight={600}>Live</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Live Incident Feed */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h5" sx={{ mb: 1.5 }}>Live Ops Feed</Typography>
              {recentIncidents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 0.5 }} />
                  <Typography variant="body2" fontWeight={600}>All Systems Nominal</Typography>
                  <Typography variant="caption" color="text.secondary">No active incidents.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recentIncidents.map(incident => {
                    const statusColors: Record<string, string> = { OPEN: '#F59E0B', IN_PROGRESS: '#3B82F6', ESCALATED: '#DC2626', RESOLVED: '#22C55E' };
                    const color = statusColors[incident.status] || '#F59E0B';
                    return (
                      <Box
                        key={incident.incidentId}
                        onClick={() => {
                          if (isOrganizer) {
                            navigate(`/organizer/events/${incident.eventId}/incidents`);
                          }
                        }}
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          bgcolor: 'background.default',
                          borderLeft: `3px solid ${color}`,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderLeftColor: color,
                          borderLeftWidth: 3,
                          cursor: isOrganizer ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          '&:hover': isOrganizer ? { bgcolor: 'rgba(0,0,0,0.02)', borderColor: color } : {},
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color, fontWeight: 700, fontFamily: 'monospace' }}>
                            {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </Typography>
                          <Typography variant="overline" sx={{ fontSize: '0.55rem', fontWeight: 700 }}>{incident.status}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                          {incident.description || `${incident.incidentType} alert`}
                        </Typography>
                        {incident.eventName && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <LocationOn sx={{ fontSize: 11, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{incident.eventName}</Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h5" sx={{ mb: 1.5 }}>Safety Notifications</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="success.main" fontWeight={700}>SYSTEM</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>All safety modules active. Monitoring {events.length} events.</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="info.main" fontWeight={700}>INFO</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Auto-escalation enabled (5min/15min thresholds).</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Incident Creation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Report {selectedType} Incident</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2.5 }}>
            {selectedType && selectedType !== IncidentType.FOOD
              ? 'This is a HIGH priority alert. The event organizer will be notified immediately.'
              : 'The event organizer will be notified about your request.'}
          </DialogContentText>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>{error}</Alert>}
          <TextField fullWidth select label="Select Event" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} sx={{ mb: 2 }} helperText="Choose the event where you need assistance">
            {events.map(ev => (<MenuItem key={ev.eventId} value={ev.eventId}>{ev.title}</MenuItem>))}
          </TextField>
          <TextField fullWidth multiline rows={3} label="Description (Optional)" placeholder="Describe your situation..." value={description} onChange={e => setDescription(e.target.value)} sx={{ mb: 2 }} />
          {selectedType !== IncidentType.FOOD && (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <FormControlLabel
                control={<Switch checked={shareLocation} onChange={e => setShareLocation(e.target.checked)} color="primary" />}
                label={<Box><Typography variant="body2" fontWeight={500}>Share my location</Typography><Typography variant="caption" color="text.secondary">Help responders reach you faster</Typography></Box>}
              />
              {shareLocation && location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, ml: 5.5 }}>
                  <LocationOn sx={{ fontSize: 14, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main">Location acquired (±{Math.round(location.accuracy)}m)</Typography>
                </Box>
              )}
              {shareLocation && locationLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, ml: 5.5 }}>
                  <CircularProgress size={12} />
                  <Typography variant="caption" color="text.secondary">Getting location...</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseDialog} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color={selectedType === IncidentType.FOOD ? 'primary' : 'error'} disabled={isLoading || !selectedEventId}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Report Incident'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
