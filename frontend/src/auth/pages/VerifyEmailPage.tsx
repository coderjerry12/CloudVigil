import { useState } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { MarkEmailRead } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import AuthLayout from '../components/AuthLayout';

const verifySchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';
  const { confirmSignUp, isLoading, error, clearError } = useAuth();
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: VerifyFormData) => {
    try {
      clearError();
      await confirmSignUp({ email, code: data.code });
      navigate('/login', {
        state: { message: 'Email verified successfully! You can now sign in.' },
      });
    } catch {
      // Error handled by context
    }
  };

  const handleResendCode = async () => {
    try {
      setResending(true);
      setResendSuccess(false);
      clearError();
      await authService.resendConfirmationCode(email);
      setResendSuccess(true);
    } catch {
      // Silently fail — user can try again
    } finally {
      setResending(false);
    }
  };

  // If no email in state, redirect to signup
  if (!email) {
    return (
      <AuthLayout>
        <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 3, border: 'none' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              No email provided
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please sign up first to receive a verification code.
            </Typography>
            <Button component={RouterLink} to="/signup" variant="contained" size="large">
              Go to Sign Up
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
          border: 'none',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Icon */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'success.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MarkEmailRead sx={{ color: 'success.main', fontSize: 28 }} />
            </Box>
          </Box>

          <Typography variant="h3" align="center" gutterBottom>
            Verify your email
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            We sent a 6-digit verification code to{' '}
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {email}
            </Box>
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          {resendSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              A new code has been sent to your email.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              fullWidth
              label="Verification Code"
              placeholder="000000"
              autoFocus
              {...register('code')}
              error={!!errors.code}
              helperText={errors.code?.message}
              inputProps={{
                maxLength: 6,
                style: { letterSpacing: '8px', textAlign: 'center', fontSize: '1.25rem' },
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mb: 2.5, height: 48 }}
            >
              {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Verify Account →'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Didn&apos;t receive the code?{' '}
              <Link
                component="button"
                variant="body2"
                fontWeight={600}
                onClick={handleResendCode}
                disabled={resending}
                sx={{ cursor: 'pointer' }}
              >
                {resending ? 'Sending...' : 'Resend code'}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
