/**
 * TickBill Design System — Typography
 * Uses Inter font family from Google Fonts
 */

import { TextStyle } from 'react-native';

export const FontFamily = {
  light: 'Inter_400Regular',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Typography: Record<string, TextStyle> = {
  // Display
  timer: {
    fontFamily: FontFamily.light,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -2,
  },

  // Headings
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FontFamily.semibold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },

  // Body
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: 18,
    lineHeight: 28,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySemibold: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 24,
  },

  // Small
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  captionMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  small: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  // Special
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  button: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  buttonSmall: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
  },

  // Numeric (for amounts, durations)
  numeric: {
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  numericLarge: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  numericSmall: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
} as const;
