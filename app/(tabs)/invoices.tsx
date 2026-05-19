/**
 * TickBill — Invoices Screen (real data from localStorage)
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Platform, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Journal, Download } from 'iconoir-react-native';
import { generateInvoicePDF } from '@/lib/invoice-pdf';
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
import { formatCurrency, formatDate, formatDurationCompact } from '@/lib/utils';
import { INVOICE_STATUS_LABELS } from '@/constants/config';
import { useInvoiceStore, InvoiceData } from '@/stores/invoiceStore';
import { useClientStore } from '@/stores/clientStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTimeEntryStore } from '@/stores/timeEntryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useRouter } from 'expo-router';

function statusVariant(s: string) {
  switch (s) {
    case 'paid': return 'success' as const;
    case 'sent': return 'info' as const;
    case 'overdue': return 'danger' as const;
    case 'cancelled': return 'primary' as const;
    default: return 'default' as const;
  }
}

function getFilteredStatusOptions(currentStatus: string) {
  if (currentStatus === 'cancelled') {
    return [{ label: 'Storniert (Rechnungskorrektur)', value: 'cancelled' }];
  }
  if (currentStatus === 'draft') {
    return [
      { label: 'Entwurf', value: 'draft' },
      { label: 'Offen (Ausgestellt)', value: 'sent' },
      { label: 'Bezahlt', value: 'paid' },
    ];
  }
  return [
    { label: 'Offen (Ausgestellt)', value: 'sent' },
    { label: 'Bezahlt', value: 'paid' },
    { label: 'Überfällig', value: 'overdue' },
  ];
}

export default function InvoicesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const invoices = useInvoiceStore((s) => s.invoices);
  const addInvoice = useInvoiceStore((s) => s.addInvoice);
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice);
  const cancelInvoice = useInvoiceStore((s) => s.cancelInvoice);
  const archiveInvoice = useInvoiceStore((s) => s.archiveInvoice);
  
  const clients = useClientStore((s) => s.clients);
  const getClient = useClientStore((s) => s.getClient);
  
  const projects = useProjectStore((s) => s.projects);
  const getProject = useProjectStore((s) => s.getProject);
  
  const getUninvoicedByProject = useTimeEntryStore((s) => s.getUninvoicedByProject);
  const updateEntry = useTimeEntryStore((s) => s.updateEntry);

  const profile = useSettingsStore((s) => s.profile);
  const isProfileComplete = useSettingsStore((s) => s.isProfileComplete)();
  const profileWarnings = useSettingsStore((s) => s.getProfileWarnings)();

  const [showForm, setShowForm] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(profile.defaultTaxRate?.toString() || '20');
  const [taxType, setTaxType] = useState<'standard' | 'reverse_charge' | 'export'>('standard');
  const [status, setStatus] = useState('sent');

  const resetForm = () => {
    setEditingInvoiceId(null);
    setSelectedClientId('');
    setSelectedProjectId('');
    setSelectedEntryIds([]);
    setNotes('');
    setTaxRate(profile.isKleinunternehmer ? '0' : (profile.defaultTaxRate?.toString() || '20'));
    setTaxType(profile.isKleinunternehmer ? 'standard' : 'standard');
    setStatus('sent');
    
    // Auto-select logic for new invoices
    if (clients.length === 1) {
      const cid = clients[0].id;
      setSelectedClientId(cid);
      const cProjects = projects.filter((p) => p.client_id === cid);
      if (cProjects.length === 1) setSelectedProjectId(cProjects[0].id);
    } else if (invoices.length > 0) {
      const lastInvoice = [...invoices].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      const cid = lastInvoice?.client_id || '';
      setSelectedClientId(cid);
      const cProjects = projects.filter((p) => p.client_id === cid);
      if (cProjects.length === 1) setSelectedProjectId(cProjects[0].id);
    }
  };

  const openForm = (invoice?: InvoiceData) => {
    // Prevent creating a new invoice if profile data is incomplete
    if (!invoice && !isProfileComplete) {
      const missingList = profileWarnings.join('\n• ');
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Firmendaten unvollständig',
          `Bitte vervollständige deine Einstellungen, damit die Rechnung rechtlich korrekt erstellt werden kann.\n\nFehlend:\n• ${missingList}`,
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Zu den Einstellungen', isPreferred: true, onPress: () => router.push('/settings') }
          ]
        );
      } else {
        if (window.confirm(`Firmendaten unvollständig.\nFehlend:\n• ${missingList}\n\nJetzt zu den Einstellungen wechseln?`)) {
          router.push('/settings');
        }
      }
      return;
    }

    if (invoice) {
      setEditingInvoiceId(invoice.id);
      setSelectedClientId(invoice.client_id);
      setSelectedProjectId(invoice.project_id);
      setSelectedEntryIds(invoice.time_entry_ids || []);
      setNotes(invoice.notes || '');
      setTaxRate(invoice.tax_rate.toString());
      setTaxType(invoice.tax_type as any || 'standard');
      setStatus(invoice.status);
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const editingInvoice = editingInvoiceId ? invoices.find(i => i.id === editingInvoiceId) : null;
  const isLocked = editingInvoice ? editingInvoice.status !== 'draft' : false;
  const isKleinunternehmer = profile.isKleinunternehmer === true;

  const handleSave = async () => {
    if (editingInvoiceId) {
      const invoice = invoices.find(i => i.id === editingInvoiceId);
      if (invoice) {
        if (isLocked) {
          // If locked, we ONLY update the payment status (e.g. from sent -> paid)
          await updateInvoice(editingInvoiceId, {
            status: status as InvoiceData['status'],
          });
        } else {
          // For drafts, we can fully update everything
          const isExempt = taxType === 'reverse_charge' || taxType === 'export' || isKleinunternehmer;
          const rate = isExempt ? 0 : (parseFloat(taxRate) || 20);
          const taxAmount = Math.round(invoice.subtotal * (rate / 100) * 100) / 100;
          const total = Math.round((invoice.subtotal + taxAmount) * 100) / 100;
          
          await updateInvoice(editingInvoiceId, {
            notes: notes.trim(),
            tax_rate: rate,
            tax_amount: taxAmount,
            tax_type: taxType,
            total_amount: total,
            status: status as InvoiceData['status'],
          });
        }
      }
      setShowForm(false);
      resetForm();
      return;
    }

    // Creating new invoice
    if (!selectedClientId || !selectedProjectId) {
      const msg = 'Bitte wähle Kunde und Projekt aus.';
      Platform.OS !== 'web' ? Alert.alert('Fehler', msg) : window.alert(msg);
      return;
    }

    // --- STEP 1: STAMMDATEN-PRÜFUNG ---
    if (!profile.fullName) {
      const msg = 'Stammdaten-Fehler: Name des Rechnungsstellers ist gesetzlich verpflichtend.';
      Platform.OS !== 'web' ? Alert.alert('Rechtsform-Prüfung', msg) : window.alert(msg);
      return;
    }

    const isCorporate = ['gmbh', 'og', 'kg', 'ag', 'gmbh & co. kg'].includes(profile.legalForm?.toLowerCase() || '');
    if (isCorporate) {
      if (!profile.firmenbuchNumber || !profile.firmenbuchGericht) {
        const msg = `Stammdaten-Fehler: Für Kapital- oder Personengesellschaften (${profile.legalForm}) sind Firmenbuchnummer (FN) und Firmenbuchgericht in Österreich gesetzlich verpflichtend.`;
        Platform.OS !== 'web' ? Alert.alert('Rechtsform-Prüfung', msg) : window.alert(msg);
        return;
      }
    }

    // --- STEP 2 & 3: BETRAGS- & KUNDEN-PRÜFUNG ---
    const client = getClient(selectedClientId);
    if (!client) return;

    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;

    const entriesToInvoice = getUninvoicedByProject(selectedProjectId).filter(e => 
      selectedEntryIds.includes(e.id)
    );
    
    if (entriesToInvoice.length === 0) {
      const msg = 'Bitte wähle mindestens eine Leistung zum Abrechnen aus.';
      Platform.OS !== 'web' ? Alert.alert('Fehler', msg) : window.alert(msg);
      return;
    }

    const totalSeconds = entriesToInvoice.reduce((s, e) => s + e.duration_seconds, 0);
    const roundedHours = Math.round((totalSeconds / 3600) * 100) / 100;
    const subtotal = Math.round(roundedHours * project.hourly_rate * 100) / 100;
    const isExempt = taxType === 'reverse_charge' || taxType === 'export' || isKleinunternehmer;
    const rate = isExempt ? 0 : (parseFloat(taxRate) || 20);
    const taxAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    // UStG Betrags-Prüfung in Austria
    if (total > 400) {
      // 1. Full recipient address mandatory
      const hasFullAddress = client.company_name && client.street && client.city && client.zip && client.country;
      if (!hasFullAddress) {
        const msg = 'Kunden-Fehler: Für eine vollständige Rechnung (über 400 € brutto) ist die vollständige Anschrift des Empfängers (Firma, Straße, PLZ, Ort, Land) gesetzlich vorgeschrieben.';
        Platform.OS !== 'web' ? Alert.alert('UStG-Rechnungsprüfung', msg) : window.alert(msg);
        return;
      }

      // 2. Issuer UID number mandatory (unless Kleinunternehmer)
      if (!isKleinunternehmer && !profile.uidNumber) {
        const msg = 'Stammdaten-Fehler: Für eine vollständige Rechnung (über 400 € brutto) ist Ihre UID-Nummer gesetzlich verpflichtend. Bitte tragen Sie diese in den Einstellungen ein.';
        Platform.OS !== 'web' ? Alert.alert('UStG-Rechnungsprüfung', msg) : window.alert(msg);
        return;
      }
    }

    if (total > 10000) {
      // Recipient UID mandatory for invoices > 10.000 €
      if (!client.uid_number) {
        const msg = 'Kunden-Fehler: Für Rechnungen mit einem Bruttobetrag über 10.000 € ist die UID-Nummer des Empfängers gesetzlich zwingend erforderlich.';
        Platform.OS !== 'web' ? Alert.alert('UID-Pflichtprüfung (>10k)', msg) : window.alert(msg);
        return;
      }
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (profile.paymentTermDays || 14));

    const entryDates = entriesToInvoice.map(e => new Date(e.start_time).getTime());
    const minDate = new Date(Math.min(...entryDates)).toISOString().split('T')[0];
    const maxDate = new Date(Math.max(...entryDates)).toISOString().split('T')[0];

    const invoiceId = await addInvoice({
      client_id: selectedClientId,
      project_id: selectedProjectId,
      status: 'sent',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      service_period_start: minDate,
      service_period_end: maxDate,
      subtotal,
      tax_rate: rate,
      tax_amount: taxAmount,
      tax_type: isKleinunternehmer ? 'kleinunternehmer' : taxType,
      total_amount: total,
      notes: notes.trim(),
      items: [{
        id: Date.now().toString(),
        description: `Dienstleistungen für Projekt: ${project.name}`,
        quantity: roundedHours,
        unit: 'h',
        unit_price: project.hourly_rate,
        amount: subtotal,
      }],
      time_entry_ids: selectedEntryIds,
    });

    // CRITICAL: Only mark entries as invoiced if the invoice was actually saved
    if (!invoiceId) {
      const msg = 'Fehler: Rechnung konnte nicht gespeichert werden. Bitte versuche es erneut.';
      Platform.OS !== 'web' ? Alert.alert('Fehler', msg) : window.alert(msg);
      return;
    }

    // Mark entries as invoiced only after successful invoice creation
    for (const e of entriesToInvoice) {
      await updateEntry(e.id, { is_invoiced: true, invoice_id: invoiceId });
    }

    resetForm();
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!editingInvoiceId) return;
    
    const invoice = invoices.find(i => i.id === editingInvoiceId);
    if (!invoice) return;

    if (invoice.status !== 'draft') {
      // Under Austrian BAO: Finalized invoices must be storniert, not deleted!
      const confirmStorno = async () => {
        // 1. Unlink time entries so they become available to invoice again
        if (invoice.time_entry_ids && invoice.time_entry_ids.length > 0) {
          for (const entryId of invoice.time_entry_ids) {
            await updateEntry(entryId, { is_invoiced: false, invoice_id: null });
          }
        }
        
        // 2. Set status to cancelled (revisionssichere Stornierung)
        await cancelInvoice(editingInvoiceId);
        setShowForm(false);
        resetForm();
      };

      if (Platform.OS !== 'web') {
        Alert.alert(
          'Rechnung stornieren (BAO-konform)',
          `Achtung: Die Rechnung #${invoice.invoice_number} ist festgeschrieben. Sie wird hiermit storniert. Die Rechnungsnummer bleibt erhalten (keine Lücke im Kreis) und die erfassten Zeiten werden wieder freigegeben.`,
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Rechnung stornieren', style: 'destructive', onPress: confirmStorno }
          ]
        );
      } else {
        if (window.confirm(`Rechnung #${invoice.invoice_number} stornieren? Die Rechnungsnummer bleibt erhalten (BAO-konform).`)) {
          confirmStorno();
        }
      }
      return;
    }

    // Draft deletion flow: Draft can be hard deleted
    const confirmAction = async () => {
      // 1. Unlink time entries
      if (invoice.time_entry_ids && invoice.time_entry_ids.length > 0) {
        for (const entryId of invoice.time_entry_ids) {
          await updateEntry(entryId, { is_invoiced: false, invoice_id: null });
        }
      }
      
      // 2. Archive the invoice
      await archiveInvoice(editingInvoiceId);
      setShowForm(false);
      resetForm();
    };

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Entwurf löschen',
        `Soll der Entwurf #${invoice.invoice_number} gelöscht werden?`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Entwurf löschen', style: 'destructive', onPress: confirmAction }
        ]
      );
    } else {
      if (window.confirm(`Entwurf #${invoice.invoice_number} löschen?`)) {
        confirmAction();
      }
    }
  };

  const handleLongPressDelete = (invoice: any) => {
    if (invoice.status !== 'draft') {
      const msg = 'Festgeschriebene Rechnungen können nicht gelöscht werden. Bitte öffne die Rechnung, um sie BAO-konform zu stornieren.';
      Platform.OS !== 'web' ? Alert.alert('Hinweis', msg) : window.alert(msg);
      return;
    }

    const confirmAction = async () => {
      // 1. Unlink time entries so they become available to invoice again
      if (invoice.time_entry_ids && invoice.time_entry_ids.length > 0) {
        for (const entryId of invoice.time_entry_ids) {
          await updateEntry(entryId, { is_invoiced: false, invoice_id: null });
        }
      }
      
      // 2. Archive the invoice
      await archiveInvoice(invoice.id);
    };

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Entwurf löschen',
        `Soll der Entwurf #${invoice.invoice_number} gelöscht werden?`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Löschen', style: 'destructive', onPress: confirmAction }
        ]
      );
    } else {
      if (window.confirm(`Entwurf #${invoice.invoice_number} löschen?`)) {
        confirmAction();
      }
    }
  };

  // Compute available uninvoiced hours
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const uninvoicedEntries = selectedProjectId ? getUninvoicedByProject(selectedProjectId) : [];
  const uninvoicedSeconds = uninvoicedEntries.reduce((s, e) => s + e.duration_seconds, 0);
  const uninvoicedHours = Math.round((uninvoicedSeconds / 3600) * 100) / 100;

  const clientProjects = selectedClientId
    ? projects.filter((p) => p.client_id === selectedClientId)
    : [];

  const statusOptions = [
    { label: 'Offen', value: 'open' },
    { label: 'Bezahlt', value: 'paid' },
    { label: 'Überfällig', value: 'overdue' },
    { label: 'Entwurf', value: 'draft' },
    { label: 'Storniert', value: 'cancelled' },
  ];

  const taxTypeOptions = [
    { label: 'Standard (mit MwSt)', value: 'standard' },
    { label: 'Reverse Charge (EU-Ausland)', value: 'reverse_charge' },
    { label: 'Steuerfreie Exportleistung (Drittland)', value: 'export' },
  ];

  const toggleEntrySelection = (id: string) => {
    setSelectedEntryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllEntries = () => {
    setSelectedEntryIds(uninvoicedEntries.map(e => e.id));
  };

  const deselectAllEntries = () => {
    setSelectedEntryIds([]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(100).springify()} style={styles.header}>
          <Text style={[Typography.h1, { color: theme.text }]}>Rechnungen</Text>
        </Animated.View>
        
        {invoices.length === 0 ? (
          <EmptyState
            icon={<Journal color={theme.primary} width={32} height={32} strokeWidth={1.5} />}
            title="Keine Rechnungen"
            description="Erstelle deine erste Rechnung aus erfassten Zeiten."
            actionTitle="Rechnung erstellen"
            onAction={() => openForm()}
          />
        ) : (
          <View style={styles.listContainer}>
            {invoices.map((invoice, index) => {
              const client = getClient(invoice.client_id);
              return (
                <Animated.View key={invoice.id} entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(250 + index * 60).springify()}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => openForm(invoice)} onLongPress={() => handleLongPressDelete(invoice)} delayLongPress={400}>
                    <Card style={styles.card}>
                      <View style={styles.cardTop}>
                        <View style={styles.cardLeft}>
                          <Text style={[Typography.bodySemibold, { color: theme.text }]}>{invoice.invoice_number}</Text>
                          <Text style={[Typography.caption, { color: theme.textSecondary }]}>{client?.company_name || 'Unbekannt'}</Text>
                        </View>
                        <View style={styles.cardRight}>
                        <Text style={[Typography.numeric, { color: theme.text }]}>{formatCurrency(invoice.total_amount ?? invoice.total ?? 0)}</Text>
                          <Badge label={INVOICE_STATUS_LABELS[invoice.status] || invoice.status} variant={statusVariant(invoice.status)} dot />
                        </View>
                      </View>
                      <View style={[styles.cardBottom, { borderTopColor: theme.borderLight }]}>
                        <Text style={[Typography.small, { color: theme.textTertiary }]}>Erstellt: {formatDate(invoice.issue_date)}</Text>
                        <Text style={[Typography.small, { color: theme.textTertiary }]}>Fällig: {formatDate(invoice.due_date)}</Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        {invoices.length > 0 && <View style={{ height: 100 }} />}
      </ScrollView>

      {/* Floating Action Button */}
      {invoices.length > 0 && (
        <Animated.View 
          entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(500).springify()} 
          style={[styles.fabContainer, { bottom: insets.bottom + Layout.tabBarHeight + Spacing.md }]}
        >
          <Button 
            title="Rechnung erstellen" 
            onPress={() => openForm()} 
            variant="primary" 
            size="lg" 
            style={styles.fab} 
          />
        </Animated.View>
      )}

      {/* Create/Edit Invoice Modal */}
      <FormModal visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editingInvoiceId ? "Rechnung bearbeiten" : "Neue Rechnung"}>
        
        {isLocked && (
          <View style={{ backgroundColor: theme.surfaceElevated, borderColor: theme.border, borderWidth: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.md }}>
            <Text style={[Typography.small, { color: theme.textSecondary, fontWeight: 'bold' }]}>🔒 Festgeschriebenes Dokument (BAO-konform)</Text>
            <Text style={[Typography.caption, { color: theme.textTertiary, marginTop: 4 }]}>
              Diese Rechnung ist revisionssicher archiviert. Sie können den Zahlungsstatus ändern oder die Rechnung unten stornieren. Das Finanzdokument selbst ist unveränderlich.
            </Text>
          </View>
        )}

        {editingInvoiceId ? (
          <View style={styles.formSection}>
            <SelectInput
              label="Status"
              value={status}
              options={getFilteredStatusOptions(editingInvoice?.status || 'sent')}
              onSelect={setStatus}
              disabled={editingInvoice?.status === 'cancelled'}
            />
          </View>
        ) : (
          <>
            <View style={styles.formSection}>
              <SelectInput
                label="Kunde"
                placeholder={clients.length === 0 ? "Keine Kunden verfügbar" : "Kunden auswählen..."}
                value={selectedClientId}
                options={clients.map(c => ({ label: c.company_name, value: c.id }))}
                onSelect={(val) => {
                  setSelectedClientId(val);
                  setSelectedProjectId('');
                }}
                required
                disabled={isLocked}
              />
            </View>

            {!!selectedClientId && (
              <View style={styles.formSection}>
                <SelectInput
                  label="Projekt"
                  placeholder={clientProjects.length === 0 ? "Keine Projekte verfügbar" : "Projekt auswählen..."}
                  value={selectedProjectId}
                  options={clientProjects.map(p => ({ label: p.name, value: p.id }))}
                  onSelect={setSelectedProjectId}
                  required
                  disabled={isLocked}
                />
              </View>
            )}

            {/* Entry Selection for partial billing */}
            {!!selectedProjectId && uninvoicedEntries.length > 0 && (
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[Typography.captionMedium, { color: theme.textSecondary }]}>Leistungen wählen</Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <TouchableOpacity onPress={selectAllEntries} disabled={isLocked}>
                      <Text style={[Typography.caption, { color: isLocked ? theme.textTertiary : theme.primary }]}>Alle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deselectAllEntries} disabled={isLocked}>
                      <Text style={[Typography.caption, { color: theme.textTertiary }]}>Keine</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <ScrollView style={styles.entryScroll} showsVerticalScrollIndicator={false}>
                  {uninvoicedEntries.map(entry => {
                    const isSelected = selectedEntryIds.includes(entry.id);
                    return (
                      <TouchableOpacity 
                        key={entry.id} 
                        onPress={() => toggleEntrySelection(entry.id)}
                        disabled={isLocked}
                        style={[
                          styles.entryItem,
                          { borderColor: isSelected ? theme.primary + '40' : theme.borderLight }
                        ]}
                      >
                        <View style={[styles.entryCheck, { backgroundColor: isSelected ? theme.primary : 'transparent', borderColor: isSelected ? theme.primary : theme.textTertiary }]}>
                          {isSelected && <View style={styles.checkInner} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[Typography.small, { color: theme.text }]} numberOfLines={1}>{entry.description || 'Keine Beschreibung'}</Text>
                          <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                            {formatDate(entry.start_time)} · {formatDurationCompact(entry.duration_seconds)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Preview */}
            {!!selectedProjectId && selectedProject && (
              <Card style={{ backgroundColor: theme.primarySoft, marginTop: Spacing.sm }}>
                <Text style={[Typography.captionMedium, { color: theme.primary }]}>
                  Vorschau ({selectedEntryIds.length} Einträge)
                </Text>
                <Text style={[Typography.numericLarge, { color: theme.text, marginTop: 4 }]}>
                  {formatCurrency(Math.round((selectedEntryIds.length > 0 ? (uninvoicedEntries.filter(e => selectedEntryIds.includes(e.id)).reduce((s,e) => s + e.duration_seconds, 0) / 3600) : 0) * selectedProject.hourly_rate * (1 + (taxType !== 'standard' ? 0 : parseFloat(taxRate || '0')) / 100) * 100) / 100)}
                </Text>
                <Text style={[Typography.small, { color: theme.textTertiary }]}>
                  {taxType === 'standard' ? `inkl. ${taxRate}% USt` : '0% USt (Steuerfrei)'}
                </Text>
              </Card>
            )}
          </>
        )}

        <View style={styles.formSection}>
          <SelectInput
            label="Steuerart"
            value={taxType}
            options={isKleinunternehmer ? [
              { label: 'Kleinunternehmerregelung (§ 6 UStG) (0%)', value: 'standard' },
              { label: 'Reverse Charge (EU-Ausland)', value: 'reverse_charge' },
              { label: 'Steuerfreie Exportleistung (Drittland)', value: 'export' },
            ] : [
              { label: 'Standard (mit MwSt)', value: 'standard' },
              { label: 'Reverse Charge (EU-Ausland)', value: 'reverse_charge' },
              { label: 'Steuerfreie Exportleistung (Drittland)', value: 'export' },
            ]}
            onSelect={(val: any) => {
              setTaxType(val);
              if (val !== 'standard') setTaxRate('0');
              else setTaxRate(isKleinunternehmer ? '0' : '20');
            }}
            disabled={isLocked}
          />
          {taxType === 'standard' && !isKleinunternehmer && (
            <View style={{ marginTop: Spacing.sm }}>
              <Input label="Steuersatz (%)" value={taxRate} onChangeText={setTaxRate} keyboardType="decimal-pad" editable={!isLocked} />
            </View>
          )}
          <View style={{ height: Spacing.sm }} />
          <Input label="Anmerkungen" placeholder="Optional" value={notes} onChangeText={setNotes} multiline editable={!isLocked} />
        </View>

        <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
          <Button
            title={editingInvoiceId ? (isLocked ? "Status aktualisieren" : "Änderungen speichern") : "Rechnung erstellen"}
            onPress={handleSave}
            variant="primary"
            fullWidth
            disabled={editingInvoice?.status === 'cancelled' || (!editingInvoiceId && (!selectedClientId || !selectedProjectId || selectedEntryIds.length === 0))}
          />
          {!!editingInvoiceId && (
            <View style={{ gap: Spacing.sm }}>
              {!isProfileComplete && (
                <View style={{ backgroundColor: theme.dangerSoft, padding: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.xs }}>
                  <Text style={[Typography.small, { color: theme.danger, fontWeight: 'bold' }]}>Profil unvollständig!</Text>
                  <Text style={[Typography.caption, { color: theme.danger }]}>
                    {profileWarnings.join(', ')}. Bitte in den Einstellungen ergänzen für rechtskonforme Rechnungen.
                  </Text>
                </View>
              )}
              <Button
                title="PDF herunterladen"
                onPress={() => {
                  const inv = invoices.find(i => i.id === editingInvoiceId);
                  if (inv) generateInvoicePDF(inv, getClient(inv.client_id));
                }}
                variant="secondary"
                fullWidth
                icon={<Download color={theme.primary} width={18} height={18} />}
              />
              {editingInvoice?.status !== 'cancelled' && (
                <Button
                  title={editingInvoice?.status === 'draft' ? 'Entwurf löschen' : 'Rechnung stornieren'}
                  onPress={handleDelete}
                  variant="danger"
                  fullWidth
                />
              )}
            </View>
          )}
        </View>

        {!editingInvoiceId && !!selectedProjectId && uninvoicedEntries.length === 0 && (
          <Text style={[Typography.caption, { color: theme.danger, textAlign: 'center', marginTop: Spacing.sm }]}>
            Keine nicht-abgerechneten Stunden für dieses Projekt vorhanden
          </Text>
        )}
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.base },
  header: { marginBottom: Spacing.xl },
  summaryRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  summaryCard: { flex: 1, padding: Spacing.base },
  listContainer: { gap: Spacing.md },
  card: { padding: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { gap: 2 },
  cardRight: { alignItems: 'flex-end', gap: Spacing.xs },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  fabContainer: { position: 'absolute', alignSelf: 'center', zIndex: 10 },
  fab: { width: 200 },
  formSection: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  entryScroll: { maxHeight: 200, marginTop: Spacing.xs },
  entryItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: Spacing.sm, 
    borderRadius: BorderRadius.md, 
    borderWidth: 1, 
    marginBottom: Spacing.xs,
    gap: Spacing.sm
  },
  entryCheck: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
});
