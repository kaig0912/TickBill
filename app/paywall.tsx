import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { X, Crown, Check, CloudSync, HeadsetHelp, PageFlip } from 'iconoir-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    id: '1',
    title: 'Unbegrenzte Rechnungen',
    description: 'Erstelle so viele Rechnungen wie du willst (Free-Tarif: max. 2 Rechnungen)',
    icon: PageFlip,
  },
  {
    id: '2',
    title: 'Cloud-Sync & Backups',
    description: 'Deine Daten sind sicher in der Cloud gespeichert und gehen nie verloren',
    icon: CloudSync,
  },
  {
    id: '3',
    title: 'Multi-Device Nutzung',
    description: 'Greife von deinem Smartphone, Tablet oder PC auf deine Daten zu',
    icon: Crown,
  },
  {
    id: '4',
    title: 'Premium Support',
    description: 'Bevorzugte Behandlung bei Fragen und Problemen',
    icon: HeadsetHelp,
  },
];

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color={theme.text} width={24} height={24} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
            <Crown color={theme.primary} width={48} height={48} strokeWidth={1.5} />
          </View>
          <Text style={[Typography.h1, { color: theme.text, marginTop: Spacing.xl, textAlign: 'center' }]}>
            TickBill <Text style={{ color: theme.primary }}>Pro</Text>
          </Text>
          <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.xl }]}>
            Schalte alle Funktionen frei und bringe deine Freelance-Abrechnung auf das nächste Level.
          </Text>
        </Animated.View>

        <View style={styles.featuresList}>
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Animated.View 
                key={feature.id} 
                entering={FadeInDown.delay(index * 100 + 300).duration(400).springify()}
                style={styles.featureRow}
              >
                <View style={[styles.featureIconBox, { backgroundColor: theme.primarySoft }]}>
                  <Icon color={theme.primary} width={22} height={22} strokeWidth={1.5} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[Typography.h3, { color: theme.text }]}>{feature.title}</Text>
                  <Text style={[Typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>{feature.description}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInDown.delay(700).duration(400).springify()} style={styles.pricingSection}>
          <View style={[styles.pricingCard, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}>
            <View style={styles.popularBadge}>
              <Text style={[Typography.captionMedium, { color: '#FFF' }]}>Am beliebtesten</Text>
            </View>
            <Text style={[Typography.h3, { color: theme.text }]}>Jahresabo</Text>
            <View style={styles.priceRow}>
              <Text style={[Typography.h1, { color: theme.text, fontSize: 36 }]}>8,99 €</Text>
              <Text style={[Typography.body, { color: theme.textSecondary }]}> / Monat</Text>
            </View>
            <Text style={[Typography.caption, { color: theme.textTertiary, marginTop: Spacing.xs }]}>Jährlich abgerechnet (107,88 €)</Text>
          </View>
        </Animated.View>

      </ScrollView>

      <Animated.View entering={SlideInUp.delay(800).duration(400)} style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <Button 
          title="Jetzt 7 Tage kostenlos testen" 
          onPress={() => {
            alert('Abo-Prozess wird gestartet...');
          }} 
          size="lg" 
          fullWidth 
        />
        <Text style={[Typography.small, { color: theme.textTertiary, textAlign: 'center', marginTop: Spacing.md }]}>
          Jederzeit kündbar. Nach der Testphase 107,88 € pro Jahr.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 0 : Spacing.md,
    height: 50,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  scrollContent: {
    paddingBottom: 120, // space for footer
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  pricingSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing['2xl'],
  },
  pricingCard: {
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#00FAAF', // using static green for badge, or theme.primary but this looks good
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    borderTopWidth: 1,
  },
});
