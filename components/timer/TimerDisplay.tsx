/**
 * TickBill — TimerDisplay Component
 * Large animated clock display with glow effect
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTimerStore } from '@/stores/timerStore';
import { formatDuration } from '@/lib/utils';

export function TimerDisplay() {
  const theme = useTheme();
  const { isRunning, isPaused, getElapsedSeconds } = useTimerStore();
  const [displaySeconds, setDisplaySeconds] = useState(0);

  // Pulse animation for running state
  const glowOpacity = useSharedValue(0);
  const dotScale = useSharedValue(1);

  useEffect(() => {
    if (isRunning && !isPaused) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
      dotScale.value = withTiming(1, { duration: 300 });
    }
  }, [isRunning, isPaused]);

  // Update display every second
  useEffect(() => {
    if (!isRunning) {
      if (displaySeconds !== 0) {
        setDisplaySeconds(0);
      }
      return;
    }

    const interval = setInterval(() => {
      setDisplaySeconds(getElapsedSeconds());
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  const timerColor = isRunning
    ? isPaused
      ? theme.timerPaused
      : theme.timerRunning
    : theme.textSecondary;

  const statusText = isRunning
    ? isPaused
      ? 'Pausiert'
      : 'Läuft'
    : 'Bereit';

  return (
    <View style={styles.container}>
      {/* Glowing Outer Ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            borderColor: theme.primary,
            shadowColor: theme.primary,
            shadowOpacity: 0.5,
          },
          glowStyle,
        ]}
      />

      {/* Static subtle ring (always visible) */}
      <View
        style={[
          styles.staticRing,
          {
            borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      />

      {/* Inner Circle */}
      <View
        style={[
          styles.innerCircle,
          {
            backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF',
            shadowColor: theme.shadowColor,
            shadowOpacity: theme.isDark ? 0.4 : 0.12,
          },
        ]}
      >
        <Text
          style={[
            styles.timerText,
            { color: timerColor },
          ]}
        >
          {formatDuration(displaySeconds)}
        </Text>

        <View style={styles.statusRow}>
          <Animated.View
            style={[
              styles.statusDot,
              { backgroundColor: timerColor },
              dotAnimatedStyle,
            ]}
          />
          <Text style={[Typography.caption, { color: theme.textTertiary }]}>
            {statusText}
          </Text>
        </View>
      </View>
    </View>
  );
}

const CIRCLE_SIZE = 240;
const INNER_SIZE = 220;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  timerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  glowRing: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 12,
  },
  staticRing: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
  },
  innerCircle: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
