import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { Block } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

/**
 * Unauthorized access page.
 * Shown when a user tries to access a route their role doesn't permit.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (user) {
      const path =
        user.role === UserRole.ORGANIZER ? '/organizer/dashboard' : '/attendee/dashboard';
      navigate(path, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'error.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Block sx={{ color: 'error.main', fontSize: 40 }} />
      </Box>

      <Typography variant="h2" gutterBottom>
        Access Denied
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: 400, mb: 4 }}
      >
        You don&apos;t have permission to access this page.
        Please contact an administrator if you believe this is an error.
      </Typography>

      <Button variant="contained" size="large" onClick={handleGoBack}>
        Go to Dashboard
      </Button>
    </Box>
  );
}
