/**
 * TickBill — Projects Screen (real data from localStorage)
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Platform, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Folder } from 'iconoir-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Spacing, Layout, BorderRadius } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectInput } from '@/components/ui/SelectInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { formatCurrency, formatDurationCompact } from '@/lib/utils';
import { PROJECT_STATUS_LABELS } from '@/constants/config';
import { useProjectStore, ProjectData } from '@/stores/projectStore';
import { useClientStore } from '@/stores/clientStore';
import { useTimeEntryStore } from '@/stores/timeEntryStore';

function statusVariant(s: string) {
  if (s === 'active') return 'success' as const;
  if (s === 'paused') return 'warning' as const;
  return 'primary' as const;
}

export default function ProjectsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const projects = useProjectStore((s) => s.projects);
  const addProject = useProjectStore((s) => s.addProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const archiveProject = useProjectStore((s) => s.archiveProject);
  
  const clients = useClientStore((s) => s.clients);
  const getTotalSecondsByProject = useTimeEntryStore((s) => s.getTotalSecondsByProject);
  const getEntriesByProject = useTimeEntryStore((s) => s.getEntriesByProject);

  const [showForm, setShowForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [baseFee, setBaseFee] = useState('');
  const [clientId, setClientId] = useState('');

  const resetForm = () => {
    setEditingProjectId(null);
    setName('');
    setDescription('');
    setHourlyRate('');
    setBaseFee('');
    
    // Auto-select logic for new projects
    if (clients.length === 1) {
      setClientId(clients[0].id);
    } else if (projects.length > 0) {
      // Pick client from the most recently created project (last in array usually, or sort by date)
      const lastProject = [...projects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      setClientId(lastProject?.client_id || '');
    } else {
      setClientId('');
    }
  };

  const openForm = (project?: ProjectData) => {
    if (project) {
      setEditingProjectId(project.id);
      setName(project.name);
      setDescription(project.description);
      setHourlyRate(project.hourly_rate.toString());
      setBaseFee(project.base_fee ? project.base_fee.toString() : '');
      setClientId(project.client_id || '');
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !hourlyRate.trim() || !clientId) {
      const msg = 'Bitte fülle alle Pflichtfelder (Name, Kunde & Stundensatz) aus.';
      Platform.OS !== 'web' ? Alert.alert('Fehler', msg) : window.alert(msg);
      return;
    }

    const projectData = {
      name: name.trim(),
      description: description.trim(),
      client_id: clientId,
      hourly_rate: parseFloat(hourlyRate) || 0,
      base_fee: baseFee ? parseFloat(baseFee) : 0,
      status: 'active' as const,
    };

    if (editingProjectId) {
      await updateProject(editingProjectId, projectData);
    } else {
      await addProject(projectData);
    }
    
    setShowForm(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!editingProjectId) return;
    
    // Check if project has time entries
    const entries = getEntriesByProject(editingProjectId);
    
    const confirmAction = () => {
      archiveProject(editingProjectId);
      setShowForm(false);
      resetForm();
    };

    if (entries.length > 0) {
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Projekt archivieren',
          'Dieses Projekt hat bereits erfasste Zeiten. Wenn du es archivierst, werden auch die erfassten Zeiten ausgeblendet. Fortfahren?',
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Archivieren', style: 'destructive', onPress: confirmAction }
          ]
        );
      } else {
        if (window.confirm('Dieses Projekt hat erfasste Zeiten. Wirklich archivieren?')) {
          confirmAction();
        }
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Projekt löschen',
        'Möchtest du dieses Projekt in den Papierkorb verschieben?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Löschen', style: 'destructive', onPress: confirmAction }
        ]
      );
    } else {
      if (window.confirm('Projekt in den Papierkorb verschieben?')) {
        confirmAction();
      }
    }
  };

  const handleLongPressDelete = (project: any) => {
    const hasEntries = getTotalSecondsByProject(project.id) > 0;
    
    const confirmAction = () => {
      archiveProject(project.id);
    };

    if (hasEntries) {
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Projekt in den Papierkorb',
          'Dieses Projekt hat erfasste Arbeitszeiten. Möchtest du es trotzdem in den Papierkorb verschieben?',
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'In Papierkorb', style: 'destructive', onPress: confirmAction }
          ]
        );
      } else {
        if (window.confirm('Dieses Projekt hat Arbeitszeiten. Trotzdem in den Papierkorb verschieben?')) {
          confirmAction();
        }
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Projekt in den Papierkorb',
        `Möchtest du das Projekt "${project.name}" in den Papierkorb verschieben?`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'In Papierkorb', style: 'destructive', onPress: confirmAction }
        ]
      );
    } else {
      if (window.confirm(`Projekt "${project.name}" in den Papierkorb verschieben?`)) confirmAction();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(100).springify()} style={styles.header}>
          <Text style={[Typography.h1, { color: theme.text }]}>Projekte</Text>
        </Animated.View>

        {projects.length === 0 ? (
          <EmptyState
            icon={<Folder color={theme.primary} width={32} height={32} strokeWidth={1.5} />}
            title="Keine Projekte"
            description="Erstelle dein erstes Projekt, um Zeiten zu erfassen."
            actionTitle="Projekt anlegen"
            onAction={() => openForm()}
          />
        ) : (
          <View style={styles.listContainer}>
            {projects.map((project, index) => {
              const totalSeconds = getTotalSecondsByProject(project.id);
              const totalRevenue = (totalSeconds / 3600) * project.hourly_rate;
              const client = clients.find(c => c.id === project.client_id);
              
              return (
                <Animated.View key={project.id} entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(150 + index * 50).springify()}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => openForm(project)} onLongPress={() => handleLongPressDelete(project)} delayLongPress={400}>
                    <Card style={styles.card}>
                      <View style={styles.cardBody}>
                        <View style={styles.topRow}>
                          <View style={styles.nameRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={[Typography.bodySemibold, { color: theme.text }]} numberOfLines={1}>{project.name}</Text>
                              <Text style={[Typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                                {client ? client.company_name : 'Kein Kunde'}
                              </Text>
                            </View>
                          </View>
                          <Badge label={PROJECT_STATUS_LABELS[project.status] || project.status} variant={statusVariant(project.status)} dot />
                        </View>
                        
                        {project.description ? (
                          <Text style={[Typography.caption, { color: theme.textSecondary, marginTop: Spacing.sm }]} numberOfLines={2}>
                            {project.description}
                          </Text>
                        ) : null}
                        
                        <View style={[styles.statsRow, { borderTopColor: theme.borderLight }]}>
                          <View style={styles.stat}>
                            <Text style={[Typography.small, { color: theme.textTertiary }]}>Rate</Text>
                            <Text style={[Typography.numericSmall, { color: theme.text }]}>{formatCurrency(project.hourly_rate)}/h</Text>
                          </View>
                          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
                          <View style={styles.stat}>
                            <Text style={[Typography.small, { color: theme.textTertiary }]}>Stunden</Text>
                            <Text style={[Typography.numericSmall, { color: theme.text }]}>
                              {totalSeconds > 0 ? formatDurationCompact(totalSeconds) : '0m'}
                            </Text>
                          </View>
                          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
                          <View style={styles.stat}>
                            <Text style={[Typography.small, { color: theme.textTertiary }]}>Umsatz</Text>
                            <Text style={[Typography.numericSmall, { color: theme.success }]}>{formatCurrency(totalRevenue + (project.base_fee || 0))}</Text>
                          </View>
                        </View>
                        
                        {project.base_fee > 0 && (
                          <View style={{ marginTop: Spacing.sm }}>
                            <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                              Grundgebühr: {formatCurrency(project.base_fee)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
        {projects.length > 0 && <View style={{ height: 100 }} />}
      </ScrollView>

      {/* Floating Action Button */}
      {projects.length > 0 && (
        <Animated.View 
          entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(500).springify()} 
          style={[styles.fabContainer, { bottom: insets.bottom + Layout.tabBarHeight + Spacing.md }]}
        >
          <Button 
            title="Projekt anlegen" 
            onPress={() => openForm()} 
            variant="primary" 
            size="lg" 
            style={styles.fab} 
          />
        </Animated.View>
      )}

      {/* Create/Edit Project Modal */}
      <FormModal visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editingProjectId ? "Projekt bearbeiten" : "Neues Projekt"}>
        <Input label="Projektname" placeholder="z.B. Website Redesign" value={name} onChangeText={setName} required />
        <Input label="Beschreibung (Optional)" placeholder="Kurze Beschreibung" value={description} onChangeText={setDescription} />
        
        <View style={styles.formSection}>
          <SelectInput
            label="Kunde"
            placeholder={clients.length === 0 ? "Bitte zuerst Kunden anlegen" : "Kunden auswählen..."}
            value={clientId}
            options={clients.map(c => ({ label: c.company_name, value: c.id }))}
            onSelect={setClientId}
            required
          />
        </View>

        <View style={styles.formSection}>
          <Text style={[Typography.captionMedium, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>Abrechnung</Text>
          <Input label="Stundensatz (€)" placeholder="95" value={hourlyRate} onChangeText={setHourlyRate} keyboardType="decimal-pad" required />
          <Input label="Grundgebühr (€)" placeholder="Optional, z.B. 500" value={baseFee} onChangeText={setBaseFee} keyboardType="decimal-pad" />
        </View>

        <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
          <Button 
            title={editingProjectId ? "Änderungen speichern" : "Projekt anlegen"} 
            onPress={handleSave} 
            variant="primary" 
            fullWidth 
          />
          {!!editingProjectId && (
            <Button 
              title="Projekt löschen" 
              onPress={handleDelete} 
              variant="danger" 
              fullWidth 
            />
          )}
        </View>
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.base },
  header: { marginBottom: Spacing.xl },
  listContainer: { gap: Spacing.md },
  card: { padding: 0, overflow: 'hidden' },
  accent: { height: 3, width: '100%' },
  cardBody: { padding: Spacing.base },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, marginRight: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statsRow: { flexDirection: 'row', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, height: 28 },
  progressWrap: { marginTop: Spacing.md },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  fabContainer: { position: 'absolute', alignSelf: 'center', zIndex: 10 },
  fab: { width: 200 },
  formSection: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});

