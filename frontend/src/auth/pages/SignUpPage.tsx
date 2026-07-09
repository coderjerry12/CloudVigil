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
  InputAdornment,
  IconButton,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Business } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import AuthLayout from '../components/AuthLayout';
import CloudVigilLogo from '../../components/common/CloudVigilLogo';

const signUpSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[0-9]/, 'Must include a number')
      .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
    confirmPassword: z.string(),
    role: z.nativeEnum(UserRole),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: UserRole.ATTENDEE,
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      clearError();
      const result = await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
      });

      if (result.requiresConfirmation) {
        navigate('/verify-email', { state: { email: data.email } });
      } else {
        navigate('/login', { state: { message: 'Account created! You can now sign in.' } });
      }
    } catch {
      // Error handled in context
    }
  };

  return (
    <AuthLayout>
      <Card
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
          border: 'none',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
            <CloudVigilLogo size={48} />
          </Box>

          <Typography variant="h3" align="center" gutterBottom>
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Join CloudVigil to manage or attend events safely.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Role Selection */}
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', mb: 1, display: 'block' }}
            >
              I want to
            </Typography>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <ToggleButtonGroup
                  value={field.value}
                  exclusive
                  onChange={(_, newValue) => {
                    if (newValue) field.onChange(newValue);
                  }}
                  fullWidth
                  sx={{ mb: 3 }}
                >
                  <ToggleButton
                    value={UserRole.ATTENDEE}
                    aria-label="Attend events"
                    sx={{
                      py: 1.5,
                      borderRadius: '8px !important',
                      border: '1.5px solid',
                      borderColor: 'divider',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderColor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                    }}
                  >
                    <Person sx={{ mr: 1, fontSize: 20 }} />
                    Attend Events
                  </ToggleButton>
                  <ToggleButton
                    value={UserRole.ORGANIZER}
                    aria-label="Organize events"
                    sx={{
                      py: 1.5,
                      borderRadius: '8px !important',
                      border: '1.5px solid',
                      borderColor: 'divider',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderColor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                    }}
                  >
                    <Business sx={{ mr: 1, fontSize: 20 }} />
                    Organize Events
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
            />

            <TextField
              fullWidth
              label="Full Name"
              autoComplete="name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
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
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
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
              {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Create Account →'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
