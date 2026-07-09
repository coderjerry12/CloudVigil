import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  Grid,
  Skeleton,
} from '@mui/material';
import { Info, Schedule, Security, People, School, Image as ImageIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '../../../components/layout';
import { useOrganizerEvents, useEvent } from '../hooks/useEvents';
import { EventCategory, EventStatus } from '../types';
import EventImageUpload from '../components/EventImageUpload';

const editEventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
    category: z.nativeEnum(EventCategory, { errorMap: () => ({ message: 'Select a category' }) }),
    venue: z.string().min(3, 'Venue must be at least 3 characters').max(200, 'Venue too long'),
    eventDate: z.string().min(1, 'Event date is required'),
    registrationDeadline: z.string().min(1, 'Registration deadline is required'),
    capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1').max(100000, 'Too large'),
    requirements: z.string().max(1000, 'Requirements too long').optional(),
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
      if (!data.eventDate || !data.registrationDeadline) return true;
      return new Date(data.registrationDeadline) < new Date(data.eventDate);
    },
    { message: 'Registration deadline must be before the event date', path: ['registrationDeadline'] }
  );

type EditEventFormData = z.infer<typeof editEventSchema>;

function toDateTimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { event, isLoading: loadingEvent, error: fetchError } = useEvent(eventId);
  const { updateEvent } = useOrganizerEvents();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<EditEventFormData>({
    resolver: zodResolver(editEventSchema),
  });

  useEffect(() => {
    if (event) {
      setImageUrl(event.imageUrl || null);
      reset({
        title: event.title,
        description: event.description,
        category: event.category,
        venue: event.venue,
        eventDate: toDateTimeLocal(event.eventDate),
        registrationDeadline: toDateTimeLocal(event.registrationDeadline),
        capacity: event.capacity,
        requirements: event.requirements || '',
        organiserName: event.organiserDetails?.name || '',
        organiserEmail: event.organiserDetails?.email || '',
        organiserPhone: event.organiserDetails?.phone || '',
        organiserOrganization: event.organiserDetails?.organization || '',
        organiserBio: event.organiserDetails?.bio || '',
        organiserPhotoUrl: event.organiserDetails?.photoUrl || '',
        trainerName: event.trainerDetails?.name || '',
        trainerEmail: event.trainerDetails?.email || '',
        trainerPhone: event.trainerDetails?.phone || '',
        trainerExpertise: event.trainerDetails?.expertise || '',
        trainerBio: event.trainerDetails?.bio || '',
        trainerLinkedin: event.trainerDetails?.linkedin || '',
        trainerPhotoUrl: event.trainerDetails?.photoUrl || '',
      });
    }
  }, [event, reset]);

  if (event && (event.status === EventStatus.COMPLETED || event.status === EventStatus.CANCELLED)) {
    return (
      <AppLayout title="Edit Event">
        <Box sx={{ maxWidth: 600 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>This event cannot be edited because it is {event.status.toLowerCase()}.</Alert>
          <Button variant="outlined" onClick={() => navigate('/organizer/events')}>← Back to Events</Button>
        </Box>
      </AppLayout>
    );
  }

  if (loadingEvent) {
    return (
      <AppLayout title="Edit Event">
        <Box sx={{ maxWidth: 700 }}>
          <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={400} height={20} sx={{ mb: 4 }} />
          <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={56} />
        </Box>
      </AppLayout>
    );
  }

  if (fetchError || !event) {
    return (
      <AppLayout title="Edit Event">
        <Alert severity="error" sx={{ mb: 2 }}>{fetchError || 'Event not found'}</Alert>
        <Button variant="outlined" onClick={() => navigate('/organizer/events')}>← Back to Events</Button>
      </AppLayout>
    );
  }

  const onSubmit = async (data: EditEventFormData) => {
    setSaving(true);
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

      await updateEvent(event.eventId, {
        title: data.title,
        description: data.description,
        category: data.category,
        venue: data.venue,
        eventDate: new Date(data.eventDate).toISOString(),
        registrationDeadline: new Date(data.registrationDeadline).toISOString(),
        capacity: data.capacity,
        requirements: data.requirements,
        imageUrl: imageUrl || undefined,
        organiserDetails,
        trainerDetails,
      });
      navigate('/organizer/events', { state: { message: 'Event updated successfully!' } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Edit Event">
      <Box sx={{ maxWidth: 700 }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>Edit Event</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Update the details for <strong>{event.title}</strong>
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Basic Information */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Info sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography variant="overline" sx={{ color: 'secondary.main' }}>Basic Information</Typography>
          </Box>

          {/* Event Banner Image */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <ImageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" fontWeight={600}>Event Banner Image</Typography>
          </Box>
          <EventImageUpload
            imageUrl={imageUrl}
            onImageUploaded={(url) => setImageUrl(url)}
            onImageRemoved={() => setImageUrl(null)}
          />

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Event Title</Typography>
          <TextField
            fullWidth
            {...register('title')}
            error={!!errors.title}
            helperText={errors.title?.message}
            sx={{ mb: 3 }}
          />

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Description</Typography>
          <TextField
            fullWidth
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
                {...register('venue')}
                error={!!errors.venue}
                helperText={errors.venue?.message}
              />
            </Grid>
          </Grid>

          {/* Schedule */}
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

          {/* Capacity & Requirements */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Security sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography variant="overline" sx={{ color: 'secondary.main' }}>Capacity & Requirements</Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Capacity</Typography>
              <TextField
                fullWidth
                type="number"
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
                {...register('requirements')}
                error={!!errors.requirements}
                helperText={errors.requirements?.message}
              />
            </Grid>
          </Grid>

          {/* Organiser Details */}
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
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Bio</Typography>
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

          {/* Trainer / Speaker Details */}
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
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Bio</Typography>
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
            <Button variant="outlined" onClick={() => navigate('/organizer/events')} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="large" disabled={saving} sx={{ minWidth: 180 }}>
              {saving ? <CircularProgress size={22} color="inherit" /> : 'Save Changes →'}
            </Button>
          </Box>
        </Box>
      </Box>
    </AppLayout>
  );
}
