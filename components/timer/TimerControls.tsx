/**
 * TickBill — TimerControls Component
 * Start/Stop/Pause buttons — saves time entries to store on stop
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Play as PlayIcon,
  Pause as PauseIcon,
  Square as StopIcon,
} from 'iconoir-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useTimerStore } from '@/stores/timerStore';
import { useTimeEntryStore } from '@/stores/timeEntryStore';
import { useProjectStore } from '@/stores/projectStore';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface TimerControlsProps {
  onStartPress?: () => void;
}

export function TimerControls({ onStartPress }: TimerControlsProps) {
  const theme = useTheme();
  const { isRunning, isPaused, currentProjectId, startTimer, pauseTimer, resumeTimer, stopTimer } =
    useTimerStore();
  const addEntry = useTimeEntryStore((s) => s.addEntry);
  const getProject = useProjectStore((s) => s.getProject);

  const mainScale = useSharedValue(1);
  const secondaryScale = useSharedValue(1);

  const mainAnimated = useAnimatedStyle(() => ({
    transform: [{ scale: mainScale.value }],
  }));

  const secondaryAnimated = useAnimatedStyle(() => ({
    transform: [{ scale: secondaryScale.value }],
  }));

  const handleMainPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    mainScale.value = withSpring(0.9, { damping: 10 });
    setTimeout(() => {
      mainScale.value = withSpring(1, { damping: 10 });
    }, 100);

    if (!isRunning) {
      if (!currentProjectId) {
        if (Platform.OS === 'web') {
          window.alert('Bitte wähle zuerst ein Projekt aus.');
        } else {
          Alert.alert('Kein Projekt', 'Bitte wähle zuerst ein Projekt aus.');
        }
        onStartPress?.();
        return;
      }
      startTimer(currentProjectId);
    } else {
      if (isPaused) {
        resumeTimer();
      } else {
        pauseTimer();
      }
    }
  };

  const handleStop = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    secondaryScale.value = withSpring(0.9, { damping: 10 });
    setTimeout(() => {
      secondaryScale.value = withSpring(1, { damping: 10 });
    }, 100);

    const result = stopTimer();
    if (result && result.durationSeconds > 0) {
      await addEntry({
        project_id: result.projectId,
        description: result.description,
        start_time: new Date(result.startTime).toISOString(),
        end_time: new Date(result.endTime).toISOString(),
        duration_seconds: result.durationSeconds,
        is_manual: false,
        is_billable: true,
        is_invoiced: false,
        invoice_id: null,
      });
    }
  };

  const mainButtonColor = isRunning
    ? isPaused
      ? theme.timerRunning
      : theme.timerPaused
    : theme.primary; // TickBill Mint green for stopped state

  const mainButtonLabel = isRunning
    ? isPaused
      ? 'Fortsetzen'
      : 'Pause'
    : 'Starten';

  const MainIcon = isRunning && !isPaused ? PauseIcon : PlayIcon;

  return (
    <View style={styles.container}>
      {/* Running State: Stop and Pause Buttons */}
      <View style={[styles.buttonRow, { display: isRunning ? 'flex' : 'none' }]}>
        <AnimatedTouchable
          onPress={handleStop}
          activeOpacity={0.8}
          style={[
            styles.button,
            {
              backgroundColor: theme.danger + '15',
              borderColor: theme.danger + '30',
              borderWidth: 1,
            },
            secondaryAnimated,
          ]}
        >
          <StopIcon color={theme.danger} width={20} height={20} strokeWidth={2.5} />
          <Text style={[Typography.button, { color: theme.danger }]}>Stop</Text>
        </AnimatedTouchable>

        <AnimatedTouchable
          onPress={handleMainPress}
          activeOpacity={0.8}
          style={[
            styles.button,
            {
              backgroundColor: mainButtonColor + '15',
              borderColor: mainButtonColor + '30',
              borderWidth: 1,
            },
            mainAnimated,
          ]}
        >
          <MainIcon color={mainButtonColor} width={20} height={20} strokeWidth={2.5} />
          <Text style={[Typography.button, { color: mainButtonColor }]}>{mainButtonLabel}</Text>
        </AnimatedTouchable>
      </View>

      {/* Stopped State: Start Button */}
      <View style={{ display: isRunning ? 'none' : 'flex' }}>
        <AnimatedTouchable
          onPress={handleMainPress}
          activeOpacity={0.8}
          style={[
            styles.startButton,
            {
              backgroundColor: mainButtonColor,
              shadowColor: mainButtonColor,
              shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 12,
              elevation: 6,
            },
            mainAnimated,
          ]}
        >
          <MainIcon color="#000000" width={20} height={20} strokeWidth={2.5} />
          <Text style={[Typography.button, { color: '#000000' }]}>{mainButtonLabel}</Text>
        </AnimatedTouchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  button: {
    width: 140,
    height: 56,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  startButton: {
    width: 200,
    height: 56,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
});
