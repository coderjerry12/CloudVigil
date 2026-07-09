import { useState, useMemo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import type { EventItem } from '../types';

interface EventCalendarProps {
  events: EventItem[];
  onEventClick?: (event: EventItem) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EventCalendar({ events, onEventClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Get events by day for this month
  const eventsByDay = useMemo(() => {
    const map: Record<number, EventItem[]> = {};
    events.forEach(event => {
      const d = new Date(event.eventDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(event);
      }
    });
    return map;
  }, [events, year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="body2"
          sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600 }}
          onClick={goToday}
        >
          Today
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={prevMonth}><ChevronLeft /></IconButton>
          <Typography variant="h4" sx={{ minWidth: 160, textAlign: 'center' }}>{monthName}</Typography>
          <IconButton size="small" onClick={nextMonth}><ChevronRight /></IconButton>
        </Box>
        <Box />
      </Box>

      {/* Day headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid', borderColor: 'divider', mb: 0.5 }}>
        {DAYS.map(day => (
          <Typography key={day} variant="caption" sx={{ textAlign: 'center', py: 1, fontWeight: 600, color: 'text.secondary' }}>
            {day}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        {cells.map((day, idx) => {
          const dayEvents = day ? eventsByDay[day] || [] : [];
          return (
            <Box
              key={idx}
              sx={{
                minHeight: { xs: 60, md: 80 },
                p: 0.5,
                borderRight: (idx + 1) % 7 !== 0 ? '1px solid' : 'none',
                borderBottom: idx < cells.length - 7 ? '1px solid' : 'none',
                borderColor: 'divider',
                bgcolor: day && isToday(day) ? 'rgba(20,184,166,0.05)' : 'transparent',
              }}
            >
              {day && (
                <>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      fontWeight: isToday(day) ? 700 : 400,
                      color: isToday(day) ? 'primary.main' : day ? 'text.primary' : 'text.disabled',
                      mb: 0.25,
                      pl: 0.5,
                    }}
                  >
                    {day}
                  </Typography>
                  {dayEvents.slice(0, 2).map(ev => (
                    <Box
                      key={ev.eventId}
                      onClick={() => onEventClick?.(ev)}
                      sx={{
                        px: 0.5,
                        py: 0.25,
                        mb: 0.25,
                        borderRadius: 0.5,
                        bgcolor: 'rgba(20,184,166,0.1)',
                        borderLeft: '2px solid',
                        borderColor: 'primary.main',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        '&:hover': { bgcolor: 'rgba(20,184,166,0.2)' },
                      }}
                    >
                      <Typography variant="caption" noWrap sx={{ fontSize: '0.6rem', fontWeight: 500, display: 'block' }}>
                        {new Date(ev.eventDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {ev.title}
                      </Typography>
                    </Box>
                  ))}
                  {dayEvents.length > 2 && (
                    <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.secondary', pl: 0.5 }}>
                      +{dayEvents.length - 2} more
                    </Typography>
                  )}
                </>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
