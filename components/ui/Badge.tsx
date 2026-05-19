/**
 * TickBill — Badge Component
 * Status badges with color-coding
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { BorderRadius, Spacing } from '@/constants/Spacing';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  dot = false,
  style,
}: BadgeProps) {
  const theme = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: theme.primarySoft, text: theme.primaryDark, dot: theme.primary };
      case 'success':
        return { bg: theme.successSoft, text: theme.success, dot: theme.success };
      case 'warning':
        return { bg: theme.warningSoft, text: theme.warning, dot: theme.warning };
      case 'danger':
        return { bg: theme.dangerSoft, text: theme.danger, dot: theme.danger };
      case 'info':
        return { bg: theme.infoSoft, text: theme.info, dot: theme.info };
      default:
        return { bg: theme.borderLight, text: theme.textSecondary, dot: theme.textTertiary };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingVertical: size === 'sm' ? 2 : 4,
          paddingHorizontal: size === 'sm' ? Spacing.sm : Spacing.md,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: colors.dot },
          ]}
        />
      )}
      <Text
        style={[
          size === 'sm' ? Typography.small : Typography.captionMedium,
          { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
