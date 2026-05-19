/**
 * TickBill — Settings Screen (Iconoir icons)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Platform, TouchableOpacity, Switch, Linking, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Building,
  Notes,
  Bank,
  MediaImage,
  Hashtag,
  Percentage,
  Calendar,
  Euro,
  ShareAndroid,
  Lock,
  InfoCircle,
  Crown,
  LogOut,
  SunLight,
  HalfMoon,
  Trash,
} from 'iconoir-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius, Layout } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { APP_CONFIG } from '@/constants/config';
import { useSettingsStore, UserProfile, ThemeMode } from '@/stores/settingsStore';
import { FormModal } from '@/components/ui/FormModal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';

function SettingsRow({ icon, label, value, onPress, showArrow = true }: {
  icon: React.ReactNode; label: string; value?: string; onPress?: () => void; showArrow?: boolean;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, { borderBottomColor: theme.borderLight }]} activeOpacity={0.7} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
          {icon}
        </View>
        <Text style={[Typography.body, { color: theme.text }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {!!value && <Text style={[Typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>{value}</Text>}
        {showArrow && <Text style={{ color: theme.textTertiary, fontSize: 16 }}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

type EditFormType = 'company' | 'tax' | 'bank' | 'invoice' | null;

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useSettingsStore(s => s.profile);
  const updateProfile = useSettingsStore(s => s.updateProfile);
  const isProfileComplete = useSettingsStore(s => s.isProfileComplete)();
  const setOnboarded = useSettingsStore(s => s.setOnboarded);
  const themeMode = useSettingsStore(s => s.themeMode);
  const setThemeMode = useSettingsStore(s => s.setThemeMode);

  const [activeForm, setActiveForm] = useState<EditFormType>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [showThemeModal, setShowThemeModal] = useState(false);

  const pickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1, // Start with full quality, compress later
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Resize and compress
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800 } }], // Max width 800px
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (!manipResult.base64) {
          Alert.alert('Fehler', 'Bild konnte nicht verarbeitet werden.');
          return;
        }

        // Get current user ID for the storage path
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          Alert.alert('Fehler', 'Nicht eingeloggt.');
          return;
        }

        // Convert base64 → Uint8Array for Supabase upload
        const base64Str = manipResult.base64;
        const byteChars = atob(base64Str);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteArray[i] = byteChars.charCodeAt(i);
        }

        const storagePath = `${session.user.id}/logo.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(storagePath, byteArray.buffer, {
            contentType: 'image/jpeg',
            upsert: true, // overwrite if logo already exists
          });

        if (uploadError) {
          console.error('Logo upload error:', uploadError.message);
          Alert.alert('Fehler', 'Logo konnte nicht hochgeladen werden: ' + uploadError.message);
          return;
        }

        // Get the public URL (+ cache-buster so updated logos show immediately)
        const { data: urlData } = supabase.storage
          .from('logos')
          .getPublicUrl(storagePath);

        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

        // Save public cloud URL — syncs across all devices & future web app
        await updateProfile({
          logoUri: publicUrl,
          logoBase64: manipResult.base64,
        });

        Alert.alert('✅ Logo gespeichert', 'Dein Logo wurde hochgeladen und ist auf allen Geräten verfügbar.');
      }
    } catch (error) {
      console.error('Error picking logo:', error);
      Alert.alert('Fehler', 'Das Logo konnte nicht geladen werden.');
    }
  };

  const openForm = (formType: EditFormType) => {
    setFormData({ ...profile });
    setActiveForm(formType);
  };

  const saveForm = () => {
    updateProfile(formData);
    setActiveForm(null);
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderFormContent = () => {
    if (activeForm === 'company') {
      return (
        <View style={styles.formSection}>
          <Input label="Vollständiger Name / Firmenname" value={formData.fullName || ''} onChangeText={(v) => updateField('fullName', v)} required />
          <Input label="Zusatz Firmenname (optional)" value={formData.companyName || ''} onChangeText={(v) => updateField('companyName', v)} />
          <Input label="Rechtsform (z.B. e.U., GmbH)" value={formData.legalForm || ''} onChangeText={(v) => updateField('legalForm', v)} />
          <Input label="Straße & Hausnummer" value={formData.street || ''} onChangeText={(v) => updateField('street', v)} required />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Input label="PLZ" value={formData.zip || ''} onChangeText={(v) => updateField('zip', v)} required />
            </View>
            <View style={{ flex: 2 }}>
              <Input label="Ort" value={formData.city || ''} onChangeText={(v) => updateField('city', v)} required />
            </View>
          </View>
          <Input label="Land" value={formData.country || ''} onChangeText={(v) => updateField('country', v)} required />
          <Input label="E-Mail" value={formData.email || ''} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Telefon" value={formData.phone || ''} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" />
        </View>
      );
    }
    if (activeForm === 'tax') {
      return (
        <View style={styles.formSection}>
          <View style={[styles.switchRow, { borderBottomColor: theme.borderLight }]}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodySemibold, { color: theme.text }]}>Kleinunternehmer-Regelung</Text>
              <Text style={[Typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>Aktiviert den Hinweis § 6 Abs. 1 Z 27 UStG auf Rechnungen (0% MwSt).</Text>
            </View>
            <Switch
              value={formData.isKleinunternehmer || false}
              onValueChange={(v) => updateField('isKleinunternehmer', v)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFF"
            />
          </View>
          <Input label="UID-Nummer (Pflicht falls kein Kleinunternehmer)" value={formData.uidNumber || ''} onChangeText={(v) => updateField('uidNumber', v)} placeholder="ATU12345678" />
          <Input label="Steuernummer" value={formData.taxNumber || ''} onChangeText={(v) => updateField('taxNumber', v)} />
          <Input label="Firmenbuchnummer" value={formData.firmenbuchNumber || ''} onChangeText={(v) => updateField('firmenbuchNumber', v)} />
          <Input label="Firmenbuchgericht" value={formData.firmenbuchGericht || ''} onChangeText={(v) => updateField('firmenbuchGericht', v)} />
        </View>
      );
    }
    if (activeForm === 'bank') {
      return (
        <View style={styles.formSection}>
          <Input label="Bankname" value={formData.bankName || ''} onChangeText={(v) => updateField('bankName', v)} />
          <Input label="IBAN" value={formData.iban || ''} onChangeText={(v) => updateField('iban', v)} required />
          <Input label="BIC" value={formData.bic || ''} onChangeText={(v) => updateField('bic', v)} />
        </View>
      );
    }
    if (activeForm === 'invoice') {
      return (
        <View style={styles.formSection}>
          <Input label="Rechnungspräfix" value={formData.invoicePrefix || ''} onChangeText={(v) => updateField('invoicePrefix', v)} />
          <Input label="Standard-Steuersatz (%)" value={formData.defaultTaxRate?.toString() || ''} onChangeText={(v) => updateField('defaultTaxRate', parseFloat(v) || 0)} keyboardType="decimal-pad" />
          <Input label="Zahlungsfrist (Tage)" value={formData.paymentTermDays?.toString() || ''} onChangeText={(v) => updateField('paymentTermDays', parseInt(v) || 0)} keyboardType="number-pad" />
          <Input label="Währung" value={formData.currency || ''} onChangeText={(v) => updateField('currency', v)} />
          <Input label="Zahlungsbedingungen (Text auf Rechnung)" value={formData.paymentTermsText || ''} onChangeText={(v) => updateField('paymentTermsText', v)} multiline />
        </View>
      );
    }
    return null;
  };

  const getFormTitle = () => {
    switch (activeForm) {
      case 'company': return 'Firmendaten bearbeiten';
      case 'tax': return 'Steuerdaten bearbeiten';
      case 'bank': return 'Bankverbindung bearbeiten';
      case 'invoice': return 'Rechnungseinstellungen';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Text style={[Typography.h1, { color: theme.text, flexShrink: 0 }]}>Einstellungen</Text>
              {!isProfileComplete && (
                <TouchableOpacity onPress={() => Alert.alert('Profil unvollständig', 'Bitte vervollständige deine Stammdaten (Name, Adresse, UID/Steuernummer und Bankverbindung), damit deine Rechnungen rechtsgültig sind.')}>
                  <View style={[styles.warningDot, { backgroundColor: theme.warning }]} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Profile section */}
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(50)}>
          <Card style={styles.profileCard} onPress={() => openForm('company')}>
            {profile.logoUri ? (
              <Image source={{ uri: profile.logoUri }} style={styles.avatarLarge} />
            ) : (
              <View style={[styles.avatarLarge, { backgroundColor: theme.primarySoft }]}>
                <Text style={[Typography.h1, { color: theme.primary }]}>{profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?'}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[Typography.h3, { color: theme.text }]}>{profile.fullName || 'Name fehlt'}</Text>
              <Text style={[Typography.caption, { color: theme.textSecondary }]}>{profile.email || 'Email fehlt'}</Text>
              <Text style={[Typography.small, { color: theme.textTertiary }]}>Free Plan</Text>
            </View>
            <Text style={{ color: theme.textTertiary, fontSize: 18 }}>›</Text>
          </Card>
        </Animated.View>

        {/* Company & Tax */}
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(100)} style={styles.section}>
          <Text style={[Typography.label, { color: theme.textSecondary, marginBottom: Spacing.sm, marginLeft: Spacing.xs }]}>STAMMDATEN</Text>
          <Card noPadding>
            <SettingsRow icon={<Building color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Firmendaten" onPress={() => openForm('company')} />
            <SettingsRow icon={<Notes color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Steuerdaten" onPress={() => openForm('tax')} />
            <SettingsRow icon={<Bank color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Bankverbindung" onPress={() => openForm('bank')} />
            <SettingsRow icon={<MediaImage color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Logo" onPress={pickLogo} />
          </Card>
        </Animated.View>

        {/* Invoice */}
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(150)} style={styles.section}>
          <Text style={[Typography.label, { color: theme.textSecondary, marginBottom: Spacing.sm, marginLeft: Spacing.xs }]}>RECHNUNG</Text>
          <Card noPadding>
            <SettingsRow icon={<Euro color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Rechnungseinstellungen" onPress={() => openForm('invoice')} />
          </Card>
        </Animated.View>

        {/* App */}
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(200)} style={styles.section}>
          <Text style={[Typography.label, { color: theme.textSecondary, marginBottom: Spacing.sm, marginLeft: Spacing.xs }]}>APP</Text>
          <Card noPadding>
            <SettingsRow
              icon={theme.isDark
                ? <HalfMoon color={theme.primary} width={18} height={18} strokeWidth={1.5} />
                : <SunLight color={theme.primary} width={18} height={18} strokeWidth={1.5} />
              }
              label="Design"
              onPress={() => setShowThemeModal(true)}
            />
            <SettingsRow icon={<Trash color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Papierkorb" onPress={() => router.push('/trash')} />
            <SettingsRow icon={<ShareAndroid color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Daten exportieren" onPress={() => {}} />
            <SettingsRow icon={<InfoCircle color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Über TickBill" value={APP_CONFIG.version} showArrow={false} />
            <SettingsRow icon={<Notes color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Impressum" onPress={() => Linking.openURL('https://tickbill.app/impressum')} />
            <SettingsRow icon={<Lock color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Datenschutz" onPress={() => Linking.openURL('https://tickbill.app/datenschutz')} />
          </Card>
        </Animated.View>

        {/* Upgrade banner */}
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(250)} style={styles.section}>
          <Card style={[styles.upgradeCard, { backgroundColor: theme.primary }]} onPress={() => router.push('/paywall')}>
            <View style={styles.upgradeRow}>
              <Crown color="#0F172A" width={24} height={24} strokeWidth={1.5} />
              <View style={styles.upgradeText}>
                <Text style={[Typography.h3, { color: '#0F172A' }]}>Upgrade auf Pro</Text>
                <Text style={[Typography.caption, { color: 'rgba(15,23,42,0.65)' }]}>
                  Unbegrenzt Projekte, Kunden & Rechnungen für nur 9€/Monat
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Dev Tools (temporary for building Auth) */}
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(280)} style={styles.section}>
          <Text style={[Typography.label, { color: theme.textSecondary, marginBottom: Spacing.sm, marginLeft: Spacing.xs }]}>DEV TOOLS</Text>
          <Card noPadding>
            <SettingsRow icon={<InfoCircle color={theme.primary} width={18} height={18} strokeWidth={1.5} />} label="Session & Cache löschen" onPress={async () => {
              await supabase.auth.signOut();
              setOnboarded(false);
              router.replace('/onboarding');
            }} />
          </Card>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(300)} style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={async () => {
            await supabase.auth.signOut();
          }}>
            <LogOut color={theme.danger} width={20} height={20} strokeWidth={1.8} />
            <Text style={[Typography.bodySemibold, { color: theme.danger }]}>Abmelden</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Form Modal */}
      <FormModal visible={activeForm !== null} onClose={() => setActiveForm(null)} title={getFormTitle()}>
        {renderFormContent()}
        <View style={{ marginTop: Spacing.lg }}>
          <Button title="Speichern" onPress={saveForm} variant="primary" fullWidth />
        </View>
      </FormModal>

      {/* Theme Selection Modal */}
      <FormModal visible={showThemeModal} onClose={() => setShowThemeModal(false)} title="Design">
        <View style={{ gap: Spacing.xs }}>
          {([{ key: 'system' as ThemeMode, label: 'Systemeinstellung', desc: 'Folgt dem Geräte-Design' },
            { key: 'light' as ThemeMode, label: 'Hell', desc: 'Helles Erscheinungsbild' },
            { key: 'dark' as ThemeMode, label: 'Dunkel', desc: 'Dunkles Erscheinungsbild' },
          ]).map((option) => {
            const isSelected = themeMode === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.themeModalOption,
                  {
                    backgroundColor: isSelected ? theme.primarySoft : 'transparent',
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setThemeMode(option.key);
                  setShowThemeModal(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySemibold, { color: theme.text }]}>{option.label}</Text>
                  <Text style={[Typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>{option.desc}</Text>
                </View>
                <View style={[
                  styles.radio,
                  { borderColor: isSelected ? theme.primary : theme.border },
                ]}>
                  {isSelected && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.base },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.sm },
  warningDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarLarge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, gap: 2 },
  section: { marginTop: Spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 1 },
  upgradeCard: { padding: Spacing.lg },
  upgradeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  upgradeText: { flex: 1, gap: 4 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.base, marginTop: Spacing.sm },
  formSection: { gap: Spacing.sm, marginTop: Spacing.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: Spacing.sm },
  themeModalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 1.5, gap: Spacing.md },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
});
