/**
 * TickBill — Clients Screen (real data from localStorage)
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Platform, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, UserCircle } from 'iconoir-react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius, Layout } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { formatCurrency } from '@/lib/utils';
import { useClientStore, ClientData } from '@/stores/clientStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTimeEntryStore } from '@/stores/timeEntryStore';

export default function ClientsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const clients = useClientStore((s) => s.clients);
  const addClient = useClientStore((s) => s.addClient);
  const updateClient = useClientStore((s) => s.updateClient);
  const archiveClient = useClientStore((s) => s.archiveClient);
  
  const projects = useProjectStore((s) => s.projects);
  const getTotalSecondsByProject = useTimeEntryStore((s) => s.getTotalSecondsByProject);

  const [showForm, setShowForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Österreich');
  const [uidNumber, setUidNumber] = useState('');

  const resetForm = () => {
    setEditingClientId(null);
    setCompanyName(''); 
    setContactPerson(''); 
    setEmail(''); 
    setPhone('');
    setStreet(''); 
    setZip(''); 
    setCity(''); 
    setCountry('Österreich');
    setUidNumber('');
  };

  const openForm = (client?: ClientData) => {
    if (client) {
      setEditingClientId(client.id);
      setCompanyName(client.company_name);
      setContactPerson(client.contact_person || '');
      setEmail(client.email || '');
      setPhone(client.phone);
      setStreet(client.street);
      setZip(client.zip);
      setCity(client.city);
      setCountry(client.country || 'Österreich');
      setUidNumber(client.uid_number);
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!companyName.trim() || !street.trim() || !zip.trim() || !city.trim() || !country.trim()) {
      if (Platform.OS !== 'web') {
        Alert.alert('Fehler', 'Bitte fülle alle Pflichtfelder (Name & vollständige Adresse) aus.');
      } else {
        window.alert('Bitte fülle alle Pflichtfelder (Name & vollständige Adresse) aus.');
      }
      return;
    }

    const clientData = {
      company_name: companyName.trim(),
      contact_person: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      street: street.trim(),
      zip: zip.trim(),
      city: city.trim(),
      country: country.trim(),
      uid_number: uidNumber.trim(),
      firmenbuch_number: '',
      notes: '',
    };

    if (editingClientId) {
      await updateClient(editingClientId, clientData);
    } else {
      await addClient(clientData);
    }
    
    setShowForm(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!editingClientId) return;
    
    const hasProjects = projects.some(p => p.client_id === editingClientId);
    
    const confirmAction = () => {
      archiveClient(editingClientId);
      setShowForm(false);
      resetForm();
    };

    if (hasProjects) {
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Kunde archivieren',
          'Dieser Kunde hat noch aktive Projekte. Wenn du ihn archivierst, werden auch alle seine Projekte archiviert. Fortfahren?',
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Archivieren', style: 'destructive', onPress: confirmAction }
          ]
        );
      } else {
        if (window.confirm('Dieser Kunde hat noch Projekte. Kunde und Projekte in den Papierkorb verschieben?')) {
          confirmAction();
        }
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Kunde löschen',
        'Bist du sicher, dass du diesen Kunden löschen (archivieren) möchtest?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Löschen', style: 'destructive', onPress: confirmAction }
        ]
      );
    } else {
      if (window.confirm('Kunde in den Papierkorb verschieben?')) {
        confirmAction();
      }
    }
  };

  const handleLongPressDelete = (client: any) => {
    const hasProjects = projects.some(p => p.client_id === client.id);
    const confirmAction = () => {
      archiveClient(client.id);
    };

    if (hasProjects) {
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Kunde archivieren',
          'Dieser Kunde hat noch aktive Projekte. Wenn du ihn in den Papierkorb verschiebst, werden auch alle seine Projekte verschoben. Fortfahren?',
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'In Papierkorb', style: 'destructive', onPress: confirmAction }
          ]
        );
      } else {
        if (window.confirm('Dieser Kunde hat noch Projekte. Kunde und Projekte in den Papierkorb verschieben?')) confirmAction();
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Kunde in Papierkorb',
        `Möchtest du den Kunden "${client.company_name}" in den Papierkorb verschieben?`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Löschen', style: 'destructive', onPress: confirmAction }
        ]
      );
    } else {
      if (window.confirm(`Kunde "${client.company_name}" in den Papierkorb verschieben?`)) confirmAction();
    }
  };

  function getClientRevenue(clientId: string): number {
    const clientProjects = projects.filter((p) => p.client_id === clientId);
    return clientProjects.reduce((sum, p) => {
      const seconds = getTotalSecondsByProject(p.id);
      return sum + (seconds / 3600) * p.hourly_rate;
    }, 0);
  }

  function getClientProjectCount(clientId: string): number {
    return projects.filter((p) => p.client_id === clientId).length;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(100).springify()} style={styles.header}>
          <Text style={[Typography.h1, { color: theme.text }]}>Kunden</Text>
        </Animated.View>

        {clients.length === 0 ? (
          <EmptyState
            icon={<UserCircle color={theme.primary} width={32} height={32} strokeWidth={1.5} />}
            title="Keine Kunden"
            description="Lege deinen ersten Kunden an, um Projekte zuzuordnen und Rechnungen zu schreiben."
            actionTitle="Kunde anlegen"
            onAction={() => openForm()}
          />
        ) : (
          <View style={styles.listContainer}>
            {clients.map((client, index) => {
              const revenue = getClientRevenue(client.id);
              const projectCount = getClientProjectCount(client.id);
              return (
                <Animated.View key={client.id} entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(150 + index * 50).springify()}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => openForm(client)} onLongPress={() => handleLongPressDelete(client)} delayLongPress={400}>
                    <Card style={styles.card}>
                      <View style={styles.cardRow}>
                        <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
                          <Text style={[Typography.h3, { color: theme.primary }]}>
                            {client.company_name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.info}>
                          <Text style={[Typography.bodySemibold, { color: theme.text }]} numberOfLines={1}>
                            {client.company_name}
                          </Text>
                          {client.contact_person ? (
                            <Text style={[Typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                              z.Hd. {client.contact_person}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.revenue}>
                          <Text style={[Typography.numericSmall, { color: theme.success }]}>
                            {formatCurrency(revenue)}
                          </Text>
                          <Text style={[Typography.small, { color: theme.textTertiary }]}>
                            {projectCount} {projectCount === 1 ? 'Projekt' : 'Projekte'}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Address and UID Block */}
                      <View style={[styles.detailsBlock, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
                        <Text style={[Typography.small, { color: theme.textSecondary, marginBottom: 2 }]} numberOfLines={1}>
                          📍 {client.street}, {client.zip} {client.city}, {client.country}
                        </Text>
                        {client.uid_number ? (
                          <Text style={[Typography.small, { color: theme.textSecondary }]} numberOfLines={1}>
                            🏢 UID: {client.uid_number}
                          </Text>
                        ) : null}
                      </View>
                    </Card>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        {clients.length > 0 && <View style={{ height: 100 }} />}
      </ScrollView>

      {/* Floating Action Button */}
      {clients.length > 0 && (
        <Animated.View 
          entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(500).springify()} 
          style={[styles.fabContainer, { bottom: insets.bottom + Layout.tabBarHeight + Spacing.md }]}
        >
          <Button 
            title="Kunde anlegen" 
            onPress={() => openForm()} 
            variant="primary" 
            size="lg" 
            style={styles.fab} 
          />
        </Animated.View>
      )}

      {/* Create/Edit Client Modal */}
      <FormModal 
        visible={showForm} 
        onClose={() => { setShowForm(false); resetForm(); }} 
        title={editingClientId ? "Kunde bearbeiten" : "Neuer Kunde"}
      >
        <Input label="Name / Firmenbezeichnung" placeholder="z.B. TechCorp GmbH" value={companyName} onChangeText={setCompanyName} required />
        <Input label="Kontaktperson (Optional)" placeholder="z.B. Anna Müller" value={contactPerson} onChangeText={setContactPerson} />
        
        <View style={styles.formSection}>
          <Text style={[Typography.captionMedium, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>Rechnungsadresse</Text>
          <Input label="Straße & Hausnummer" placeholder="Musterstraße 1" value={street} onChangeText={setStreet} required />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Input label="PLZ" placeholder="1010" value={zip} onChangeText={setZip} keyboardType="number-pad" required />
            </View>
            <View style={{ flex: 2 }}>
              <Input label="Stadt" placeholder="Wien" value={city} onChangeText={setCity} required />
            </View>
          </View>
          <Input label="Land" placeholder="Österreich" value={country} onChangeText={setCountry} required />
        </View>

        <View style={styles.formSection}>
          <Text style={[Typography.captionMedium, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>Rechtliches & Kontakt</Text>
          <Input label="UID-Nummer (B2B)" placeholder="ATU12345678" value={uidNumber} onChangeText={setUidNumber} />
          <Input label="E-Mail (Optional)" placeholder="rechnung@techcorp.at" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Input label="Telefon (Optional)" placeholder="+43 1 234 5678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
          <Button 
            title={editingClientId ? "Änderungen speichern" : "Kunde anlegen"} 
            onPress={handleSave} 
            variant="primary" 
            fullWidth 
          />
          {!!editingClientId && (
            <Button 
              title="Kunde löschen" 
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  listContainer: { gap: Spacing.md },
  card: { padding: Spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  info: { flex: 1, gap: 2 },
  revenue: { alignItems: 'flex-end', gap: 2 },
  detailsBlock: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  fabContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
  },
  fab: {
    width: 200,
  },
  formSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  }
});
