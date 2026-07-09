import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import CloudVigilLogo from '../../components/common/CloudVigilLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared layout for all authentication pages.
 * Desktop: split screen — left hero panel (teal/dark) + right form panel.
 * Mobile: full-width form with compact header.
 *
 * Follows UI_guidelines.md §14 Authentication:
 * "Split layout: left side hero content (warm background, value props),
 *  right side auth card (white, centered form)"
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        bgcolor: 'background.default',
      }}
    >
      {/* Left Hero Panel */}
      <Box
        sx={{
          width: isMobile ? '100%' : '45%',
          minHeight: isMobile ? 180 : '100vh',
          bgcolor: '#0F1A2E',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: isMobile ? 3 : 8,
          py: isMobile ? 4 : 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gradient circle */}
        <Box
          sx={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-30%',
            left: '-15%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(27,94,75,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: isMobile ? 2 : 4, zIndex: 1 }}>
          <CloudVigilLogo size={40} />
          <Typography
            variant="h4"
            sx={{ color: '#F8F6F1', fontWeight: 700, letterSpacing: '-0.5px' }}
          >
            CloudVigil
          </Typography>
        </Box>

        {/* Hero text */}
        {!isMobile && (
          <Box sx={{ zIndex: 1 }}>
            <Typography
              variant="h1"
              sx={{
                color: '#F8F6F1',
                fontSize: '2.5rem',
                fontWeight: 700,
                lineHeight: 1.2,
                mb: 2,
              }}
            >
              Smart Event
              <br />
              Management & Safety
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#94A3B8', maxWidth: 400, lineHeight: 1.7 }}
            >
              AI-powered platform for event creation, attendee management,
              QR check-in, emergency assistance, and real-time analytics.
            </Typography>

            {/* Feature pills */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 4 }}>
              {['QR Check-in', 'SOS Alerts', 'AI Chatbot', 'Analytics'].map(feature => (
                <Box
                  key={feature}
                  sx={{
                    px: 2,
                    py: 0.75,
                    borderRadius: '9999px',
                    border: '1px solid rgba(20,184,166,0.3)',
                    color: '#5EEAD4',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  {feature}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Right Form Panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: isMobile ? 4 : 6,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
