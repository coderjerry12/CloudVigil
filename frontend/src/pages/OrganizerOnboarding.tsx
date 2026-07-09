import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  TextField,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  MenuItem,
  Alert,
} from '@mui/material';
import { ArrowBack, ArrowForward, CheckCircle } from '@mui/icons-material';
import CloudVigilLogo from '../components/common/CloudVigilLogo';

const STEPS = [
  'Organization',
  'Event Types',
  'Scale',
  'Audience',
  'Contact',
];

const EVENT_TYPES = [
  'Conference', 'Workshop', 'Seminar', 'Meetup', 'Hackathon',
  'Cultural', 'Sports', 'Music', 'Nightlife', 'Food & Drink',
  'Health & Wellness', 'Tech', 'Business', 'Social', 'Other',
];

const EVENT_SCALE = ['1-10', '11-20', '21-50', '51-100', '100+'];

const AUDIENCE_TYPES = [
  'Professionals', 'Students', 'Families', 'Corporates',
  'Developers', 'Designers', 'Entrepreneurs', 'Community',
  'Fitness Enthusiasts', 'Foodies', 'Travelers', 'Other',
];

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Other'];

export default function OrganizerOnboarding() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [orgName, setOrgName] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [eventScale, setEventScale] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [linkedin, setLinkedin] = useState('');

  const toggleEventType = (type: string) => {
    setSelectedEventTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleAudience = (aud: string) => {
    setSelectedAudience(prev =>
      prev.includes(aud) ? prev.filter(a => a !== aud) : [...prev, aud]
    );
  };

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    setError(null);
    try {
      // Store onboarding data in localStorage (or could call an API)
      const onboardingData = {
        orgName,
        orgWebsite,
        orgDescription,
        eventTypes: selectedEventTypes,
        eventScale,
        audience: selectedAudience,
        phone,
        country,
        linkedin,
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem('organizer-onboarding', JSON.stringify(onboardingData));
      localStorage.setItem('organizer-onboarded', 'true');
      navigate('/organizer/dashboard', { replace: true });
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = ((activeStep + 1) / STEPS.length) * 100;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Card sx={{ maxWidth: 900, width: '100%', borderRadius: 4, overflow: 'hidden' }}>
        {/* Progress bar */}
        <LinearProgress variant="determinate" value={progress} sx={{ height: 4 }} />

        <CardContent sx={{ p: { xs: 3, md: 5 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, minHeight: 500 }}>
          {/* Left: Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Logo + Step indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <CloudVigilLogo size={28} />
              <Typography variant="caption" color="text.secondary">
                Step {activeStep + 1} of {STEPS.length}
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Step Content */}
            <Box sx={{ flex: 1 }}>
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h2" sx={{ mb: 1 }}>Tell us about your organization</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    This helps us verify organizers and tailor the platform experience.
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Organization / Company Name *</Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., Amazon Web Services, Tech Events India"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Website (Optional)</Typography>
                  <TextField
                    fullWidth
                    placeholder="https://your-organization.com"
                    value={orgWebsite}
                    onChange={e => setOrgWebsite(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Brief Description</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="What does your organization do? What kind of events do you typically host?"
                    value={orgDescription}
                    onChange={e => setOrgDescription(e.target.value)}
                  />
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <Typography variant="h2" sx={{ mb: 1 }}>What types of events do you organize?</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Select all that apply. This helps us customize your dashboard.
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {EVENT_TYPES.map(type => (
                      <Chip
                        key={type}
                        label={type}
                        onClick={() => toggleEventType(type)}
                        variant={selectedEventTypes.includes(type) ? 'filled' : 'outlined'}
                        color={selectedEventTypes.includes(type) ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer', fontSize: '0.85rem', py: 2.5, px: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Typography variant="h2" sx={{ mb: 1 }}>How many events do you plan to organize in the next 12 months?</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    This helps us optimize capacity and recommendations.
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {EVENT_SCALE.map(scale => (
                      <Chip
                        key={scale}
                        label={scale}
                        onClick={() => setEventScale(scale)}
                        variant={eventScale === scale ? 'filled' : 'outlined'}
                        color={eventScale === scale ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer', fontSize: '0.9rem', py: 2.5, px: 1.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {activeStep === 3 && (
                <Box>
                  <Typography variant="h2" sx={{ mb: 1 }}>How would you describe your primary audience?</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Select all that apply.
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {AUDIENCE_TYPES.map(aud => (
                      <Chip
                        key={aud}
                        label={aud}
                        onClick={() => toggleAudience(aud)}
                        variant={selectedAudience.includes(aud) ? 'filled' : 'outlined'}
                        color={selectedAudience.includes(aud) ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer', fontSize: '0.85rem', py: 2.5, px: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {activeStep === 4 && (
                <Box>
                  <Typography variant="h2" sx={{ mb: 1 }}>Contact & Verification</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Provide contact details for verification. This information is kept private.
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Phone Number *</Typography>
                  <TextField
                    fullWidth
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>Country *</Typography>
                  <TextField
                    fullWidth
                    select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    sx={{ mb: 3 }}
                  >
                    {COUNTRIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>LinkedIn Profile (Optional)</Typography>
                  <TextField
                    fullWidth
                    placeholder="https://linkedin.com/in/your-profile"
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                  />
                </Box>
              )}
            </Box>

            {/* Navigation buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
              <Box>
                {activeStep > 0 && (
                  <IconButton onClick={handleBack} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <ArrowBack />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={handleSkip} disabled={saving}>
                  Skip
                </Button>
                {activeStep < STEPS.length - 1 ? (
                  <Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={handleComplete}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Complete Setup'}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* Right: Decorative gradient */}
          <Box
            sx={{
              width: { xs: '100%', md: 300 },
              borderRadius: 3,
              background: 'linear-gradient(135deg, #0D3B30 0%, #1B5E4B 50%, #14B8A6 100%)',
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 30% 30%, white 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
            <Box sx={{ textAlign: 'center', p: 3, zIndex: 1 }}>
              <CloudVigilLogo size={48} />
              <Typography variant="h4" sx={{ color: 'white', mt: 2, mb: 1 }}>Welcome to CloudVigil</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Let's set up your organizer profile to get started.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
