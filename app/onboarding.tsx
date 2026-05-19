/**
 * TickBill — Onboarding Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft, Layout } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  Timer,
  Folder,
  PageFlip,
  Settings,
  User,
  Building,
  Mail,
} from 'iconoir-react-native';

import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Spacing, Layout as LayoutConstants } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore, UserProfile } from '@/stores/settingsStore';
import { ScrollView } from 'react-native-gesture-handler';
import { WelcomeIllustration } from '@/components/ui/WelcomeIllustration';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

type Step = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  icon?: React.ReactNode;
};

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setOnboarded = useSettingsStore(s => s.setOnboarded);
  const updateProfile = useSettingsStore(s => s.updateProfile);
  const profile = useSettingsStore(s => s.profile);

  const [isWelcome, setIsWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const [companyData, setCompanyData] = useState({
    fullName: profile.fullName || '',
    companyName: profile.companyName || '',
    legalForm: profile.legalForm || '',
    street: profile.street || '',
    zip: profile.zip || '',
    city: profile.city || '',
    country: profile.country || 'Österreich',
  });

  const updateCompanyData = (key: keyof typeof companyData, value: string) => {
    setCompanyData(prev => ({ ...prev, [key]: value }));
  };

  const STEPS: Step[] = [
    {
      id: 'timer',
      title: 'Mühelose Zeiterfassung',
      description: 'Erfasse deine Arbeitszeit mit einem Klick. Weise Zeiten direkt Projekten zu oder trage sie nachträglich manuell ein. Behalte deine heutigen und wöchentlichen Stunden stets im Blick.',
      icon: <Timer color={theme.primary} width={64} height={64} strokeWidth={1} />,
    },
    {
      id: 'projects',
      title: 'Alles perfekt organisiert',
      description: 'Lege Kunden an und ordne ihnen Projekte zu. So weißt du immer genau, für wen du wie lange gearbeitet hast und welche Stunden noch nicht abgerechnet wurden.',
      icon: <Folder color={theme.primary} width={64} height={64} strokeWidth={1} />,
    },
    {
      id: 'invoices',
      title: 'Rechnungen in Sekunden',
      description: 'Wähle offene Zeiten aus und generiere mit einem Klick rechtskonforme Rechnungen als PDF. Ob Reverse Charge oder Kleinunternehmer – TickBill erledigt den Papierkram für dich.',
      icon: <PageFlip color={theme.primary} width={64} height={64} strokeWidth={1} />,
    },
    {
      id: 'settings',
      title: 'Deine Freelance-Zentrale',
      description: 'Hinterlege einmalig deine Firmendaten, Bankverbindung und Steuerdetails. Ab dann läuft die Rechnungsstellung komplett automatisch.',
      icon: <Settings color={theme.primary} width={64} height={64} strokeWidth={1} />,
    },
    {
      id: 'company',
      title: 'Deine Firmendaten',
      description: 'Bitte gib deine rechtlichen Firmendaten ein. Diese werden für rechtskonforme Rechnungen zwingend benötigt.',
      icon: <Building color={theme.primary} width={48} height={48} strokeWidth={1} />,
    },
    {
      id: 'register',
      title: 'Lass uns starten',
      description: 'Erstelle deinen Account, um deine Daten sicher in der Cloud zu speichern und von überall Rechnungen zu schreiben.',
      icon: <User color={theme.primary} width={64} height={64} strokeWidth={1} />,
    },
  ];

  const handleNext = async () => {
    const step = STEPS[currentStep];

    if (step.id === 'company') {
      if (!companyData.fullName || !companyData.street || !companyData.zip || !companyData.city || !companyData.country) {
        alert('Bitte fülle alle Pflichtfelder (*) aus.');
        return;
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      // Finish onboarding & Register
      if (!email || !password || !confirmPassword) {
        alert('Bitte fülle alle Felder aus.');
        return;
      }
      if (password !== confirmPassword) {
        alert('Die Passwörter stimmen nicht überein.');
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          alert(`Registrierung fehlgeschlagen: ${error.message}`);
          setLoading(false);
          return;
        }

        // Show OTP step
        setLoading(false);
        setOtpStep(true);
      } catch (err) {
        console.error(err);
        alert('Ein Fehler ist aufgetreten.');
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      alert('Bitte den Bestätigungscode vollständig eingeben.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });

      if (error) {
        alert(`Falscher Code: ${error.message}`);
        setLoading(false);
        return;
      }

      // Update local store with collected data
      updateProfile({
        ...companyData,
        email, // save email to profile
      });
      
      setOnboarded(true);
      router.replace('/(tabs)');
    } catch (err) {
      console.error(err);
      alert('Ein Fehler ist aufgetreten.');
      setLoading(false);
    }
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentStep ? theme.primary : theme.border },
              index === currentStep && styles.dotActive
            ]}
          />
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (otpStep) {
      return (
        <Animated.View 
          key="otp"
          entering={SlideInRight.duration(400)}
          exiting={SlideOutLeft.duration(400)}
          style={styles.stepContainer}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
            <Mail color={theme.primary} width={64} height={64} strokeWidth={1} />
          </View>
          <Text style={[Typography.h1, { color: theme.text, textAlign: 'center', marginBottom: Spacing.sm }]}>
            Post ist da!
          </Text>
          <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center', marginBottom: Spacing['2xl'] }]}>
            Gib diesen Code einfach in der TickBill App ein.
          </Text>

          <View style={{ width: '100%' }}>
            <Input
              label="Bestätigungscode"
              placeholder="12345678"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={8}
              style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
            />
          </View>
        </Animated.View>
      );
    }

    const step = STEPS[currentStep];

    if (step.id === 'company') {
      return (
        <Animated.View 
          key={step.id}
          entering={SlideInRight.duration(400)}
          exiting={SlideOutLeft.duration(400)}
          style={[styles.stepContainer, { flex: 1, justifyContent: 'flex-start' }]}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
            <View style={[styles.iconContainerSmall, { backgroundColor: theme.primarySoft }]}>
              {step.icon}
            </View>
            <Text style={[Typography.h2, { color: theme.text, textAlign: 'center', marginBottom: Spacing.sm }]}>
              {step.title}
            </Text>
            <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }]}>
              {step.description}
            </Text>

            <View style={{ width: '100%', gap: Spacing.md }}>
              <Input label="Vollständiger Name / Firmenname" value={companyData.fullName} onChangeText={(v) => updateCompanyData('fullName', v)} required />
              <Input label="Zusatz Firmenname (optional)" value={companyData.companyName} onChangeText={(v) => updateCompanyData('companyName', v)} />
              <Input label="Rechtsform (z.B. e.U., GmbH)" value={companyData.legalForm} onChangeText={(v) => updateCompanyData('legalForm', v)} />
              <Input label="Straße & Hausnummer" value={companyData.street} onChangeText={(v) => updateCompanyData('street', v)} required />
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Input label="PLZ" value={companyData.zip} onChangeText={(v) => updateCompanyData('zip', v)} required />
                </View>
                <View style={{ flex: 2 }}>
                  <Input label="Ort" value={companyData.city} onChangeText={(v) => updateCompanyData('city', v)} required />
                </View>
              </View>
              <Input label="Land" value={companyData.country} onChangeText={(v) => updateCompanyData('country', v)} required />
            </View>
          </ScrollView>
        </Animated.View>
      );
    }

    if (step.id === 'register') {
      return (
        <Animated.View 
          key={step.id}
          entering={SlideInRight.duration(400)}
          exiting={SlideOutLeft.duration(400)}
          style={styles.stepContainer}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
            {step.icon}
          </View>
          <Text style={[Typography.h1, { color: theme.text, textAlign: 'center', marginBottom: Spacing.sm }]}>
            {step.title}
          </Text>
          <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center', marginBottom: Spacing['2xl'] }]}>
            {step.description}
          </Text>

          <View style={{ width: '100%', gap: Spacing.md }}>
            <Input
              label="E-Mail Adresse"
              placeholder="max@beispiel.at"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Passwort"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Input
              label="Passwort bestätigen"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View 
        key={step.id}
        entering={SlideInRight.duration(400)}
        exiting={SlideOutLeft.duration(400)}
        style={styles.stepContainer}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
          {step.icon}
        </View>
        <Text style={[Typography.h1, { color: theme.text, textAlign: 'center', marginBottom: Spacing.md }]}>
          {step.title}
        </Text>
        <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center', lineHeight: 24 }]}>
          {step.description}
        </Text>
      </Animated.View>
    );
  };

  if (isWelcome) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(800)} style={{ alignItems: 'center' }}>
            <View style={styles.welcomeVisualPlaceholder}>
              <WelcomeIllustration width={240} height={240} />
            </View>
            <Text style={[Typography.h1, { color: theme.primary, fontSize: 48, marginTop: Spacing.sm }]}>TickBill</Text>
            <Text style={[Typography.h3, { color: theme.text, textAlign: 'center', marginTop: Spacing.md }]}>
              Zeiterfassung und Abrechnung in einer App vereint.
            </Text>
          </Animated.View>
        </View>
        <Animated.View entering={FadeIn.duration(800).delay(300)} style={[styles.footer, { paddingBottom: Spacing['3xl'] }]}>
          <View style={{ gap: Spacing.md, width: '100%' }}>
            <Button
              title="Login"
              onPress={() => router.push('/login')}
              variant="primary"
              fullWidth
              style={{ paddingVertical: 16 }}
            />
            <Button
              title="Registrieren"
              onPress={() => setIsWelcome(false)}
              variant="primary"
              fullWidth
              style={{ paddingVertical: 16 }}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          {currentStep > 0 ? (
            <TouchableOpacity onPress={() => {
              if (otpStep) setOtpStep(false);
              else setCurrentStep(c => c - 1);
            }} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
              <Text style={[Typography.bodySemibold, { color: theme.textSecondary }]}>Zurück</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsWelcome(true)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
              <Text style={[Typography.bodySemibold, { color: theme.textSecondary }]}>Abbrechen</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {renderContent()}
        </View>

        <View style={styles.footer}>
          {!otpStep && renderPagination()}
          <Button
            title={otpStep ? (loading ? "Wird verifiziert..." : "Bestätigen") : currentStep === STEPS.length - 1 ? (loading ? "Lädt..." : "Account erstellen & Starten") : "Weiter"}
            onPress={otpStep ? handleVerifyOtp : handleNext}
            variant="primary"
            fullWidth
            style={{ paddingVertical: 16 }}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 60,
    paddingHorizontal: LayoutConstants.screenPadding,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: LayoutConstants.screenPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: LayoutConstants.screenPadding,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeVisualPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconContainerSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
});
