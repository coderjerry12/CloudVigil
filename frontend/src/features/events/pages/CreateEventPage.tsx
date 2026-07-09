import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Info, Schedule, Security, People, School, Image as ImageIcon, ViewAgenda } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '../../../components/layout';
import { useOrganizerEvents } from '../hooks/useEvents';
import { EventCategory } from '../types';
import type { EventSession } from '../types';
import EventImageUpload from '../components/EventImageUpload';
import SessionsManager from '../components/SessionsManager';

const createEventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description too long'),
    category: z.nativeEnum(EventCategory, { errorMap: () => ({ message: 'Select a category' }) }),
    venue: z.string().min(3, 'Venue must be at least 3 characters').max(200, 'Venue too long'),
    eventDate: z.string().min(1, 'Event date is required'),
    registrationDeadline: z.string().min(1, 'Registration deadline is required'),
    capacity: z.coerce
      .number()
      .int('Capacity must be a whole number')
      .min(1, 'Capacity must be at least 1')
      .max(100000, 'Capacity too large'),
    tags: z.string().max(200, 'Tags too long').optional(),
    requirements: z.string().max(1000, 'Requirements too long').optional(),
    accessCode: z.string().max(50, 'Access code too long').optional(),
    // Organiser Details
    organiserName: z.string().max(100).optional(),
    organiserEmail: z.string().email('Invalid email').max(200).optional().or(z.literal('')),
    organiserPhone: z.string().max(20).optional(),
    organiserOrganization: z.string().max(200).optional(),
    organiserBio: z.string().max(500).optional(),
    organiserPhotoUrl: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
    // Trainer Details
    trainerName: z.string().max(100).optional(),
    trainerEmail: z.string().email('Invalid email').max(200).optional().or(z.literal('')),
    trainerPhone: z.string().max(20).optional(),
    trainerExpertise: z.string().max(200).optional(),
    trainerBio: z.string().max(500).optional(),
    trainerLinkedin: z.string().max(300).optional(),
    trainerPhotoUrl: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  })
  .refine(
    data => {
      if (!data.eventDate) return true;
      return new Date(data.eventDate) > new Date();
    },
    { message: 'Event date must be in the future', path: ['eventDate'] }
  )
  .refine(
    data => {
      if (!data.eventDate || !data.registrationDeadline) return true;
      return new Date(data.registrationDeadline) < new Date(data.eventDate);
    },
    { message: 'Registration deadline must be before the event date', path: ['registrationDeadline'] }
  );

type CreateEventFormData = z.infer<typeof createEventSchema>;

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { createEvent } = useOrganizerEvents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [waitlistEnabled, setWaitlistEnabled] = useState(true);

  // Check for clone data from sessionStorage
  const cloneData = (() => {
    try {
      const raw = sessionStorage.getItem('clone-event');
      if (raw) {
        sessionStorage.removeItem('clone-event');
        return JSON.parse(raw);
      }
    } catch { /* ignore */ }
    return null;
  })();

  // Load onboarding profile for auto-fill
  const onboardingProfile = (() => {
    try {
      const raw = localStorage.getItem('organizer-onboarding');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: cloneData?.title || '',
      description: cloneData?.description || '',
      category: cloneData?.category || undefined,
      venue: cloneData?.venue || '',
      capacity: cloneData?.capacity || undefined,
      requirements: cloneData?.requirements || '',
      tags: '',
      accessCode: '',
      organiserName: onboardingProfile?.orgName || '',
      organiserEmail: '',
      organiserPhone: onboardingProfile?.phone || '',
      organiserOrganization: onboardingProfile?.orgName || '',
      organiserBio: '',
      organiserPhotoUrl: '',
      trainerName: '',
      trainerEmail: '',
      trainerPhone: '',
      trainerExpertise: '',
      trainerBio: '',
      trainerLinkedin: '',
      trainerPhotoUrl: '',
    },
  });

  const onSubmit = async (data: CreateEventFormData) => {
    setLoading(true);
    setError(null);
    try {
      const organiserDetails = data.organiserName
        ? {
            name: data.organiserName,
            email: data.organiserEmail || undefined,
            phone: data.organiserPhone || undefined,
            organization: data.organiserOrganization || undefined,
            bio: data.organiserBio || undefined,
            photoUrl: data.organiserPhotoUrl || undefined,
          }
        : undefined;

      const trainerDetails = data.trainerName
        ? {
            name: data.trainerName,
            email: data.trainerEmail || undefined,
            phone: data.trainerPhone || undefined,
            expertise: data.trainerExpertise || undefined,
            bio: data.trainerBio || undefined,
            linkedin: data.trainerLinkedin || undefined,
            photoUrl: data.trainerPhotoUrl || undefined,
          }
        : undefined;

      await createEvent({
        title: data.title,
        description: data.description,
        category: data.category,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        venue: data.venue,
        eventDate: new Date(data.eventDate).toISOString(),
        registrationDeadline: new Date(data.registrationDeadline).toISOString(),
        capacity: data.capacity,
        requirements: data.requirements,
        imageUrl: imageUrl || undefined,
        accessCode: data.accessCode?.trim() || undefined,
        waitlistEnabled,
        sessions: sessions.length > 0 ? sessions.filter(s => s.title) : undefined,
        organiserDetails,
        trainerDetails,
      });
      navigate('/organizer/events', { state: { message: 'Event created successfully!' } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // Watch form values for live preview
  const watchedValues = watch();

  return (
    <AppLayout title="Create Event">
      <Box sx={{ display: 'flex', gap: 3 }}>
      {/* Left: Form */}
      <Box sx={{ flex: 1, maxWidth: 700 }}>
        {/* Page Header */}
        <Typography variant="h2" sx={{ mb: 0.5 }}>Create New Event</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Fill in the systematic operational details below to register a new security-monitored event.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Section: Basic Information */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Info sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography variant="overline" sx={{ color: 'secondary.main' }}>Basic Information</Typography>
          </Box>

          {/* Event Banner Image */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <ImageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" fontWeight={600}>Event Banner Image (Optional)</Typography>
          </Box>
          <EventImageUpload
            imageUrl={imageUrl}
            onImageUploaded={(url) => setImageUrl(url)}
            onImageRemoved={() => setImageUrl(null)}
          />

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Event Title</Typography>
          <TextField
            fullWidth
            placeholder="e.g., Tech Summit 2024 - North Hall"
            {...register('title')}
            error={!!errors.title}
            helperText={errors.title?.message}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="body2" fontWeight={600}>Description</Typography>
            <Button
              size="small"
              variant="outlined"
              disabled={aiSuggesting || !watchedValues.title}
              onClick={async () => {
                setAiSuggesting(true);
                try {
                  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/suggest-description`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: (await import('aws-amplify/auth').then(m => m.fetchAuthSession())).tokens?.idToken?.toString() || '' },
                    body: JSON.stringify({ title: watchedValues.title, category: watchedValues.category, venue: watchedValues.venue, tags: watchedValues.tags }),
                  });
                  const data = await response.json();
                  if (data.description) setValue('description', data.description, { shouldValidate: true });
                } catch { /* silent */ }
                setAiSuggesting(false);
              }}
              sx={{ fontSize: '0.7rem', textTransform: 'none' }}
            >
              {aiSuggesting ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : '✨'} AI Suggest
            </Button>
          </Box>
          <TextField
            fullWidth
            placeholder="Detailed operational summary and security requirements..."
            multiline
            rows={4}
            {...register('description')}
            error={!!errors.description}
            helperText={errors.description?.message}
            sx={{ mb: 3 }}
          />

          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Category</Typography>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    select
                    placeholder="Select category"
                    {...field}
                    value={field.value || ''}
                    error={!!errors.category}
                    helperText={errors.category?.message}
                  >
                    {Object.values(EventCategory).map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Venue</Typography>
              <TextField
                fullWidth
                placeholder="Search Venue Registry..."
                {...register('venue')}
                error={!!errors.venue}
                helperText={errors.venue?.message}
              />
            </Grid>
          </Grid>

          {/* Section: Schedule */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Schedule sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography variant="overline" sx={{ color: 'secondary.main' }}>Schedule</Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Event Date & Time</Typography>
              <TextField
                fullWidth
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                {...register('eventDate')}
                error={!!errors.eventDate}
                helperText={errors.eventDate?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Registration Deadline</Typography>
              <TextField
                fullWidth
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                {...register('registrationDeadline')}
                error={!!errors.registrationDeadline}
                helperText={errors.registrationDeadline?.message}
              />
            </Grid>
          </Grid>

          {/* Section: Logistics & Security */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Security sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography variant="overline" sx={{ color: 'secondary.main' }}>Logistics & Security</Typography>
          </Box>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Tags (Optional)</Typography>
          <TextField
            fullWidth
            placeholder="Press Enter to add tags (e.g., VIP, Overnight, Medical)"
            {...register('tags')}
            error={!!errors.tags}
            helperText={
              <Typography variant="caption" sx={{ color: 'secondary.main', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                Comma-separated tags for better AI risk assessments.
              </Typography>
            }
            sx={{ mb: 3 }}
          />

          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Capacity</Typography>
              <TextField
                fullWidth
                type="number"
                placeholder="e.g., 100"
                {...register('capacity')}
                error={!!errors.capacity}
                helperText={errors.capacity?.message}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Requirements (Optional)</Typography>
              <TextField
                fullWidth
                placeholder="e.g., Laptop required. Valid ID for entry."
                {...register('requirements')}
                error={!!errors.requirements}
                helperText={errors.requirements?.message}
              />
            </Grid>
          </Grid>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Access Code (Optional — Restrict Registration)</Typography>
          <TextField
            fullWidth
            placeholder="e.g., FLOOR3-BLDG5 or TEAM-ALPHA"
            {...register('accessCode')}
            error={!!errors.accessCode}
            helperText={errors.accessCode?.message || 'If set, only attendees who enter this code can register. Share the code with your target audience.'}
            sx={{ mb: 3 }}
          />

          {/* Waitlist Settings */}
          <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 4 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Waitlist Settings</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Let people join a waitlist if tickets sell out or your event reaches capacity.
            </Typography>
            <FormControlLabel
              control={<Switch checked={waitlistEnabled} onChange={e => setWaitlistEnabled(e.target.checked)} color="primary" />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {waitlistEnabled ? 'Waitlist Enabled' : 'Waitlist Disabled'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {waitlistEnabled
                      ? 'When capacity is full, attendees can join a waitlist. Auto-promotes on cancellation.'
                      : 'When capacity is full, registration is closed. No waitlist available.'}
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Section: Event Agenda / Sessions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <ViewAgenda sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography variant="overline" sx={{ color: 'secondary.main' }}>Event Agenda / Sessions (Optional)</Typography>
          </Box>
          <Box sx={{ mb: 4 }}>
            <SessionsManager
              sessions={sessions}
              onChange={setSessions}
            />
          </Box>

          {/* Section: Organiser Details */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <People sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography variant="overline" sx={{ color: 'secondary.main' }}>Organiser Details (Optional)</Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Organiser Name</Typography>
              <TextField
                fullWidth
                placeholder="e.g., Dr. Sarah Johnson"
                {...register('organiserName')}
                error={!!errors.organiserName}
                helperText={errors.organiserName?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Organization</Typography>
              <TextField
                fullWidth
                placeholder="e.g., Tech Events Inc."
                {...register('organiserOrganization')}
                error={!!errors.organiserOrganization}
                helperText={errors.organiserOrganization?.message}
              />
            </Grid>
          </Grid>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Photo URL</Typography>
          <TextField
            fullWidth
            placeholder="https://example.com/photo.jpg"
            {...register('organiserPhotoUrl')}
            error={!!errors.organiserPhotoUrl}
            helperText={errors.organiserPhotoUrl?.message || 'Direct link to organiser photo (JPG, PNG)'}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Email</Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="organiser@example.com"
                {...register('organiserEmail')}
                error={!!errors.organiserEmail}
                helperText={errors.organiserEmail?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Phone</Typography>
              <TextField
                fullWidth
                placeholder="+91 98765 43210"
                {...register('organiserPhone')}
                error={!!errors.organiserPhone}
                helperText={errors.organiserPhone?.message}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="body2" fontWeight={600}>Bio</Typography>
            <Button
              size="small"
              variant="outlined"
              disabled={aiSuggesting || !watchedValues.organiserName}
              onClick={async () => {
                setAiSuggesting(true);
                try {
                  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/suggest-description`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: (await import('aws-amplify/auth').then(m => m.fetchAuthSession())).tokens?.idToken?.toString() || '' },
                    body: JSON.stringify({ title: `Bio for ${watchedValues.organiserName}`, category: `Organization: ${watchedValues.organiserOrganization || 'Event Organizer'}`, venue: '', tags: '' }),
                  });
                  const data = await response.json();
                  if (data.description) setValue('organiserBio', data.description.slice(0, 500), { shouldValidate: true });
                } catch { /* silent */ }
                setAiSuggesting(false);
              }}
              sx={{ fontSize: '0.7rem', textTransform: 'none' }}
            >
              {aiSuggesting ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : '✨'} AI Suggest
            </Button>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Brief bio about the organiser..."
            {...register('organiserBio')}
            error={!!errors.organiserBio}
            helperText={errors.organiserBio?.message}
            sx={{ mb: 4 }}
          />

          {/* Section: Trainer / Speaker Details */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <School sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography variant="overline" sx={{ color: 'secondary.main' }}>Trainer / Speaker Details (Optional)</Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Trainer Name</Typography>
              <TextField
                fullWidth
                placeholder="e.g., Prof. Alex Kumar"
                {...register('trainerName')}
                error={!!errors.trainerName}
                helperText={errors.trainerName?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Expertise</Typography>
              <TextField
                fullWidth
                placeholder="e.g., Cloud Architecture, AI/ML"
                {...register('trainerExpertise')}
                error={!!errors.trainerExpertise}
                helperText={errors.trainerExpertise?.message}
              />
            </Grid>
          </Grid>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Photo URL</Typography>
          <TextField
            fullWidth
            placeholder="https://example.com/trainer-photo.jpg"
            {...register('trainerPhotoUrl')}
            error={!!errors.trainerPhotoUrl}
            helperText={errors.trainerPhotoUrl?.message || 'Direct link to trainer/speaker photo (JPG, PNG)'}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Email</Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="trainer@example.com"
                {...register('trainerEmail')}
                error={!!errors.trainerEmail}
                helperText={errors.trainerEmail?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Phone</Typography>
              <TextField
                fullWidth
                placeholder="+91 98765 43210"
                {...register('trainerPhone')}
                error={!!errors.trainerPhone}
                helperText={errors.trainerPhone?.message}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>LinkedIn Profile</Typography>
              <TextField
                fullWidth
                placeholder="https://linkedin.com/in/username"
                {...register('trainerLinkedin')}
                error={!!errors.trainerLinkedin}
                helperText={errors.trainerLinkedin?.message}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="body2" fontWeight={600}>Bio</Typography>
            <Button
              size="small"
              variant="outlined"
              disabled={aiSuggesting || !watchedValues.trainerName}
              onClick={async () => {
                setAiSuggesting(true);
                try {
                  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/suggest-description`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: (await import('aws-amplify/auth').then(m => m.fetchAuthSession())).tokens?.idToken?.toString() || '' },
                    body: JSON.stringify({ title: `Speaker bio for ${watchedValues.trainerName}`, category: `Expertise: ${watchedValues.trainerExpertise || 'Industry Expert'}`, venue: '', tags: '' }),
                  });
                  const data = await response.json();
                  if (data.description) setValue('trainerBio', data.description.slice(0, 500), { shouldValidate: true });
                } catch { /* silent */ }
                setAiSuggesting(false);
              }}
              sx={{ fontSize: '0.7rem', textTransform: 'none' }}
            >
              {aiSuggesting ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : '✨'} AI Suggest
            </Button>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Brief bio about the trainer/speaker..."
            {...register('trainerBio')}
            error={!!errors.trainerBio}
            helperText={errors.trainerBio?.message}
            sx={{ mb: 4 }}
          />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/organizer/events')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ minWidth: 180 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Deploy Event →'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Right: Live Preview Panel */}
      <Box
        sx={{
          width: 320,
          flexShrink: 0,
          display: { xs: 'none', lg: 'block' },
          position: 'sticky',
          top: 80,
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 100px)',
          overflow: 'auto',
        }}
      >
        <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
          ▸ Preview
        </Typography>
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {/* Preview Banner */}
          <Box
            sx={{
              height: 100,
              background: imageUrl ? 'none' : 'linear-gradient(135deg, #0D3B30 0%, #14B8A6 100%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {imageUrl && (
              <img src={imageUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </Box>
          <CardContent sx={{ p: 2.5 }}>
            {/* Title */}
            <Typography variant="h4" sx={{ mb: 1, lineHeight: 1.3 }}>
              {watchedValues.title || 'Event Title'}
            </Typography>

            {/* Organizer */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              By {watchedValues.organiserName || 'Organizer name'}
            </Typography>

            {/* Date */}
            {watchedValues.eventDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <Schedule sx={{ fontSize: 14, color: 'primary.main' }} />
                <Typography variant="caption">
                  {new Date(watchedValues.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' • '}
                  {new Date(watchedValues.eventDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </Typography>
              </Box>
            )}

            {/* Venue */}
            {watchedValues.venue && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <Security sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">{watchedValues.venue}</Typography>
              </Box>
            )}

            {/* Category */}
            {watchedValues.category && (
              <Chip label={watchedValues.category} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, mt: 1, mr: 0.5 }} />
            )}

            {/* Capacity */}
            {watchedValues.capacity && (
              <Chip label={`${watchedValues.capacity} capacity`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, mt: 1 }} />
            )}

            {/* Access Code indicator */}
            {watchedValues.accessCode && (
              <Chip label="🔒 Restricted" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, mt: 1, ml: 0.5 }} />
            )}

            {/* Description preview */}
            {watchedValues.description && (
              <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="overline" sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>Overview</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', lineHeight: 1.5, mt: 0.5, overflow: 'hidden', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                  {watchedValues.description}
                </Typography>
              </Box>
            )}

            {/* Sessions count */}
            {sessions.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="secondary.main" fontWeight={600}>
                  📋 {sessions.filter(s => s.title).length} session{sessions.filter(s => s.title).length !== 1 ? 's' : ''} added
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Good to Know */}
        <Card sx={{ mt: 2, borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h5" sx={{ mb: 1.5 }}>Good to Know</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {watchedValues.registrationDeadline && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Registration closes</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {new Date(watchedValues.registrationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Format</Typography>
                <Typography variant="caption" fontWeight={600}>In person</Typography>
              </Box>
              {watchedValues.requirements && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Requirements</Typography>
                  <Typography variant="caption" fontWeight={600}>Yes</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
      </Box>

    </AppLayout>
  );
}
