import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Mail, Check } from 'iconoir-react-native';

import { useTheme } from '@/hooks/useTheme';
import { Typography, FontFamily } from '@/constants/Typography';
import { Spacing, Layout as LayoutConstants } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      const msg = 'Bitte gib deine E-Mail-Adresse ein.';
      Platform.OS !== 'web' ? Alert.alert('Fehler', msg) : window.alert(msg);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'tickbill://reset-callback',
      });

      if (error) {
        const msg = error.message;
        Platform.OS !== 'web' ? Alert.alert('Fehler', msg) : window.alert(msg);
      } else {
        setSent(true);
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
          {sent ? (
            <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', width: '100%' }}>
              <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
                <Check color="#059669" width={48} height={48} strokeWidth={2} />
              </View>
              <Text style={[Typography.h1, { color: theme.text, textAlign: 'center', marginBottom: Spacing.sm }]}>
                E-Mail gesendet!
              </Text>
              <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center', lineHeight: 24 }]}>
                Falls ein Konto mit {email} existiert, erhältst du in Kürze eine E-Mail mit einem Link zum Zurücksetzen deines Passworts.
              </Text>
              <Text style={[Typography.caption, { color: theme.textTertiary, textAlign: 'center', marginTop: Spacing.lg }]}>
                Prüfe auch deinen Spam-Ordner.
              </Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', width: '100%' }}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
                <Mail color={theme.primary} width={48} height={48} strokeWidth={1.5} />
              </View>
              <Text style={[Typography.h1, { color: theme.text, textAlign: 'center', marginBottom: Spacing.sm }]}>
                Passwort vergessen?
              </Text>
              <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center', marginBottom: Spacing['2xl'], lineHeight: 24 }]}>
                Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
              </Text>

              <View style={{ width: '100%' }}>
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
              </View>
            </Animated.View>
          )}
        </View>

        <View style={styles.footer}>
          {sent ? (
            <Button
              title="Zurück zum Login"
              onPress={() => router.back()}
              variant="primary"
              fullWidth
              style={{ paddingVertical: 16 }}
            />
          ) : (
            <Button
              title={loading ? "Wird gesendet..." : "Link senden"}
              onPress={handleReset}
              variant="primary"
              fullWidth
              style={{ paddingVertical: 16 }}
              disabled={loading}
            />
          )}
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
});
