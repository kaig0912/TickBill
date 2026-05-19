/**
 * TickBill — Input Component
 * Styled text input with label, error state, and icon support
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Typography, FontFamily } from '@/constants/Typography';
import { BorderRadius, Spacing } from '@/constants/Spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  required?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({
  label,
  error,
  hint,
  icon,
  containerStyle,
  required = false,
  style,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? theme.danger
      : focusProgress.value > 0.5
        ? theme.primary
        : theme.border,
    borderWidth: focusProgress.value > 0.5 ? 1.5 : 1,
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, { duration: 200 });
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: 200 });
    props.onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && (
        <Text style={[Typography.label, { color: error ? theme.danger : theme.textSecondary, marginBottom: Spacing.xs }]}>
          {label}
          {required && <Text style={{ color: theme.danger }}> *</Text>}
        </Text>
      )}

      <AnimatedView
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.isDark ? theme.surfaceElevated : theme.background,
            borderRadius: BorderRadius.md,
          },
          animatedBorderStyle,
        ]}
      >
        {!!icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={theme.textTertiary}
          style={[
            styles.input,
            {
              color: theme.text,
              fontFamily: FontFamily.regular,
              fontSize: 16,
            },
            icon ? { paddingLeft: 0 } : null,
            style,
          ]}
        />
      </AnimatedView>

      {!!(error || hint) && (
        <Text
          style={[
            Typography.small,
            {
              color: error ? theme.danger : theme.textTertiary,
              marginTop: Spacing.xs,
            },
          ]}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
