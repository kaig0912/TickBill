/**
 * TickBill Design System — Color Tokens
 * Indigo-based palette with full dark mode support
 */

export const Colors = {
  light: {
    // Brand
    primary: '#00FBB0',
    primaryDark: '#00D998',
    primaryLight: '#33FBC0',
    primarySoft: '#E6FFF8',
    primaryGlow: 'rgba(0, 251, 176, 0.15)',

    // Semantic
    success: '#10B981',
    successSoft: '#D1FAE5',
    warning: '#F59E0B',
    warningSoft: '#FEF3C7',
    danger: '#EF4444',
    dangerSoft: '#FEE2E2',
    info: '#3B82F6',
    infoSoft: '#DBEAFE',

    // Surfaces
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfacePressed: '#F1F5F9',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // Text
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',

    // Timer specific
    timerRunning: '#10B981',
    timerPaused: '#F59E0B',
    timerStopped: '#64748B',
    timerGlow: 'rgba(16, 185, 129, 0.2)',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    tabActive: '#00FBB0',
    tabInactive: '#94A3B8',

    // Shadows
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,

    // Overlay
    overlay: 'rgba(15, 23, 42, 0.5)',

    // Status
    statusDraft: '#64748B',
    statusSent: '#3B82F6',
    statusPaid: '#10B981',
    statusOverdue: '#EF4444',
    statusCancelled: '#94A3B8',

    // Project status
    projectActive: '#10B981',
    projectPaused: '#F59E0B',
    projectCompleted: '#00FBB0',
  },
  dark: {
    // Brand
    primary: '#00FBB0',
    primaryDark: '#00D998',
    primaryLight: '#33FBC0',
    primarySoft: '#003324',
    primaryGlow: 'rgba(0, 251, 176, 0.2)',

    // Semantic
    success: '#34D399',
    successSoft: '#064E3B',
    warning: '#FBBF24',
    warningSoft: '#78350F',
    danger: '#F87171',
    dangerSoft: '#7F1D1D',
    info: '#60A5FA',
    infoSoft: '#1E3A5F',

    // Surfaces
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    surfacePressed: '#3A3A3C',
    border: '#38383A',
    borderLight: '#2C2C2E',

    // Text
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textInverse: '#0F172A',

    // Timer specific
    timerRunning: '#34D399',
    timerPaused: '#FBBF24',
    timerStopped: '#94A3B8',
    timerGlow: 'rgba(52, 211, 153, 0.25)',

    // Tab bar
    tabBar: '#1C1C1E',
    tabBarBorder: '#38383A',
    tabActive: '#00FBB0',
    tabInactive: '#64748B',

    // Shadows
    shadowColor: '#000000',
    shadowOpacity: 0.3,

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Status
    statusDraft: '#94A3B8',
    statusSent: '#60A5FA',
    statusPaid: '#34D399',
    statusOverdue: '#F87171',
    statusCancelled: '#64748B',

    // Project status
    projectActive: '#34D399',
    projectPaused: '#FBBF24',
    projectCompleted: '#00FBB0',
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;
