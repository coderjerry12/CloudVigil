import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Chip,
  Collapse,
  Grid,
} from '@mui/material';
import {
  Add,
  Delete,
  ExpandMore,
  ExpandLess,
  DragIndicator,
  AccessTime,
  Room,
  Person,
} from '@mui/icons-material';
import type { EventSession } from '../types';

const SESSION_TYPES = [
  { value: 'keynote', label: 'Keynote' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'panel', label: 'Panel Discussion' },
  { value: 'networking', label: 'Networking' },
  { value: 'break', label: 'Break' },
  { value: 'general', label: 'General Session' },
];

const SESSION_TYPE_COLORS: Record<string, string> = {
  keynote: '#667eea',
  workshop: '#f5576c',
  panel: '#4facfe',
  networking: '#43e97b',
  break: '#bdc3c7',
  general: '#14B8A6',
};

interface SessionsManagerProps {
  sessions: EventSession[];
  onChange: (sessions: EventSession[]) => void;
}

export default function SessionsManager({ sessions, onChange }: SessionsManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addSession = () => {
    const newSession: EventSession = {
      sessionId: crypto.randomUUID(),
      title: '',
      description: '',
      speaker: '',
      speakerBio: '',
      startTime: '',
      endTime: '',
      room: '',
      track: '',
      type: 'general',
    };
    onChange([...sessions, newSession]);
    setExpandedId(newSession.sessionId);
  };

  const updateSession = (sessionId: string, field: keyof EventSession, value: string) => {
    onChange(sessions.map(s => s.sessionId === sessionId ? { ...s, [field]: value } : s));
  };

  const removeSession = (sessionId: string) => {
    onChange(sessions.filter(s => s.sessionId !== sessionId));
    if (expandedId === sessionId) setExpandedId(null);
  };

  const toggleExpand = (sessionId: string) => {
    setExpandedId(expandedId === sessionId ? null : sessionId);
  };

  // Sort sessions by start time
  const sortedSessions = [...sessions].sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Add sessions to create a detailed agenda. Attendees will see this on the event page.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={addSession}
        >
          Add Session
        </Button>
      </Box>

      {/* Sessions list */}
      {sortedSessions.length === 0 ? (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No sessions added yet
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Click "Add Session" to build your event agenda
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {sortedSessions.map((session, index) => (
            <Card
              key={session.sessionId}
              sx={{
                borderLeft: '4px solid',
                borderLeftColor: SESSION_TYPE_COLORS[session.type || 'general'] || '#14B8A6',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Collapsed view */}
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                  onClick={() => toggleExpand(session.sessionId)}
                >
                  <DragIndicator sx={{ color: 'text.disabled', fontSize: 18 }} />
                  <Typography variant="caption" color="text.disabled" sx={{ minWidth: 24 }}>
                    {index + 1}.
                  </Typography>

                  {/* Time */}
                  {session.startTime && (
                    <Chip
                      icon={<AccessTime sx={{ fontSize: '14px !important' }} />}
                      label={`${session.startTime}${session.endTime ? ` - ${session.endTime}` : ''}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                  )}

                  {/* Title */}
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                    {session.title || 'Untitled Session'}
                  </Typography>

                  {/* Type chip */}
                  {session.type && (
                    <Chip
                      label={SESSION_TYPES.find(t => t.value === session.type)?.label || session.type}
                      size="small"
                      sx={{
                        fontSize: '0.6rem',
                        height: 20,
                        bgcolor: `${SESSION_TYPE_COLORS[session.type]}20`,
                        color: SESSION_TYPE_COLORS[session.type],
                        fontWeight: 600,
                      }}
                    />
                  )}

                  {/* Speaker */}
                  {session.speaker && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">{session.speaker}</Typography>
                    </Box>
                  )}

                  {/* Room */}
                  {session.room && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Room sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">{session.room}</Typography>
                    </Box>
                  )}

                  <IconButton size="small" onClick={e => { e.stopPropagation(); removeSession(session.sessionId); }}>
                    <Delete sx={{ fontSize: 16, color: 'text.disabled' }} />
                  </IconButton>
                  {expandedId === session.sessionId ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                </Box>

                {/* Expanded edit form */}
                <Collapse in={expandedId === session.sessionId}>
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          label="Session Title"
                          value={session.title}
                          onChange={e => updateSession(session.sessionId, 'title', e.target.value)}
                          fullWidth
                          size="small"
                          required
                          placeholder="e.g., Opening Keynote: Future of AI"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Start Time"
                          type="time"
                          value={session.startTime}
                          onChange={e => updateSession(session.sessionId, 'startTime', e.target.value)}
                          fullWidth
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="End Time"
                          type="time"
                          value={session.endTime}
                          onChange={e => updateSession(session.sessionId, 'endTime', e.target.value)}
                          fullWidth
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Room / Hall"
                          value={session.room || ''}
                          onChange={e => updateSession(session.sessionId, 'room', e.target.value)}
                          fullWidth
                          size="small"
                          placeholder="e.g., Hall A"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Type"
                          value={session.type || 'general'}
                          onChange={e => updateSession(session.sessionId, 'type', e.target.value)}
                          select
                          fullWidth
                          size="small"
                        >
                          {SESSION_TYPES.map(t => (
                            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Speaker Name"
                          value={session.speaker || ''}
                          onChange={e => updateSession(session.sessionId, 'speaker', e.target.value)}
                          fullWidth
                          size="small"
                          placeholder="e.g., Dr. Jane Smith"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Track (Optional)"
                          value={session.track || ''}
                          onChange={e => updateSession(session.sessionId, 'track', e.target.value)}
                          fullWidth
                          size="small"
                          placeholder="e.g., AI & ML, Leadership"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Description (Optional)"
                          value={session.description || ''}
                          onChange={e => updateSession(session.sessionId, 'description', e.target.value)}
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          placeholder="Brief description of what this session covers..."
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Speaker Bio (Optional)"
                          value={session.speakerBio || ''}
                          onChange={e => updateSession(session.sessionId, 'speakerBio', e.target.value)}
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          placeholder="Brief bio about the speaker..."
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
