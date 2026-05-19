/**
 * TickBill — ProjectPicker Component
 * Quick project selection for the timer
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useTimerStore } from '@/stores/timerStore';

interface PickerProject {
  id: string;
  name: string;
  color: string;
}

interface ProjectPickerProps {
  projects: PickerProject[];
}

export function ProjectPicker({ projects }: ProjectPickerProps) {
  const theme = useTheme();
  const { currentProjectId, setProject } = useTimerStore();

  const handleSelect = (projectId: string) => {
    Haptics.selectionAsync();
    setProject(projectId);
  };

  if (projects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[Typography.caption, { color: theme.textTertiary, textAlign: 'center' }]}>
          Erstelle ein Projekt, um den Timer zu nutzen
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[Typography.label, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>
        Projekt auswählen
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {projects.map((project, index) => {
          const isSelected = project.id === currentProjectId;
          return (
            <Animated.View
              key={project.id}
              entering={FadeInDown.delay(index * 50).springify()}
            >
              <TouchableOpacity
                onPress={() => handleSelect(project.id)}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? project.color + '20'
                      : theme.isDark
                        ? theme.surfaceElevated
                        : theme.background,
                    borderColor: isSelected ? project.color : theme.border,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: project.color },
                  ]}
                />
                <Text
                  style={[
                    Typography.captionMedium,
                    {
                      color: isSelected ? project.color : theme.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {project.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
  },
  scrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
