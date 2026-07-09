import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Tab,
  Tabs,
} from '@mui/material';
import {
  BookmarkBorder,
  Bookmark,
  AccessTime,
  Room,
  Person,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import type { EventSession } from '../types';

const SESSION_TYPE_COLORS: Record<string, string> = {
  keynote: '#667eea',
  workshop: '#f5576c',
  panel: '#4facfe',
  networking: '#43e97b',
  break: '#bdc3c7',
  general: '#14B8A6',
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  keynote: 'Keynote',
  workshop: 'Workshop',
  panel: 'Panel',
  networking: 'Networking',
  break: 'Break',
  general: 'Session',
};

interface AgendaViewProps {
  sessions: EventSession[];
  eventId: string;
}

export default function AgendaView({ sessions, eventId }: AgendaViewProps) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTrack, setFilterTrack] = useState<string>('all');

  // Load bookmarks from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`agenda-bookmarks-${eventId}`);
    if (stored) {
      try {
        setBookmarkedIds(new Set(JSON.parse(stored)));
      } catch { /* ignore */ }
    }
  }, [eventId]);

  // Save bookmarks to localStorage
  const toggleBookmark = (sessionId: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      localStorage.setItem(`agenda-bookmarks-${eventId}`, JSON.stringify([...next]));
      return next;
    });
  };

  // Get unique tracks
  const tracks = [...new Set(sessions.map(s => s.track).filter(Boolean))] as string[];

  // Filter sessions
  const filteredSessions = filterTrack === 'all'
    ? sessions
    : filterTrack === 'bookmarked'
      ? sessions.filter(s => bookmarkedIds.has(s.sessionId))
      : sessions.filter(s => s.track === filterTrack);

  // Sort by start time
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });

  // Group by time slots for timeline view
  const timeSlots = sortedSessions.reduce<Record<string, EventSession[]>>((acc, session) => {
    const key = session.startTime || 'TBD';
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {});

  if (sessions.length === 0) return null;

  return (
    <Card sx={{ mt: 2.5 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Event Agenda</Typography>
          <Typography variant="caption" color="text.secondary">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            {bookmarkedIds.size > 0 && ` • ${bookmarkedIds.size} bookmarked`}
          </Typography>
        </Box>

        {/* Track filter tabs */}
        {(tracks.length > 0 || bookmarkedIds.size > 0) && (
          <Tabs
            value={filterTrack}
            onChange={(_, v) => setFilterTrack(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              minHeight: 36,
              '& .MuiTab-root': {
                minHeight: 36,
                textTransform: 'none',
                fontSize: '0.8rem',
                fontWeight: 500,
                px: 2,
              },
            }}
          >
            <Tab label="All Sessions" value="all" />
            {bookmarkedIds.size > 0 && <Tab label="⭐ My Schedule" value="bookmarked" />}
            {tracks.map(track => (
              <Tab key={track} label={track} value={track} />
            ))}
          </Tabs>
        )}

        {/* Timeline */}
        {sortedSessions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {filterTrack === 'bookmarked' ? 'No bookmarked sessions yet. Tap the bookmark icon to save sessions.' : 'No sessions in this track.'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative' }}>
            {/* Vertical timeline line */}
            <Box
              sx={{
                position: 'absolute',
                left: 28,
                top: 0,
                bottom: 0,
                width: 2,
                bgcolor: 'divider',
                display: { xs: 'none', sm: 'block' },
              }}
            />

            {Object.entries(timeSlots).map(([time, slotSessions]) => (
              <Box key={time} sx={{ mb: 3 }}>
                {/* Time marker */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      border: '2px solid',
                      borderColor: 'background.paper',
                      boxShadow: 1,
                      ml: { xs: 0, sm: '23px' },
                      display: { xs: 'none', sm: 'block' },
                    }}
                  />
                  <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.7rem' }}>
                    {time === 'TBD' ? 'Time TBD' : time}
                  </Typography>
                </Box>

                {/* Sessions in this time slot */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: { xs: 0, sm: 6 } }}>
                  {slotSessions.map(session => (
                    <SessionCard
                      key={session.sessionId}
                      session={session}
                      isBookmarked={bookmarkedIds.has(session.sessionId)}
                      isExpanded={expandedId === session.sessionId}
                      onToggleBookmark={() => toggleBookmark(session.sessionId)}
                      onToggleExpand={() => setExpandedId(expandedId === session.sessionId ? null : session.sessionId)}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// --- Individual Session Card ---
interface SessionCardProps {
  session: EventSession;
  isBookmarked: boolean;
  isExpanded: boolean;
  onToggleBookmark: () => void;
  onToggleExpand: () => void;
}

function SessionCard({ session, isBookmarked, isExpanded, onToggleBookmark, onToggleExpand }: SessionCardProps) {
  const typeColor = SESSION_TYPE_COLORS[session.type || 'general'] || '#14B8A6';

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: isBookmarked ? 'primary.light' : 'divider',
        bgcolor: isBookmarked ? 'rgba(27, 94, 75, 0.03)' : 'background.paper',
        overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': { borderColor: 'primary.light', boxShadow: 1 },
      }}
    >
      {/* Main row */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, cursor: 'pointer' }}
        onClick={onToggleExpand}
      >
        {/* Type color bar */}
        <Box sx={{ width: 4, height: 40, borderRadius: 2, bgcolor: typeColor, flexShrink: 0 }} />

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {session.title || 'Untitled Session'}
            </Typography>
            <Chip
              label={SESSION_TYPE_LABELS[session.type || 'general']}
              size="small"
              sx={{
                fontSize: '0.6rem',
                height: 18,
                bgcolor: `${typeColor}15`,
                color: typeColor,
                fontWeight: 600,
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {(session.startTime || session.endTime) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {session.startTime}{session.endTime ? ` – ${session.endTime}` : ''}
                </Typography>
              </Box>
            )}
            {session.speaker && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">{session.speaker}</Typography>
              </Box>
            )}
            {session.room && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Room sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">{session.room}</Typography>
              </Box>
            )}
            {session.track && (
              <Chip label={session.track} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
            )}
          </Box>
        </Box>

        {/* Bookmark button */}
        <Tooltip title={isBookmarked ? 'Remove from schedule' : 'Add to my schedule'}>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); onToggleBookmark(); }}
            sx={{ color: isBookmarked ? 'primary.main' : 'text.disabled' }}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark session'}
          >
            {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
        </Tooltip>

        {/* Expand icon */}
        {(session.description || session.speakerBio) && (
          <IconButton size="small" sx={{ color: 'text.disabled' }}>
            {isExpanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
          </IconButton>
        )}
      </Box>

      {/* Expanded details */}
      <Collapse in={isExpanded}>
        <Box sx={{ px: 2, pb: 2, pt: 0 }}>
          {session.description && (
            <Box sx={{ mb: 1.5, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {session.description}
              </Typography>
            </Box>
          )}
          {session.speakerBio && session.speaker && (
            <Box sx={{ bgcolor: 'background.default', borderRadius: 1.5, p: 1.5 }}>
              <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                About {session.speaker}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {session.speakerBio}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
