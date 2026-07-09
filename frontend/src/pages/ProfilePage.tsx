import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Edit, Save, Notifications, Event, HealthAndSafety, QrCode2, Business, Language, Phone, People } from '@mui/icons-material';
import { updateUserAttributes } from 'aws-amplify/auth';
import { AppLayout } from '../components/layout';
import { useAuth } from '../auth/hooks/useAuth';
import { useNotifications } from '../features/notifications/hooks/useNotifications';
import { useMyRegistrations } from '../features/registration/hooks/useRegistration';
import { useOrganizerEvents } from '../features/events/hooks/useEvents';

export default function ProfilePage() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const { registrations } = useMyRegistrations();
  const { events: organizerEvents, metrics: organizerMetrics } = useOrganizerEvents();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleSave = async () => {
    if (!name.trim() || name.trim() === user?.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserAttributes({ userAttributes: { name: name.trim() } });
      setSuccess('Profile updated! Changes will appear on next sign-in.');
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const recentNotifications = notifications.slice(0, 5);
  const totalRegistrations = registrations.length;
  const checkedInCount = registrations.filter(r => r.checkedIn).length;

  return (
    <AppLayout title="Profile">
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Left Column — Main Content */}
        <Grid item xs={12} md={8}>
          {/* Profile Header Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  {editing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <TextField
                        value={name}
                        onChange={e => setName(e.target.value)}
                        size="small"
                        label="Name"
                        sx={{ width: 250 }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={saving ? <CircularProgress size={14} /> : <Save />}
                        onClick={handleSave}
                        disabled={saving}
                      >
                        Save
                      </Button>
                      <Button size="small" onClick={() => { setEditing(false); setName(user?.name || ''); }}>
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Typography variant="h2" sx={{ mb: 0.5 }}>{user?.name}</Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong> • {user?.email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!editing && (
                    <Button variant="outlined" size="small" startIcon={<Edit />} onClick={() => setEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Stats pills */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2.5 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', width: '100%', mb: 0.5 }}>
                  MY ACTIVITY
                </Typography>
                {user?.role === 'organizer' ? (
                  <>
                    <Chip icon={<Event />} label={`${organizerMetrics?.totalEvents ?? 0} Events Created`} size="small" variant="outlined" />
                    <Chip icon={<Notifications />} label={`${notifications.length} Notifications`} size="small" variant="outlined" />
                    <Chip icon={<HealthAndSafety />} label="Organizer" size="small" color="primary" />
                  </>
                ) : (
                  <>
                    <Chip icon={<Event />} label={`${totalRegistrations} Registrations`} size="small" variant="outlined" />
                    <Chip icon={<QrCode2 />} label={`${checkedInCount} Check-ins`} size="small" variant="outlined" />
                    <Chip icon={<HealthAndSafety />} label="Attendee" size="small" color="primary" />
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Event Summary Card — role-specific */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(20,184,166,0.05) 0%, rgba(27,94,75,0.08) 100%)' }}>
            <CardContent sx={{ p: 3 }}>
              <Chip
                label={user?.role === 'organizer' ? 'ORGANIZER OVERVIEW' : 'EVENT ACTIVITY'}
                size="small"
                sx={{ mb: 1.5, bgcolor: 'rgba(20,184,166,0.12)', color: 'secondary.main', fontWeight: 600, fontSize: '0.65rem' }}
              />
              <Typography variant="h3" sx={{ mb: 1 }}>
                {user?.role === 'organizer' ? `Event management for ${user?.name}` : `Event engagement for ${user?.name}`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user?.role === 'organizer'
                  ? 'A summary of events you have created and managed on CloudVigil.'
                  : 'A summary of your event participation, registrations, and safety interactions on the CloudVigil platform.'}
              </Typography>

              {user?.role === 'organizer' ? (
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, minWidth: 120, textAlign: 'center' }}>
                    <Typography variant="h2" color="primary.main">{organizerMetrics?.totalEvents ?? organizerEvents.length}</Typography>
                    <Typography variant="caption" color="text.secondary">Events Created</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, minWidth: 120, textAlign: 'center' }}>
                    <Typography variant="h2" color="success.main">{notifications.length}</Typography>
                    <Typography variant="caption" color="text.secondary">Total Notifications</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, minWidth: 120, textAlign: 'center' }}>
                    <Typography variant="h2" color="secondary.main">{unreadCount}</Typography>
                    <Typography variant="caption" color="text.secondary">Pending Actions</Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, minWidth: 120, textAlign: 'center' }}>
                    <Typography variant="h2" color="primary.main">{totalRegistrations}</Typography>
                    <Typography variant="caption" color="text.secondary">Events Registered</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, minWidth: 120, textAlign: 'center' }}>
                    <Typography variant="h2" color="success.main">{checkedInCount}</Typography>
                    <Typography variant="caption" color="text.secondary">Events Attended</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, minWidth: 120, textAlign: 'center' }}>
                    <Typography variant="h2" color="secondary.main">
                      {totalRegistrations > 0 ? Math.round((checkedInCount / totalRegistrations) * 100) : 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Attendance Rate</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Organizer Profile — from onboarding */}
          {user?.role === 'organizer' && (() => {
            const raw = localStorage.getItem('organizer-onboarding');
            if (!raw) return null;
            try {
              const data = JSON.parse(raw);
              return (
                <Card sx={{ mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                      <Business sx={{ color: 'secondary.main', fontSize: 20 }} />
                      <Typography variant="h4">Organization Profile</Typography>
                      <Chip label="Verified" size="small" color="success" sx={{ ml: 'auto', fontSize: '0.65rem', height: 22 }} />
                    </Box>

                    {data.orgName && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>Organization</Typography>
                        <Typography variant="body1" fontWeight={600}>{data.orgName}</Typography>
                      </Box>
                    )}

                    {data.orgWebsite && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>Website</Typography>
                        <Typography variant="body2" component="a" href={data.orgWebsite} target="_blank" rel="noopener" sx={{ color: 'secondary.main', textDecoration: 'none' }}>
                          {data.orgWebsite}
                        </Typography>
                      </Box>
                    )}

                    {data.orgDescription && (
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>About</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{data.orgDescription}</Typography>
                      </Box>
                    )}

                    {data.eventTypes && data.eventTypes.length > 0 && (
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block', mb: 1 }}>Event Types</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {data.eventTypes.map((t: string) => (
                            <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {data.audience && data.audience.length > 0 && (
                      <Box sx={{ mb: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <People sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>Target Audience</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {data.audience.map((a: string) => (
                            <Chip key={a} label={a} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {data.eventScale && (
                        <Box>
                          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block' }}>Events/Year</Typography>
                          <Typography variant="body2" fontWeight={600}>{data.eventScale}</Typography>
                        </Box>
                      )}
                      {data.country && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Language sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block' }}>Country</Typography>
                            <Typography variant="body2" fontWeight={600}>{data.country}</Typography>
                          </Box>
                        </Box>
                      )}
                      {data.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block' }}>Phone</Typography>
                            <Typography variant="body2" fontWeight={600}>{data.phone}</Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            } catch { return null; }
          })()}
        </Grid>

        {/* Right Column — Sidebar Widgets */}
        <Grid item xs={12} md={4}>
          {/* Profile Card */}
          <Card sx={{ mb: 2.5, textAlign: 'center' }}>
            <CardContent sx={{ p: 3 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  mx: 'auto',
                  mb: 1.5,
                }}
              >
                {initials}
              </Avatar>
              <Typography variant="body1" fontWeight={600}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notifications sx={{ fontSize: 18, color: 'secondary.main' }} />
                  <Typography variant="h5">Recent Notifications</Typography>
                </Box>
                {unreadCount > 0 && (
                  <Chip label={`${unreadCount} new`} size="small" color="error" sx={{ fontSize: '0.6rem', height: 20 }} />
                )}
              </Box>

              {recentNotifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Notifications sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
                  <Typography variant="caption" color="text.disabled">You're all caught up!</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recentNotifications.map(n => (
                    <Box
                      key={n.notificationId}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: n.readAt ? 'transparent' : 'rgba(20,184,166,0.04)',
                        borderLeft: n.readAt ? 'none' : '3px solid',
                        borderColor: 'secondary.main',
                      }}
                    >
                      <Typography variant="caption" fontWeight={n.readAt ? 400 : 600} sx={{ display: 'block' }}>
                        {n.title}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h5" sx={{ mb: 1.5 }}>Quick Stats</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Total Registrations</Typography>
                  <Typography variant="body2" fontWeight={600}>{totalRegistrations}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Events Attended</Typography>
                  <Typography variant="body2" fontWeight={600}>{checkedInCount}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Notifications</Typography>
                  <Typography variant="body2" fontWeight={600}>{notifications.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AppLayout>
  );
}
