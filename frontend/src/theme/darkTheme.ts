import { createTheme } from '@mui/material/styles';

/**
 * Obsidian Flux Dark Theme
 * Deep navy/black foundation with vibrant teal accents.
 * High-contrast borders at 30% opacity for "blueprint" definition.
 * Card pop effect on hover with glow shadows.
 */
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#14B8A6',
      dark: '#0E8A7D',
      light: '#5EEAD4',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#14B8A6',
      dark: '#0E8A7D',
      light: '#5EEAD4',
    },
    background: {
      default: '#040E1A',
      paper: '#0D2440',
    },
    text: {
      primary: '#F0F6FC',
      secondary: '#94B3D0',
      disabled: '#4A6580',
    },
    success: { main: '#22C55E', light: '#0D3320' },
    warning: { main: '#F59E0B', light: '#3D2800' },
    error: { main: '#EF4444', light: '#3D1111' },
    info: { main: '#3B82F6', light: '#0D2547' },
    divider: 'rgba(255,255,255,0.1)',
  },
  typography: {
    fontFamily: "'Manrope', 'Inter', sans-serif",
    h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em' },
    h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4 },
    overline: { fontSize: '0.75rem', fontWeight: 700, lineHeight: 1.4, letterSpacing: '1.5px', textTransform: 'uppercase' },
    button: { fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 0 12px rgba(20, 184, 166, 0.25)',
          },
        },
      },
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          border: '1px solid rgba(255,255,255,0.12)',
          backgroundImage: 'none',
          backgroundColor: '#0D2440',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(20, 184, 166, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: '#94B3D0',
            fontWeight: 600,
            '&.Mui-focused': { color: '#14B8A6' },
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#F0F6FC',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
            '&:hover fieldset': { borderColor: '#14B8A6' },
            '&.Mui-focused fieldset': { borderColor: '#14B8A6' },
            '& input': { color: '#F0F6FC' },
            '& textarea': { color: '#F0F6FC' },
            '& input::placeholder': { color: '#4A6580', opacity: 1 },
            '& textarea::placeholder': { color: '#4A6580', opacity: 1 },
          },
          '& .MuiSelect-select': { color: '#F0F6FC' },
          '& .MuiSelect-icon': { color: '#94B3D0' },
          '& .MuiFormHelperText-root': { color: '#94B3D0' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#030B14',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#040E1A',
          color: '#F0F6FC',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 12px',
          padding: '10px 16px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(20, 184, 166, 0.1)',
            borderLeft: '4px solid #14B8A6',
            boxShadow: '0 0 15px rgba(20, 184, 166, 0.2)',
            '&:hover': { backgroundColor: 'rgba(20, 184, 166, 0.15)' },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12, backgroundColor: '#0A1E32', border: '1px solid rgba(255,255,255,0.1)' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.06)',
        },
      },
    },
  },
});

export default darkTheme;
