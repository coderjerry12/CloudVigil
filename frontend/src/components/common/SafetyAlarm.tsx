import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { VolumeOff, VolumeUp, Warning } from '@mui/icons-material';

interface SafetyAlarmProps {
  /** Whether there are unresolved escalated incidents */
  active: boolean;
  /** Number of escalated incidents */
  count: number;
  /** Callback when alarm is clicked (navigate to incidents) */
  onClick?: () => void;
  /** Callback to dismiss/acknowledge the alarm */
  onDismiss?: () => void;
}

/**
 * SafetyAlarm — Audio + visual alarm for escalated safety incidents.
 * Plays a repeating alarm tone using Web Audio API when active.
 * Organizer can mute the audio while the visual pulsing continues.
 */
export default function SafetyAlarm({ active, count, onClick, onDismiss }: SafetyAlarmProps) {
  const [muted, setMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create alarm sound using Web Audio API (no external files needed)
  const startAlarm = useCallback(() => {
    if (audioContextRef.current) return; // Already playing

    try {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.value = 0;
      gainRef.current = gain;

      // Create a pulsing alarm pattern
      let isOn = false;
      intervalRef.current = setInterval(() => {
        if (!gainRef.current || !audioContextRef.current) return;

        if (isOn) {
          // Turn off
          gainRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
          if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current = null;
          }
        } else {
          // Turn on — create new oscillator for each pulse
          const osc = audioContextRef.current.createOscillator();
          osc.type = 'square';
          osc.frequency.value = 880; // High-pitched alarm tone
          osc.connect(gainRef.current);
          osc.start();
          oscillatorRef.current = osc;
          gainRef.current.gain.setValueAtTime(0.15, audioContextRef.current.currentTime);
        }
        isOn = !isOn;
      }, 500); // Pulse every 500ms
    } catch {
      // Web Audio API not supported — silent fallback
    }
  }, []);

  const stopAlarm = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch { /* ignore */ }
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch { /* ignore */ }
      audioContextRef.current = null;
    }
    gainRef.current = null;
  }, []);

  // Start/stop alarm based on active state and mute
  useEffect(() => {
    if (active && !muted) {
      startAlarm();
    } else {
      stopAlarm();
    }

    return () => stopAlarm();
  }, [active, muted, startAlarm, stopAlarm]);

  // Quiet state — always visible, shows "All Clear"
  if (!active || count === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          bgcolor: 'success.light',
          border: '1px solid',
          borderColor: 'success.main',
          cursor: onClick ? 'pointer' : 'default',
        }}
        onClick={onClick}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.65rem' }}>
          ALL CLEAR
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
        bgcolor: 'error.light',
        border: '1px solid',
        borderColor: 'error.main',
        cursor: onClick ? 'pointer' : 'default',
        animation: 'pulse-alarm 1s infinite',
        '@keyframes pulse-alarm': {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.7 },
          '100%': { opacity: 1 },
        },
      }}
      onClick={onClick}
    >
      <Warning sx={{ color: 'error.main', fontSize: 18, animation: 'shake 0.5s infinite' , '@keyframes shake': { '0%, 100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-5deg)' }, '75%': { transform: 'rotate(5deg)' } } }} />
      <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, fontSize: '0.7rem' }}>
        {count} ESCALATED
      </Typography>
      <Tooltip title={muted ? 'Unmute alarm' : 'Mute alarm'}>
        <IconButton
          size="small"
          onClick={e => { e.stopPropagation(); setMuted(!muted); }}
          sx={{ color: 'error.main', p: 0.25 }}
          aria-label={muted ? 'Unmute safety alarm' : 'Mute safety alarm'}
        >
          {muted ? <VolumeOff sx={{ fontSize: 16 }} /> : <VolumeUp sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>
      {onDismiss && (
        <Tooltip title="Acknowledge & dismiss alarm">
          <Typography
            variant="caption"
            onClick={e => { e.stopPropagation(); onDismiss(); }}
            sx={{
              color: 'error.main',
              fontWeight: 600,
              fontSize: '0.6rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              ml: 0.5,
            }}
          >
            DISMISS
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
}
