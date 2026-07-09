import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { LockReset, Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/AuthLayout';

// Step 1: Request reset code
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Step 2: Enter code and new password
const resetSchema = z
  .object({
    code: z.string().length(6, 'Code must be 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[0-9]/, 'Must include a number')
      .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, error, clearError } = useAuth();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) });

  const handleEmailSubmit = async (data: EmailFormData) => {
    try {
      clearError();
      setLoading(true);
      await forgotPassword({ email: data.email });
      setEmail(data.email);
      setStep('reset');
    } catch {
      // Error handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (data: ResetFormData) => {
    try {
      clearError();
      setLoading(true);
      await resetPassword({ email, code: data.code, newPassword: data.newPassword });
      navigate('/login', {
        state: { message: 'Password reset successful! Please sign in with your new password.' },
      });
    } catch {
      // Error handled by context
    } finally {
      setLoading(false);
    }
  };

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
                bgcolor: 'info.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LockReset sx={{ color: 'info.main', fontSize: 28 }} />
            </Box>
          </Box>

          <Typography variant="h3" align="center" gutterBottom>
            {step === 'email' ? 'Reset your password' : 'Set new password'}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            {step === 'email'
              ? "Enter your email and we'll send you a verification code."
              : `Enter the code sent to ${email} and choose a new password.`}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <Box
              component="form"
              onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
              noValidate
            >
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                autoFocus
                {...emailForm.register('email')}
                error={!!emailForm.formState.errors.email}
                helperText={emailForm.formState.errors.email?.message}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2.5, height: 48 }}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  'Send Reset Code →'
                )}
              </Button>
            </Box>
          )}

          {/* Step 2: Code + New Password */}
          {step === 'reset' && (
            <Box
              component="form"
              onSubmit={resetForm.handleSubmit(handleResetSubmit)}
              noValidate
            >
              <TextField
                fullWidth
                label="Verification Code"
                placeholder="000000"
                autoFocus
                {...resetForm.register('code')}
                error={!!resetForm.formState.errors.code}
                helperText={resetForm.formState.errors.code?.message}
                inputProps={{ maxLength: 6 }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                {...resetForm.register('newPassword')}
                error={!!resetForm.formState.errors.newPassword}
                helperText={resetForm.formState.errors.newPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(prev => !prev)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                {...resetForm.register('confirmPassword')}
                error={!!resetForm.formState.errors.confirmPassword}
                helperText={resetForm.formState.errors.confirmPassword?.message}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2.5, height: 48 }}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  'Reset Password →'
                )}
              </Button>
            </Box>
          )}

          <Typography variant="body2" align="center" color="text.secondary">
            <Link component={RouterLink} to="/login" fontWeight={600}>
              ← Back to Sign In
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
