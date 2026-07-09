import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, IconButton, TextField, MenuItem } from '@mui/material';
import {
  Event,
  QrCodeScanner,
  HealthAndSafety,
  SmartToy,
  Analytics,
  HowToReg,
  NotificationsActive,
  Shield,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useThemeMode } from '../theme/ThemeContext';
import CloudVigilLogo from '../components/common/CloudVigilLogo';

/**
 * Public Landing Page — scrollable marketing page for CloudVigil.
 * Shown to unauthenticated visitors at "/".
 * Uses existing theme tokens for consistency.
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* ========== NAVBAR ========== */}
      <Box
        component="nav"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: 'background.default',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          px: { xs: 2, md: 6 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CloudVigilLogo size={36} />
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.3px' }}>
            CloudVigil
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
          <Typography
            variant="body2"
            sx={{ display: { xs: 'none', md: 'block' }, color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Features
          </Typography>
          <Typography
            variant="body2"
            sx={{ display: { xs: 'none', md: 'block' }, color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            How it works
          </Typography>
          <Typography
            variant="body2"
            sx={{ display: { xs: 'none', md: 'block' }, color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={() => document.getElementById('ai-features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            AI Features
          </Typography>
          <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }} aria-label="toggle theme">
            {mode === 'dark' ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
          </IconButton>
          <Button variant="contained" size="small" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </Box>
      </Box>

      {/* ========== HERO SECTION ========== */}
      <Box
        sx={{
          px: { xs: 2, md: 6 },
          py: { xs: 6, md: 10 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 4, md: 8 },
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        {/* Left: Hero text */}
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: { xs: '2.5rem', md: '3.2rem' },
              fontWeight: 700,
              lineHeight: 1.1,
              color: 'primary.dark',
              mb: 2,
            }}
          >
            Smart Event
            <br />
            Management &
            <br />
            <Box component="span" sx={{ color: 'primary.main' }}>Safety Platform</Box>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 440, mb: 3, lineHeight: 1.7 }}>
            AI-powered platform for event creation, attendee registration, QR check-in,
            emergency assistance, and real-time analytics. Built for safety-first events.
          </Typography>

          {/* Feature pills */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
            {['QR Check-in', 'SOS Alerts', 'AI Chatbot', 'Real-time Analytics', 'Crowd Monitoring'].map(f => (
              <Box
                key={f}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '9999px',
                  bgcolor: 'rgba(20, 184, 166, 0.08)',
                  color: 'primary.main',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                ✓ {f}
              </Box>
            ))}
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/signup')}
            sx={{ mr: 2 }}
          >
            Get Started →
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </Box>

        {/* Right: Sign In card */}
        <Card
          sx={{
            width: { xs: '100%', md: 380 },
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            flexShrink: 0,
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box
              sx={{
                width: 48, height: 48, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
              }}
            >
              <CloudVigilLogo size={48} />
            </Box>
            <Typography variant="h4" gutterBottom>Welcome to CloudVigil</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sign in to manage events or attend safely.
            </Typography>
            <Button variant="contained" fullWidth size="large" onClick={() => navigate('/login')} sx={{ mb: 1.5 }}>
              Sign In
            </Button>
            <Button variant="outlined" fullWidth onClick={() => navigate('/signup')}>
              Create Account
            </Button>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block' }}>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* ========== AI SHOWCASE BANNER ========== */}
      <Box
        sx={{
          my: { xs: 4, md: 6 },
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 2, md: 6 },
        }}
      >
        <Box
          sx={{
            borderRadius: 4,
            background: 'linear-gradient(135deg, #0F1A2E 0%, #1B5E4B 50%, #14B8A6 100%)',
            p: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: { xs: 4, md: 6 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative elements */}
          <Box sx={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(94, 234, 212, 0.1)' }} />
          <Box sx={{ position: 'absolute', bottom: -40, left: '30%', width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(20, 184, 166, 0.08)' }} />

          {/* Left: Mock UI Cards */}
          <Box sx={{ flex: 1, position: 'relative', minHeight: { xs: 280, md: 320 }, width: '100%' }}>
            {/* Card 1: AI Recommendations */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: { xs: 0, md: 20 },
                width: { xs: 200, md: 220 },
                bgcolor: '#1A2740',
                borderRadius: 2.5,
                p: 2.5,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                zIndex: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: '#5EEAD4', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 1 }}>
                AI RECOMMENDATIONS
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 1, fontSize: '0.6rem' }}>
                Based on your interest in Cloud & AI
              </Typography>
              <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ p: 1.5, bgcolor: 'rgba(20,184,166,0.1)', borderRadius: 1.5, borderLeft: '3px solid #14B8A6' }}>
                  <Typography variant="caption" sx={{ color: '#F8F6F1', fontWeight: 600, fontSize: '0.7rem', display: 'block' }}>
                    AWS Serverless Workshop
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.6rem' }}>
                    Jul 15 • Innovation Hub
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: 'rgba(59,130,246,0.1)', borderRadius: 1.5, borderLeft: '3px solid #3B82F6' }}>
                  <Typography variant="caption" sx={{ color: '#F8F6F1', fontWeight: 600, fontSize: '0.7rem', display: 'block' }}>
                    GenAI & Bedrock Meetup
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.6rem' }}>
                    Jul 22 • Tech Park
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Card 2: Safety Monitor */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 150, md: 80 },
                left: { xs: 120, md: 200 },
                width: { xs: 180, md: 200 },
                bgcolor: '#FFFFFF',
                borderRadius: 2.5,
                p: 2,
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                zIndex: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E', animation: 'pulse 2s infinite' }} />
                <Typography variant="caption" sx={{ color: '#1A1A1A', fontWeight: 600, fontSize: '0.65rem' }}>
                  LIVE SAFETY MONITOR
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#5F6368', fontSize: '0.6rem' }}>Crowd Status</Typography>
                  <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: '#DCFCE7' }}>
                    <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700, fontSize: '0.55rem' }}>NORMAL</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#5F6368', fontSize: '0.6rem' }}>Active Incidents</Typography>
                  <Typography variant="caption" sx={{ color: '#1A1A1A', fontWeight: 700, fontSize: '0.7rem' }}>0</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#5F6368', fontSize: '0.6rem' }}>Occupancy</Typography>
                  <Typography variant="caption" sx={{ color: '#1A1A1A', fontWeight: 700, fontSize: '0.7rem' }}>64%</Typography>
                </Box>
              </Box>
            </Box>

            {/* Card 3: Generating summary toast */}
            <Box
              sx={{
                position: 'absolute',
                bottom: { xs: 0, md: 10 },
                left: { xs: 10, md: 40 },
                bgcolor: '#1A2740',
                borderRadius: 2,
                px: 2,
                py: 1.5,
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                zIndex: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#14B8A6' }} />
              <Typography variant="caption" sx={{ color: '#F8F6F1', fontWeight: 500, fontSize: '0.7rem' }}>
                Analyzing crowd patterns...
              </Typography>
            </Box>
          </Box>

          {/* Right: Text content */}
          <Box sx={{ flex: 1, zIndex: 1 }}>
            <Typography variant="overline" sx={{ color: '#5EEAD4', letterSpacing: 2, fontSize: '0.65rem', display: 'block', mb: 1 }}>
              CLOUDVIGIL AI
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.75rem', md: '2.2rem' },
                fontWeight: 700,
                color: '#F8F6F1',
                lineHeight: 1.2,
                mb: 2,
              }}
            >
              AI for smarter,
              <br />safer events
            </Typography>
            <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.7, mb: 3, maxWidth: 400 }}>
              Bringing together cloud-native architecture and powerful AI to help you organize,
              monitor, and protect events like never before. From personalized recommendations
              to real-time crowd intelligence.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => document.getElementById('ai-features')?.scrollIntoView({ behavior: 'smooth' })}
              sx={{
                color: '#F8F6F1',
                borderColor: 'rgba(248,246,241,0.3)',
                '&:hover': { borderColor: '#5EEAD4', color: '#5EEAD4' },
              }}
            >
              Explore AI Features →
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ========== HOW IT WORKS ========== */}
      <Box id="how-it-works" sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, md: 6 }, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', textAlign: 'center', mb: 1 }}>
          HOW IT WORKS
        </Typography>
        <Typography variant="h1" sx={{ textAlign: 'center', mb: 1, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
          Seamless Event Safety,
          <br />End to End.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 500, mx: 'auto', mb: 6 }}>
          From event creation to real-time crowd monitoring — every step is designed for safety.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 600 }}>
          {[
            { num: '1', title: 'Organizer creates event', desc: 'Set venue, capacity, deadlines, and safety requirements. Everything stored securely on AWS.' },
            { num: '2', title: 'Attendees register & get QR tickets', desc: 'Instant QR code generation. Capacity validation and deadline enforcement built-in.' },
            { num: '3', title: 'QR check-in at venue', desc: 'Organizers scan QR codes for instant attendance tracking. Duplicate prevention guaranteed.' },
            { num: '4', title: 'Safety assistance always available', desc: 'SOS, medical, fire, and food support with optional live location sharing. Auto-escalation if unresolved.' },
          ].map(step => (
            <Box key={step.num} sx={{ display: 'flex', gap: 2.5 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.main', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  fontSize: '0.9rem', flexShrink: 0,
                }}
              >
                {step.num}
              </Box>
              <Box>
                <Typography variant="h4" sx={{ mb: 0.5 }}>{step.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{step.desc}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ========== AI FEATURES (Dark Card) ========== */}
      <Box id="ai-features" sx={{ px: { xs: 2, md: 6 }, py: { xs: 6, md: 8 }, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="overline" sx={{ color: 'secondary.main', display: 'block', textAlign: 'center', mb: 1 }}>
          AI-POWERED
        </Typography>
        <Typography variant="h1" sx={{ textAlign: 'center', mb: 1, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
          Intelligent Safety Features
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 500, mx: 'auto', mb: 5 }}>
          Every feature solves a real problem — not just a chatbot wrapper.
        </Typography>

        <Card
          sx={{
            bgcolor: '#0F1A2E',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h3" sx={{ color: '#F8F6F1', mb: 2 }}>
                Smart Emergency Escalation
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7, mb: 2 }}>
                AI monitors all safety incidents in real-time. If an SOS or medical alert remains
                unresolved for 5 minutes, it auto-escalates. After 15 minutes, critical notifications
                are triggered. No incident goes unnoticed.
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex', px: 2, py: 0.75, borderRadius: 2,
                  border: '1px solid rgba(20,184,166,0.3)', color: '#5EEAD4', fontSize: '0.75rem',
                }}
              >
                ● Proactive escalation prevents emergency neglect
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ bgcolor: '#1A2740', borderRadius: 2, p: 3 }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', mb: 2, display: 'block' }}>
                  CROWD DENSITY — LIVE MONITORING
                </Typography>
                {[
                  { label: 'Tech Conference Hall A', pct: 73, color: '#F59E0B' },
                  { label: 'Workshop Room 201', pct: 91, color: '#EA580C' },
                  { label: 'Networking Lounge', pct: 48, color: '#22C55E' },
                  { label: 'Main Auditorium', pct: 100, color: '#DC2626' },
                ].map(item => (
                  <Box key={item.label} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#F8F6F1' }}>{item.label}</Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>{item.pct}%</Typography>
                    </Box>
                    <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)' }}>
                      <Box sx={{ height: '100%', width: `${item.pct}%`, borderRadius: 3, bgcolor: item.color }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ========== FEATURES GRID ========== */}
      <Box id="features" sx={{ px: { xs: 2, md: 6 }, py: { xs: 6, md: 8 }, maxWidth: 1200, mx: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 3,
          }}
        >
          {[
            { icon: <Event />, title: 'Event Management', desc: 'Create, edit, and manage events with capacity controls and deadlines.' },
            { icon: <HowToReg />, title: 'Smart Registration', desc: 'Automatic capacity validation, duplicate prevention, and deadline enforcement.' },
            { icon: <QrCodeScanner />, title: 'QR Check-In', desc: 'Instant QR scanning for attendance tracking with duplicate prevention.' },
            { icon: <HealthAndSafety />, title: 'Safety Center', desc: 'SOS, medical, fire, and food assistance with location sharing.' },
            { icon: <SmartToy />, title: 'AI Chatbot', desc: 'Event support assistant powered by Amazon Bedrock for instant help.' },
            { icon: <Analytics />, title: 'Real-time Analytics', desc: 'Attendance insights, safety metrics, and crowd monitoring dashboards.' },
            { icon: <NotificationsActive />, title: 'Smart Notifications', desc: 'Automated reminders, safety alerts, and escalation notifications.' },
            { icon: <Shield />, title: 'Auto Escalation', desc: 'Unresolved incidents automatically escalate after 5 and 15 minutes.' },
          ].map(feature => (
            <Card key={feature.title} sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 44, height: 44, borderRadius: 2,
                    bgcolor: 'rgba(20,184,166,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'secondary.main', mb: 2,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h4" sx={{ mb: 1 }}>{feature.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {feature.desc}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* ========== CTA SECTION — REQUEST A DEMO ========== */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0D3B30 0%, #1B5E4B 50%, #14B8A6 100%)',
          px: { xs: 2, md: 6 },
          py: { xs: 6, md: 8 },
          mt: { xs: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: 'auto',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, md: 6 },
            alignItems: 'center',
          }}
        >
          {/* Left: Value proposition */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h2"
              sx={{ color: '#FFFFFF', mb: 2, fontSize: { xs: '1.5rem', md: '1.75rem' } }}
            >
              A complete platform for your events
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, lineHeight: 1.7, maxWidth: 480 }}
            >
              Maximize safety and engagement across all your events with AI-powered
              management, real-time monitoring, and instant emergency response.
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.85)', mb: 1.5 }}
            >
              Request a demo to see how you can:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
              {[
                'Plan and manage events at any scale',
                'Enable real-time QR check-in & attendance',
                'Monitor crowd safety with AI intelligence',
                'Automate alerts, escalations & notifications',
              ].map(item => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  • {item}
                </Typography>
              ))}
            </Box>
            <Typography
              variant="body2"
              sx={{ color: '#5EEAD4', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => navigate('/signup')}
            >
              Try CloudVigil free →
            </Typography>
          </Box>

          {/* Right: Demo request form */}
          <Card
            sx={{
              width: { xs: '100%', md: 400 },
              flexShrink: 0,
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h4" sx={{ mb: 3 }}>
                See our event management tools in action
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField size="small" label="First name" required fullWidth />
                <TextField size="small" label="Last name" required fullWidth />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField size="small" label="Work email" required fullWidth />
                <TextField size="small" label="Phone" fullWidth />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField size="small" label="Organization" required fullWidth />
                <TextField size="small" label="Role" select fullWidth defaultValue="">
                  <MenuItem value="">Select one</MenuItem>
                  <MenuItem value="organizer">Event Organizer</MenuItem>
                  <MenuItem value="security">Security Team</MenuItem>
                  <MenuItem value="management">Management</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Box>
              <TextField
                size="small"
                label="How many events do you manage per year?"
                select
                fullWidth
                defaultValue=""
                sx={{ mb: 3 }}
              >
                <MenuItem value="">Select one</MenuItem>
                <MenuItem value="1-5">1–5</MenuItem>
                <MenuItem value="6-20">6–20</MenuItem>
                <MenuItem value="21-50">21–50</MenuItem>
                <MenuItem value="50+">50+</MenuItem>
              </TextField>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => navigate('/signup')}
              >
                Request a Demo
              </Button>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', mt: 2, textAlign: 'center', lineHeight: 1.5 }}
              >
                By submitting, you agree to our Privacy Policy. We'll reach out to schedule your personalized demo.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* ========== FOOTER ========== */}
      <Box
        sx={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          px: { xs: 2, md: 6 },
          py: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudVigilLogo size={28} />
          <Typography variant="body2" fontWeight={600}>CloudVigil</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          AI-powered event management built for safety-first organizations.
        </Typography>
        <Typography variant="caption" color="text.disabled">
          © 2026 CloudVigil. Built on AWS Serverless.
        </Typography>
      </Box>
    </Box>
  );
}
