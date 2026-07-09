import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface GuestRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard for auth pages (login, signup, etc.).
 * Redirects authenticated users to their role-specific dashboard.
 * Only shows loading spinner during initial session check — NOT during
 * auth operations (sign in, forgot password, etc.) to avoid unmounting children.
 */
export default function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Only block rendering on initial load (when we don't know auth state yet).
  // Once we've determined the user is not authenticated, always render children
  // even if isLoading is true (e.g., during a forgotPassword call).
  if (isLoading && !isAuthenticated && user === null) {
    // This condition is only true on first mount while checking session.
    // After session check completes, user will be null and isLoading false,
    // so subsequent isLoading=true (from auth actions) won't trigger this.
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (isAuthenticated && user) {
    const redirectPath =
      user.role === UserRole.ORGANIZER ? '/organizer/dashboard' : '/attendee/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
