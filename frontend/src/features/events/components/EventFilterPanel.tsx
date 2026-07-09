import { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Collapse,
  Chip,
  InputAdornment,
  IconButton,
  Typography,
} from '@mui/material';
import {
  FilterList,
  Close,
  ExpandMore,
  ExpandLess,
  Search,
} from '@mui/icons-material';
import { EventCategory, EventStatus } from '../types';

export interface EventFilterValues {
  search: string;
  category: string;
  status: string;
  venue: string;
  organizer: string;
  dateFrom: string;
  dateTo: string;
  capacityMin: string;
  capacityMax: string;
}

const defaultFilters: EventFilterValues = {
  search: '',
  category: 'all',
  status: 'all',
  venue: '',
  organizer: '',
  dateFrom: '',
  dateTo: '',
  capacityMin: '',
  capacityMax: '',
};

interface EventFilterPanelProps {
  filters: EventFilterValues;
  onChange: (filters: EventFilterValues) => void;
  /** Hide certain filter fields that aren't relevant */
  hideFields?: Array<keyof EventFilterValues>;
  /** Available venues for the dropdown (auto-extracted from events) */
  venues?: string[];
  /** Available organizers for the dropdown (auto-extracted from events) */
  organizers?: string[];
}

export { defaultFilters };

export default function EventFilterPanel({
  filters,
  onChange,
  hideFields = [],
  venues = [],
  organizers = [],
}: EventFilterPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const isVisible = (field: keyof EventFilterValues) => !hideFields.includes(field);

  const updateFilter = (field: keyof EventFilterValues, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    onChange({ ...defaultFilters });
    setExpanded(false);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return false; // search shown separately
    if (hideFields.includes(key as keyof EventFilterValues)) return false;
    if (key === 'category' || key === 'status') return value !== 'all';
    return value !== '';
  }).length;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Primary row: Search + Category + Filter toggle */}
      <Box sx={{ display: 'flex', gap: 2, mb: expanded ? 2 : 0, flexWrap: 'wrap', alignItems: 'center' }}>
        {isVisible('search') && (
          <TextField
            placeholder="Search events..."
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: filters.search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => updateFilter('search', '')}>
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        )}

        {isVisible('category') && (
          <TextField
            select
            value={filters.category}
            onChange={e => updateFilter('category', e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {Object.values(EventCategory).map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </TextField>
        )}

        {isVisible('status') && (
          <TextField
            select
            value={filters.status}
            onChange={e => updateFilter('status', e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            {Object.values(EventStatus).map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        )}

        <Button
          variant={expanded ? 'contained' : 'outlined'}
          size="small"
          startIcon={<FilterList />}
          endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setExpanded(!expanded)}
          sx={{ height: 40, whiteSpace: 'nowrap' }}
        >
          Filters
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              color="primary"
              sx={{ ml: 0.75, height: 20, fontSize: '0.7rem', minWidth: 20 }}
            />
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            size="small"
            onClick={clearFilters}
            sx={{ height: 40, color: 'text.secondary' }}
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Expanded filter panel */}
      <Collapse in={expanded}>
        <Box
          sx={{
            p: 2.5,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="overline" sx={{ fontSize: '0.65rem', mb: 2, display: 'block', color: 'text.secondary' }}>
            ADVANCED FILTERS
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            {/* Date range */}
            {isVisible('dateFrom') && (
              <TextField
                type="date"
                label="From Date"
                value={filters.dateFrom}
                onChange={e => updateFilter('dateFrom', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            )}
            {isVisible('dateTo') && (
              <TextField
                type="date"
                label="To Date"
                value={filters.dateTo}
                onChange={e => updateFilter('dateTo', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            )}

            {/* Venue */}
            {isVisible('venue') && (
              <TextField
                select={venues.length > 0}
                label="Venue"
                value={filters.venue}
                onChange={e => updateFilter('venue', e.target.value)}
                size="small"
                placeholder={venues.length === 0 ? 'Type to filter...' : undefined}
              >
                {venues.length > 0 && <MenuItem value="">All Venues</MenuItem>}
                {venues.map(v => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            )}

            {/* Organizer */}
            {isVisible('organizer') && (
              <TextField
                select={organizers.length > 0}
                label="Organizer"
                value={filters.organizer}
                onChange={e => updateFilter('organizer', e.target.value)}
                size="small"
                placeholder={organizers.length === 0 ? 'Type to filter...' : undefined}
              >
                {organizers.length > 0 && <MenuItem value="">All Organizers</MenuItem>}
                {organizers.map(o => (
                  <MenuItem key={o} value={o}>{o}</MenuItem>
                ))}
              </TextField>
            )}

            {/* Capacity range */}
            {isVisible('capacityMin') && (
              <TextField
                type="number"
                label="Min Capacity"
                value={filters.capacityMin}
                onChange={e => updateFilter('capacityMin', e.target.value)}
                size="small"
                inputProps={{ min: 0 }}
              />
            )}
            {isVisible('capacityMax') && (
              <TextField
                type="number"
                label="Max Capacity"
                value={filters.capacityMax}
                onChange={e => updateFilter('capacityMax', e.target.value)}
                size="small"
                inputProps={{ min: 0 }}
              />
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
