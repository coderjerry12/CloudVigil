import { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { layout } from '../../theme/tokens';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

/**
 * Main application layout shell.
 * Provides persistent sidebar + top navigation bar + scrollable content area.
 * Responsive: sidebar collapses to drawer on mobile.
 */
export default function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar — permanent drawer takes space in flex layout */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area — no marginLeft needed, flex handles it */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.25s ease-in-out',
        }}
      >
        {/* TopBar */}
        <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} collapsed={collapsed} />

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            mt: `${layout.topBarHeight}px`,
            p: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
