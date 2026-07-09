import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Popover,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  Logout,
  Person,
  Circle,
  DarkMode,
  LightMode,
  Search,
  Language,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNotifications } from '../../features/notifications/hooks/useNotifications';
import { useThemeMode } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../../i18n';
import { layout } from '../../theme/tokens';
import SafetyAlarm from '../common/SafetyAlarm';

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
  collapsed?: boolean;
}

export default function TopBar({ title, onMenuClick, collapsed = false }: TopBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead } = useNotifications();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const { i18n } = useTranslation();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleMenuClose();
    signOut();
  };

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(event.currentTarget);
    fetchNotifications();
  };

  const handleNotifClose = () => {
    setNotifAnchor(null);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: isMobile ? '100%' : `calc(100% - ${collapsed ? layout.sidebarCollapsed : layout.sidebarWidth}px)`,
        ml: isMobile ? 0 : `${collapsed ? layout.sidebarCollapsed : layout.sidebarWidth}px`,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        height: layout.topBarHeight,
        transition: 'width 0.25s ease-in-out, margin-left 0.25s ease-in-out',
      }}
    >
      <Toolbar sx={{ height: layout.topBarHeight, px: { xs: 2, md: 3 } }}>
        {isMobile && (
          <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1.5, color: 'text.primary' }} aria-label="open menu">
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h4" sx={{ flexGrow: 0, fontWeight: 600, mr: 2, whiteSpace: 'nowrap' }}>
          {title}
        </Typography>

        {/* Search Bar */}
        <TextField
          size="small"
          placeholder="Search events, venues, or status..."
          sx={{
            flex: 1,
            mx: 2,
            display: { xs: 'none', sm: 'block' },
            '& .MuiOutlinedInput-root': {
              height: 36,
              borderRadius: 2,
              fontSize: '0.8rem',
              bgcolor: 'background.default',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value.trim();
              if (value) {
                const path = user?.role === 'organizer' ? '/organizer/events' : '/attendee/events';
                navigate(`${path}?search=${encodeURIComponent(value)}`);
              }
            }
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Theme Toggle */}
          <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }} aria-label="toggle theme">
            {mode === 'dark' ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
          </IconButton>

          {/* Language Toggle */}
          <Tooltip title="Language">
            <IconButton
              onClick={e => setLangAnchor(e.currentTarget)}
              sx={{ color: 'text.secondary' }}
              aria-label="change language"
            >
              <Language sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={langAnchor}
            open={Boolean(langAnchor)}
            onClose={() => setLangAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{ sx: { mt: 1, minWidth: 180, borderRadius: 2, maxHeight: 320 } }}
          >
            {supportedLanguages.map(lang => (
              <MenuItem
                key={lang.code}
                selected={i18n.language?.startsWith(lang.code)}
                onClick={() => { i18n.changeLanguage(lang.code); setLangAnchor(null); }}
                sx={{ fontSize: '0.85rem', py: 1 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography variant="body2">{lang.nativeLabel}</Typography>
                  <Typography variant="caption" color="text.secondary">{lang.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          {/* Safety Alarm — for organizers with escalated incidents */}
          {user?.role === 'organizer' && (
            <SafetyAlarm
              active={notifications.some(n => !n.readAt && (n.notificationType === 'SAFETY_ESCALATION' || n.notificationType === 'SAFETY_CRITICAL'))}
              count={notifications.filter(n => !n.readAt && (n.notificationType === 'SAFETY_ESCALATION' || n.notificationType === 'SAFETY_CRITICAL')).length}
              onClick={() => navigate('/safety')}
              onDismiss={() => {
                // Mark all escalation notifications as read
                notifications
                  .filter(n => !n.readAt && (n.notificationType === 'SAFETY_ESCALATION' || n.notificationType === 'SAFETY_CRITICAL'))
                  .forEach(n => markAsRead(n.notificationId));
              }}
            />
          )}

          {/* Notifications Bell */}
          <IconButton aria-label="notifications" sx={{ color: 'text.secondary' }} onClick={handleNotifOpen}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <Notifications sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>

          {/* User Info + Avatar */}
          <Box
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              pl: 1.5,
              borderLeft: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.7rem' }}>
                {user?.role === 'organizer' ? 'Event Organizer' : 'Attendee'}
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.main',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: '2px solid',
                borderColor: 'rgba(20,184,166,0.3)',
              }}
            >
              {initials}
            </Avatar>
          </Box>

          {/* User Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{ sx: { mt: 1, minWidth: 200, borderRadius: 2 } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
              <Person sx={{ mr: 1.5, fontSize: 18, color: 'text.secondary' }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <Logout sx={{ mr: 1.5, fontSize: 18, color: 'text.secondary' }} /> Sign Out
            </MenuItem>
          </Menu>

          {/* Notification Popover */}
          <Popover
            open={Boolean(notifAnchor)}
            anchorEl={notifAnchor}
            onClose={handleNotifClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: 380, maxHeight: 520, borderRadius: 3, mt: 1, border: '1px solid', borderColor: 'divider' } }}
          >
            {/* Header */}
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h4">Notifications</Typography>
              <Typography
                variant="overline"
                sx={{ color: 'secondary.main', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}
                onClick={async () => {
                  try {
                    const { notificationService } = await import('../../features/notifications/services/notificationService');
                    await notificationService.markAllAsRead();
                    fetchNotifications();
                  } catch { /* silent */ }
                }}
              >
                CLEAR ALL
              </Typography>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Notifications sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
              </Box>
            ) : (
              <>
                {/* Today label */}
                <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
                  <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>TODAY</Typography>
                </Box>

                <Box sx={{ maxHeight: 380, overflow: 'auto', px: 1.5, pb: 1.5 }}>
                  {notifications.slice(0, 15).map(notif => {
                    const isUnread = !notif.readAt;
                    const typeColors: Record<string, string> = {
                      REGISTRATION: '#14B8A6',
                      SAFETY_ESCALATION: '#DC2626',
                      SAFETY_INCIDENT: '#DC2626',
                      CROWD_ALERT: '#F59E0B',
                      EVENT_CANCELLED: '#EF4444',
                      EVENT_UPDATE: '#3B82F6',
                      EVENT_CREATED: '#14B8A6',
                      CHECKIN: '#22C55E',
                    };
                    const chipColor = typeColors[notif.notificationType] || '#14B8A6';

                    return (
                      <Box
                        key={notif.notificationId}
                        onClick={() => { if (!notif.readAt) markAsRead(notif.notificationId); }}
                        sx={{
                          p: 2,
                          my: 1,
                          borderRadius: 2,
                          cursor: 'pointer',
                          border: isUnread ? '1.5px solid' : '1px solid',
                          borderColor: isUnread ? 'rgba(20,184,166,0.3)' : 'divider',
                          bgcolor: isUnread ? 'rgba(20,184,166,0.02)' : 'transparent',
                          opacity: isUnread ? 1 : 0.6,
                          transition: 'all 0.2s ease',
                          '&:hover': { opacity: 1, borderColor: 'rgba(20,184,166,0.5)' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          {/* Dot */}
                          <Circle sx={{ fontSize: 10, color: isUnread ? chipColor : 'text.disabled', mt: 0.75, flexShrink: 0 }} />

                          <Box sx={{ flex: 1 }}>
                            {/* Type + NEW badge + time */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: chipColor, textTransform: 'uppercase' }}>
                                {notif.notificationType.replace(/_/g, ' ')}
                              </Typography>
                              {isUnread && (
                                <Chip label="NEW" size="small" sx={{ fontSize: '0.5rem', height: 16, fontWeight: 700, bgcolor: 'secondary.main', color: 'white' }} />
                              )}
                              <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto', fontSize: '0.7rem' }}>
                                {formatTimeAgo(notif.createdAt)}
                              </Typography>
                            </Box>

                            {/* Title */}
                            <Typography variant="body2" fontWeight={isUnread ? 700 : 400} sx={{ mb: 0.25 }}>
                              {notif.title}
                            </Typography>

                            {/* Message */}
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                              {notif.message}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                {/* Footer */}
                <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'secondary.main', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                    onClick={() => { handleNotifClose(); navigate('/notifications'); }}
                  >
                    View All Notifications →
                  </Typography>
                </Box>
              </>
            )}
          </Popover>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
