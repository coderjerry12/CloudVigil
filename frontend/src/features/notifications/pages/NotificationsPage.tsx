import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Skeleton, Button,
  Dialog, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import { Circle, Notifications as NotifIcon, Close, FiberNew } from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../types';

export default function NotificationsPage() {
  const { notifications, isLoading, fetchNotifications, markAsRead } = useNotifications();
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  if (notifications.length === 0 && !isLoading) {
    fetchNotifications();
  }

  const typeColors: Record<string, string> = {
    REGISTRATION: '#14B8A6',
    SAFETY_ESCALATION: '#DC2626',
    SAFETY_INCIDENT: '#DC2626',
    CROWD_ALERT: '#F59E0B',
    EVENT_CANCELLED: '#EF4444',
    EVENT_UPDATE: '#3B82F6',
    EVENT_CREATED: '#14B8A6',
    CHECKIN: '#22C55E',
    REMINDER_24H: '#8B5CF6',
    REMINDER_1H: '#8B5CF6',
  };

  const handleNotifClick = (notif: Notification) => {
    setSelectedNotif(notif);
    if (!notif.readAt) {
      markAsRead(notif.notificationId);
    }
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <AppLayout title="Notifications">
      <Box sx={{ maxWidth: 700 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h2">All Notifications</Typography>
            <Typography variant="body2" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => notifications.forEach(n => { if (!n.readAt) markAsRead(n.notificationId); })}
            >
              Mark All Read
            </Button>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={80} />)}
          </Box>
        ) : notifications.length === 0 ? (
          <Card sx={{ textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <NotifIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="h4" gutterBottom>No notifications</Typography>
              <Typography variant="body2" color="text.secondary">You're all caught up!</Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {notifications.map(notif => {
              const color = typeColors[notif.notificationType] || '#14B8A6';
              const isUnread = !notif.readAt;

              return (
                <Card
                  key={notif.notificationId}
                  onClick={() => handleNotifClick(notif)}
                  sx={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${isUnread ? color : 'transparent'}`,
                    bgcolor: isUnread ? 'rgba(20,184,166,0.03)' : 'transparent',
                    opacity: isUnread ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      opacity: 1,
                      transform: 'translateX(4px)',
                      boxShadow: `0 2px 8px ${color}20`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid', borderColor: `${color}30` }}>
                      {isUnread ? <FiberNew sx={{ fontSize: 16, color }} /> : <Circle sx={{ fontSize: 8, color }} />}
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip label={notif.notificationType.replace(/_/g, ' ')} size="small" sx={{ fontSize: '0.55rem', height: 18, fontWeight: 700, bgcolor: `${color}20`, color }} />
                        {isUnread && <Chip label="NEW" size="small" sx={{ fontSize: '0.5rem', height: 16, fontWeight: 700, bgcolor: 'error.main', color: 'white' }} />}
                        <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                          {new Date(notif.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={isUnread ? 700 : 400}>{notif.title}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{notif.message}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Notification Detail Popup */}
      <Dialog
        open={Boolean(selectedNotif)}
        onClose={() => setSelectedNotif(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' } }}
      >
        {selectedNotif && (
          <DialogContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Chip
                label={selectedNotif.notificationType.replace(/_/g, ' ')}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: `${typeColors[selectedNotif.notificationType] || '#14B8A6'}20`,
                  color: typeColors[selectedNotif.notificationType] || '#14B8A6',
                }}
              />
              <IconButton size="small" onClick={() => setSelectedNotif(null)}>
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Typography variant="h3" sx={{ mb: 1 }}>{selectedNotif.title}</Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>{selectedNotif.message}</Typography>

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Received</Typography>
                <Typography variant="caption" fontWeight={600}>
                  {new Date(selectedNotif.createdAt).toLocaleString()}
                </Typography>
              </Box>
              {selectedNotif.readAt && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">Read</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {new Date(selectedNotif.readAt).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 4, pb: 3 }}>
          <Button onClick={() => setSelectedNotif(null)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
