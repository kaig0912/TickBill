import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, Layout as ReanimatedLayout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Typography, FontFamily } from '@/constants/Typography';
import { Spacing, Layout, BorderRadius } from '@/constants/Spacing';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { TimerControls } from '@/components/timer/TimerControls';
import { SelectInput } from '@/components/ui/SelectInput';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTimerStore } from '@/stores/timerStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTimeEntryStore } from '@/stores/timeEntryStore';
import { Timer as TimerIcon, Check, EditPencil, NavArrowDown } from 'iconoir-react-native';
import { formatDurationCompact, formatCurrency, formatTime } from '@/lib/utils';

export default function TimerScreen() {
  const theme = useTheme();
  const { isRunning, currentProjectId, setProject, currentDescription, setDescription } = useTimerStore();
  const projects = useProjectStore((s) => s.projects);
  const activeProjects = projects.filter((p) => p.status === 'active');
  const entries = useTimeEntryStore((s) => s.entries);
  
  const getRecentEntries = useTimeEntryStore((s) => s.getRecentEntries);
  const archiveEntry = useTimeEntryStore((s) => s.archiveEntry);
  const getProject = useProjectStore((s) => s.getProject);

  const recentEntries = getRecentEntries(10);

  const [descriptionLocked, setDescriptionLocked] = useState(false);
  const [isEntriesExpanded, setIsEntriesExpanded] = useState(false);

  // Unlock description when timer stops
  React.useEffect(() => {
    if (!isRunning) {
      setDescriptionLocked(false);
    }
  }, [isRunning]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(80).springify()} style={styles.header}>
          <Text style={[styles.brandText, { color: theme.primary }]}>
            TickBill
          </Text>
        </Animated.View>

        {/* Scrollable Content (Scrolls only when dropdown is expanded) */}
        <ScrollView
          scrollEnabled={isEntriesExpanded}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Project & Task Selection */}
          <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(120).springify()} style={styles.selectionSection}>
            <SelectInput
              label="Projekt"
              placeholder="Wofür arbeitest du?"
              value={currentProjectId || ''}
              options={activeProjects.map(p => ({ label: p.name, value: p.id }))}
              onSelect={setProject}
            />
            <View style={{ marginTop: Spacing.md }}>
              <Text style={[Typography.caption, { color: theme.textSecondary, marginBottom: 4 }]}>Aufgabe</Text>
              <View style={styles.taskRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder="Was genau machst du gerade?"
                    value={currentDescription}
                    onChangeText={setDescription}
                    editable={!descriptionLocked}
                    style={descriptionLocked ? { opacity: 0.7 } : undefined}
                  />
                </View>
                {isRunning && (
                  <TouchableOpacity
                    onPress={() => setDescriptionLocked(!descriptionLocked)}
                    style={[
                      styles.okButton,
                      { backgroundColor: descriptionLocked ? theme.success : theme.primary },
                    ]}
                    activeOpacity={0.7}
                  >
                    {descriptionLocked ? (
                      <EditPencil color="#FFF" width={18} height={18} strokeWidth={2} />
                    ) : (
                      <Check color="#FFF" width={18} height={18} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Timer Section */}
          <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(200).springify()} style={styles.timerSection}>
            <TimerDisplay />
            <View style={{ marginTop: Spacing.lg }}>
              <TimerControls />
            </View>
          </Animated.View>

          {/* Expandable Recent Entries */}
          <Animated.View 
            entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(300).springify()} 
            layout={Platform.OS === 'web' ? undefined : ReanimatedLayout.springify()} 
            style={styles.entriesSection}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsEntriesExpanded(!isEntriesExpanded)}
              style={[
                styles.dropdownHeader,
                {
                  backgroundColor: theme.isDark ? theme.surfaceElevated : theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Text style={[Typography.body, { color: theme.text, fontFamily: FontFamily.regular }]}>
                  Letzte Einträge
                </Text>
                {recentEntries.length > 0 && (
                  <Badge label={recentEntries.length.toString()} variant="default" size="sm" />
                )}
              </View>
              <NavArrowDown
                color={theme.textSecondary}
                width={20}
                height={20}
                strokeWidth={2.5}
                style={{
                  transform: [{ rotate: isEntriesExpanded ? '180deg' : '0deg' }],
                }}
              />
            </TouchableOpacity>

            {isEntriesExpanded && (
              <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.duration(200)} style={styles.dropdownContent}>
                {recentEntries.length === 0 ? (
                  <Card style={{ paddingVertical: Spacing.xl }}>
                    <EmptyState
                      icon={<TimerIcon color={theme.primary} width={24} height={24} strokeWidth={1.5} />}
                      title="Noch keine Einträge"
                      description="Starte den Timer, um deinen ersten Eintrag aufzuzeichnen."
                    />
                  </Card>
                ) : (
                  recentEntries.map((entry) => {
                    const project = getProject(entry.project_id);
                    
                    const handleLongPress = () => {
                      if (entry.is_invoiced) {
                        Alert.alert('Nicht möglich', 'Diese Arbeitszeit wurde bereits abgerechnet und kann nicht gelöscht werden.');
                        return;
                      }
                      Alert.alert(
                        'Arbeitszeit löschen',
                        'Möchtest du diese Arbeitszeit in den Papierkorb verschieben?',
                        [
                          { text: 'Abbrechen', style: 'cancel' },
                          { 
                            text: 'Löschen', 
                            style: 'destructive', 
                            onPress: () => archiveEntry(entry.id) 
                          }
                        ]
                      );
                    };

                    return (
                      <TouchableOpacity
                        key={entry.id}
                        activeOpacity={0.8}
                        onPress={() => {}}
                        onLongPress={handleLongPress}
                        delayLongPress={400}
                      >
                        <Card style={styles.entryCard}>
                          <View style={styles.entryRow}>
                            <View style={styles.entryLeft}>
                              <View style={[styles.entryColorBar, { backgroundColor: theme.primarySoft }]} />
                              <View style={styles.entryInfo}>
                                <Text style={[Typography.captionMedium, { color: theme.text }]} numberOfLines={1}>
                                  {entry.description || 'Ohne Beschreibung'}
                                </Text>
                                <Text style={[Typography.small, { color: theme.textTertiary }]}>
                                  {project?.name || 'Gelöschtes Projekt'} · {formatTime(entry.start_time)}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.entryRight}>
                              <Text style={[Typography.numericSmall, { color: theme.text }]}>
                                {formatDurationCompact(entry.duration_seconds)}
                              </Text>
                              {entry.is_invoiced && (
                                <Badge label="Abgerechnet" variant="success" size="sm" />
                              )}
                            </View>
                          </View>
                        </Card>
                      </TouchableOpacity>
                    );
                  })
                )}
              </Animated.View>
            )}
          </Animated.View>

          {/* Bottom spacer to make scrolling comfortable when expanded */}
          {isEntriesExpanded && <View style={{ height: 60 }} />}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.sm },
  header: { alignItems: 'center', marginBottom: Spacing.md },
  brandText: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    letterSpacing: -1,
  },
  selectionSection: {
    zIndex: 10,
    marginBottom: Spacing.sm,
  },
  timerSection: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    zIndex: 1,
  },
  taskRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  okButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entriesSection: {
    marginTop: Spacing.sm,
    flex: 1,
    flexShrink: 1,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 48,
  },
  dropdownContent: {
    marginTop: Spacing.sm,
    flex: 1,
    flexShrink: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  entryCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  entryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.sm },
  entryColorBar: { width: 3, height: 36, borderRadius: 2, marginRight: Spacing.md },
  entryInfo: { flex: 1, gap: 2 },
  entryRight: { alignItems: 'flex-end', gap: 4 },
});
