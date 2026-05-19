/**
 * TickBill — Papierkorb (Trash)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Trash, RefreshDouble, Building, Folder, Timer, CheckCircle } from 'iconoir-react-native';
import { supabase } from '@/lib/supabase';
import { useClientStore } from '@/stores/clientStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTimeEntryStore } from '@/stores/timeEntryStore';
import { useInvoiceStore } from '@/stores/invoiceStore';

export default function TrashScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [archivedClients, setArchivedClients] = useState<any[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<any[]>([]);
  const [archivedEntries, setArchivedEntries] = useState<any[]>([]);
  const [archivedInvoices, setArchivedInvoices] = useState<any[]>([]);
  
  type TabType = 'clients' | 'projects' | 'entries' | 'invoices';
  const [activeTab, setActiveTab] = useState<TabType>('clients');

  // Trigger reloading stores on restore
  const loadClients = useClientStore(s => s.loadClients);
  const loadProjects = useProjectStore(s => s.loadProjects);
  const loadEntries = useTimeEntryStore(s => s.loadEntries);
  const loadInvoices = useInvoiceStore(s => s.loadInvoices);

  const fetchTrash = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const [clientsRes, projectsRes, entriesRes, invoicesRes] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', session.user.id).eq('is_archived', true),
      supabase.from('projects').select('*').eq('user_id', session.user.id).eq('is_archived', true),
      supabase.from('time_entries').select('*').eq('user_id', session.user.id).eq('is_archived', true),
      supabase.from('invoices').select('*').eq('user_id', session.user.id).eq('is_archived', true),
    ]);

    if (clientsRes.data) setArchivedClients(clientsRes.data);
    if (projectsRes.data) setArchivedProjects(projectsRes.data);
    if (entriesRes.data) setArchivedEntries(entriesRes.data);
    if (invoicesRes.data) setArchivedInvoices(invoicesRes.data);

    setLoading(false);
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (table: string, id: string, name: string) => {
    await supabase.from(table).update({ is_archived: false, archived_at: null }).eq('id', id);
    Alert.alert('Wiederhergestellt', `${name} wurde wiederhergestellt.`);
    
    // Reload local stores depending on type
    if (table === 'clients') await loadClients();
    if (table === 'projects') await loadProjects();
    if (table === 'time_entries') await loadEntries();
    if (table === 'invoices') await loadInvoices();

    fetchTrash();
  };

  const handleHardDelete = async (table: string, id: string, name: string) => {
    Alert.alert(
      'Unwiderruflich löschen',
      `Möchtest du "${name}" endgültig löschen? Dies kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            await supabase.from(table).delete().eq('id', id);
            fetchTrash();
          }
        }
      ]
    );
  };

  const renderItem = (table: string, id: string, name: string, subtitle: string, icon: any, archivedAt: string) => {
    // Calculate days left
    let daysLeft = 10;
    if (archivedAt) {
      const archivedDate = new Date(archivedAt);
      const diffTime = Math.abs(new Date().getTime() - archivedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysLeft = Math.max(0, 10 - diffDays);
    }

    return (
      <View key={id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
            {icon}
          </View>
          <View style={styles.cardInfo}>
            <Text style={[Typography.bodySemibold, { color: theme.text }]} numberOfLines={1}>{name}</Text>
            <Text style={[Typography.caption, { color: theme.textSecondary }]}>{subtitle}</Text>
            <Text style={[Typography.small, { color: theme.warning, marginTop: 4 }]}>Wird in {daysLeft} Tagen gelöscht</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: theme.primarySoft }]} 
            onPress={() => handleRestore(table, id, name)}
          >
            <RefreshDouble color={theme.primary} width={18} height={18} />
            <Text style={[Typography.button, { color: theme.primary, marginLeft: 4 }]}>Wiederherstellen</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: theme.dangerSoft }]} 
            onPress={() => handleHardDelete(table, id, name)}
          >
            <Trash color={theme.danger} width={18} height={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <Stack.Screen 
        options={{
          title: 'Papierkorb',
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }} 
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Tabs */}
        <View style={{ marginHorizontal: -Spacing.lg, marginBottom: Spacing.sm }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}
          >
            {[
              { key: 'clients', label: 'Kunden', count: archivedClients.length },
              { key: 'projects', label: 'Projekte', count: archivedProjects.length },
              { key: 'entries', label: 'Arbeitszeiten', count: archivedEntries.length },
              { key: 'invoices', label: 'Rechnungen', count: archivedInvoices.length }
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as TabType)}
                style={[
                  styles.tabBtn,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  activeTab === tab.key && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
              >
                <Text style={[
                  Typography.button,
                  { color: activeTab === tab.key ? '#FFF' : theme.textSecondary }
                ]}>
                  {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={[Typography.small, { color: theme.textSecondary, marginBottom: Spacing.xl }]}>
          Gelöschte Elemente werden nach 10 Tagen automatisch endgültig gelöscht.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <>

            {/* List */}
            {activeTab === 'clients' && (
              archivedClients.length > 0 ? (
                <View style={styles.section}>
                  {archivedClients.map(c => renderItem('clients', c.id, c.company_name, c.contact_person || 'Ohne Kontakt', <Building color={theme.primary} width={20} height={20} />, c.archived_at))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Trash color={theme.border} width={48} height={48} strokeWidth={1} />
                  <Text style={[Typography.h3, { color: theme.textSecondary, marginTop: Spacing.md }]}>Papierkorb ist leer</Text>
                </View>
              )
            )}

            {activeTab === 'projects' && (
              archivedProjects.length > 0 ? (
                <View style={styles.section}>
                  {archivedProjects.map(p => renderItem('projects', p.id, p.name, `${p.hourly_rate} € / Std`, <Folder color={theme.primary} width={20} height={20} />, p.archived_at))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Trash color={theme.border} width={48} height={48} strokeWidth={1} />
                  <Text style={[Typography.h3, { color: theme.textSecondary, marginTop: Spacing.md }]}>Papierkorb ist leer</Text>
                </View>
              )
            )}

            {activeTab === 'entries' && (
              archivedEntries.length > 0 ? (
                <View style={styles.section}>
                  {archivedEntries.map(e => renderItem('time_entries', e.id, e.description || 'Ohne Beschreibung', `${Math.round(e.duration_seconds/60)} Min.`, <Timer color={theme.primary} width={20} height={20} />, e.archived_at))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Trash color={theme.border} width={48} height={48} strokeWidth={1} />
                  <Text style={[Typography.h3, { color: theme.textSecondary, marginTop: Spacing.md }]}>Papierkorb ist leer</Text>
                </View>
              )
            )}

            {activeTab === 'invoices' && (
              archivedInvoices.length > 0 ? (
                <View style={styles.section}>
                  {archivedInvoices.map(i => renderItem('invoices', i.id, `Rechnung ${i.invoice_number}`, `${i.total_amount || i.total} €`, <CheckCircle color={theme.primary} width={20} height={20} />, i.archived_at))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Trash color={theme.border} width={48} height={48} strokeWidth={1} />
                  <Text style={[Typography.h3, { color: theme.textSecondary, marginTop: Spacing.md }]}>Papierkorb ist leer</Text>
                </View>
              )
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  section: { marginBottom: Spacing.xl },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  }
});
