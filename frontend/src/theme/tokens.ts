/**
 * Design tokens derived from UI_guidelines.md
 * Single source of truth for colors, spacing, shadows, and layout constants.
 */

export const colors = {
  primary: {
    main: '#1B5E4B',
    dark: '#0D3B30',
    light: '#4CA68E',
    contrast: '#FFFFFF',
  },
  secondary: {
    main: '#14B8A6',
    dark: '#0E8A7D',
    light: '#5EEAD4',
  },
  background: {
    default: '#F8F6F1',
    paper: '#FFFFFF',
    subtle: '#F0EDE7',
    dark: '#0F1A2E',
    darkCard: '#1A2740',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#5F6368',
    disabled: '#9E9E9E',
    inverse: '#F8F6F1',
  },
  success: { main: '#22C55E', light: '#DCFCE7' },
  warning: { main: '#F59E0B', light: '#FEF3C7' },
  error: { main: '#EF4444', light: '#FEE2E2' },
  info: { main: '#3B82F6', light: '#DBEAFE' },
  safety: {
    sos: '#DC2626',
    medical: '#2563EB',
    fire: '#EA580C',
    food: '#16A34A',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const layout = {
  sidebarWidth: 260,
  sidebarCollapsed: 72,
  topBarHeight: 64,
  contentMaxWidth: 1200,
  bottomNavHeight: 56,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  level0: 'none',
  level1: '0 1px 3px rgba(0,0,0,0.08)',
  level2: '0 4px 12px rgba(0,0,0,0.10)',
  level3: '0 8px 24px rgba(0,0,0,0.12)',
  level4: '0 16px 48px rgba(0,0,0,0.16)',
} as const;
