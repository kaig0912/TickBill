import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LogIn } from 'iconoir-react-native';

import { useTheme } from '@/hooks/useTheme';
import { Typography, FontFamily } from '@/constants/Typography';
import { Spacing, Layout as LayoutConstants, BorderRadius } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore } from '@/stores/settingsStore';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setOnboarded = useSettingsStore(s => s.setOnboarded);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      const msg = 'Bitte gib E-Mail und Passwort ein.';
      Platform.OS !== 'web' ? Alert.alert('Fehler', msg) : window.alert(msg);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let errorMsg = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMsg = 'E-Mail oder Passwort ist falsch.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMsg = 'Bitte bestätige zuerst deine E-Mail-Adresse.';
        }
        Platform.OS !== 'web' ? Alert.alert('Login fehlgeschlagen', errorMsg) : window.alert(errorMsg);
      } else if (data.session) {
        setOnboarded(true);
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error(err);
      const msg = 'Ein unerwarteter Fehler ist aufgetreten.';
      Platform.OS !== 'web' ? Alert.alert('Fehler', msg) : window.alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Text style={[Typography.bodySemibold, { color: theme.textSecondary }]}>Zurück</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', width: '100%' }}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
              <LogIn color={theme.primary} width={48} height={48} strokeWidth={1.5} />
            </View>
            <Text style={[Typography.h1, { color: theme.text, textAlign: 'center', marginBottom: Spacing.sm }]}>
              Willkommen zurück
            </Text>
            <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center', marginBottom: Spacing['2xl'] }]}>
              Melde dich an, um auf deine Daten zuzugreifen.
            </Text>

            <View style={{ width: '100%', gap: Spacing.md }}>
              <Input
                label="E-Mail Adresse"
                placeholder="max@beispiel.at"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                required
              />
              <Input
                label="Passwort"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
                required
              />
            </View>

            {/* Passwort vergessen */}
            <TouchableOpacity
              onPress={() => router.push('/reset-password')}
              style={styles.forgotButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[Typography.caption, { color: theme.primary, fontFamily: FontFamily.semibold }]}>
                Passwort vergessen?
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Button
            title={loading ? "Wird angemeldet..." : "Einloggen"}
            onPress={handleLogin}
            variant="primary"
            fullWidth
            style={{ paddingVertical: 16 }}
            disabled={loading}
          />
          <TouchableOpacity
            onPress={() => {
              router.back();
              // The onboarding screen will show — user can tap "Registrieren"
            }}
            style={{ alignItems: 'center', marginTop: Spacing.lg }}
          >
            <Text style={[Typography.body, { color: theme.textSecondary }]}>
              Noch kein Konto?{' '}
              <Text style={{ color: theme.primary, fontFamily: FontFamily.semibold }}>
                Registrieren
              </Text>
            </Text>
          </TouchableOpacity>
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
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
});
