import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard,
  Event,
  QrCodeScanner,
  HealthAndSafety,
  Analytics,
  Settings,
  Person,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useAuth } from '../../auth/hooks/useAuth';
import { UserRole } from '../../auth/types';
import { layout, colors } from '../../theme/tokens';
import CloudVigilLogo from '../common/CloudVigilLogo';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  labelKey: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/organizer/dashboard', icon: <Dashboard />, roles: [UserRole.ORGANIZER] },
  { labelKey: 'nav.dashboard', path: '/attendee/dashboard', icon: <Dashboard />, roles: [UserRole.ATTENDEE] },
  { labelKey: 'nav.myEvents', path: '/organizer/events', icon: <Event />, roles: [UserRole.ORGANIZER] },
  { labelKey: 'nav.browseEvents', path: '/attendee/events', icon: <Event />, roles: [UserRole.ATTENDEE] },
  { labelKey: 'nav.myTickets', path: '/attendee/tickets', icon: <QrCodeScanner />, roles: [UserRole.ATTENDEE] },
  { labelKey: 'nav.qrCheckin', path: '/organizer/checkin', icon: <QrCodeScanner />, roles: [UserRole.ORGANIZER] },
  { labelKey: 'nav.safetyCenter', path: '/safety', icon: <HealthAndSafety />, roles: [UserRole.ORGANIZER, UserRole.ATTENDEE] },
  { labelKey: 'nav.analytics', path: '/organizer/analytics', icon: <Analytics />, roles: [UserRole.ORGANIZER] },
];

const bottomNavItems: NavItem[] = [
  { labelKey: 'nav.settings', path: '/settings', icon: <Settings />, roles: [UserRole.ORGANIZER, UserRole.ATTENDEE] },
  { labelKey: 'nav.profile', path: '/profile', icon: <Person />, roles: [UserRole.ORGANIZER, UserRole.ATTENDEE] },
];

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const userRole = user?.role;
  const currentWidth = collapsed ? layout.sidebarCollapsed : layout.sidebarWidth;

  const filteredNavItems = navItems.filter(item => userRole && item.roles.includes(userRole));
  const filteredBottomItems = bottomNavItems.filter(item => userRole && item.roles.includes(userRole));

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: colors.background.dark,
        transition: 'width 0.25s ease-in-out',
        overflow: 'hidden',
      }}
    >
      {/* Logo Header */}
      <Box
        sx={{
          height: layout.topBarHeight,
          display: 'flex',
          alignItems: 'center',
          px: collapsed ? 0 : 2.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1.5,
        }}
      >
        <CloudVigilLogo size={collapsed ? 28 : 32} />
        {!collapsed && (
          <Typography
            variant="h5"
            sx={{
              color: colors.text.inverse,
              fontWeight: 700,
              letterSpacing: '-0.3px',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
            }}
          >
            CloudVigil
          </Typography>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Main Navigation */}
      <List sx={{ flex: 1, py: 1.5 }}>
        {filteredNavItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip
              key={item.path}
              title={collapsed ? t(item.labelKey) : ''}
              placement="right"
              arrow
            >
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  mx: collapsed ? 1 : 1.5,
                  mb: 0.5,
                  py: 1.2,
                  px: collapsed ? 1.5 : 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? colors.secondary.light : 'rgba(255,255,255,0.6)',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(20, 184, 166, 0.12)',
                    borderLeft: collapsed ? 'none' : `3px solid ${colors.secondary.main}`,
                    color: colors.secondary.light,
                    '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.18)' },
                  },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: collapsed ? 0 : 36,
                    justifyContent: 'center',
                    '& .MuiSvgIcon-root': { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={t(item.labelKey)}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* Bottom Navigation */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List sx={{ py: 1 }}>
        {filteredBottomItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip
              key={item.path}
              title={collapsed ? t(item.labelKey) : ''}
              placement="right"
              arrow
            >
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  mx: collapsed ? 1 : 1.5,
                  mb: 0.5,
                  py: 1,
                  px: collapsed ? 1.5 : 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? colors.secondary.light : 'rgba(255,255,255,0.5)',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(20, 184, 166, 0.12)',
                    color: colors.secondary.light,
                  },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: collapsed ? 0 : 36,
                    justifyContent: 'center',
                    '& .MuiSvgIcon-root': { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={t(item.labelKey)}
                    primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 400, whiteSpace: 'nowrap' }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* Collapse Toggle Button */}
      {!isMobile && (
        <>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: collapsed ? 'center' : 'flex-end',
              p: 1,
            }}
          >
            <IconButton
              onClick={onToggleCollapse}
              size="small"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              sx={{
                color: 'rgba(255,255,255,0.5)',
                '&:hover': { color: colors.secondary.light, bgcolor: 'rgba(20,184,166,0.12)' },
              }}
            >
              {collapsed ? <ChevronRight sx={{ fontSize: 20 }} /> : <ChevronLeft sx={{ fontSize: 20 }} />}
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={onClose}
      sx={{
        width: isMobile ? layout.sidebarWidth : currentWidth,
        flexShrink: 0,
        transition: 'width 0.25s ease-in-out',
        '& .MuiDrawer-paper': {
          width: isMobile ? layout.sidebarWidth : currentWidth,
          bgcolor: colors.background.dark,
          borderRight: 'none',
          boxSizing: 'border-box',
          transition: 'width 0.25s ease-in-out',
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
