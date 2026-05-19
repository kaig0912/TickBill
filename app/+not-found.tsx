/**
 * TickBill — Not Found Screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Nicht gefunden' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[Typography.h1, { color: theme.text }]}>404</Text>
        <Text style={[Typography.body, { color: theme.textSecondary, marginTop: Spacing.sm }]}>
          Diese Seite existiert nicht.
        </Text>
        <Link href="/" style={{ marginTop: Spacing.xl }}>
          <Text style={[Typography.bodySemibold, { color: theme.primary }]}>Zurück zum Start</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
});
