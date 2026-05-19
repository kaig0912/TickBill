/**
 * TickBill — Root Layout
 * Loads fonts, sets up providers, handles splash screen
 */

import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';
import { useSettingsStore } from '@/stores/settingsStore';
import { useClientStore } from '@/stores/clientStore';
import { useProjectStore } from '@/stores/projectStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useTimeEntryStore } from '@/stores/timeEntryStore';
import { useTimerStore } from '@/stores/timerStore';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useTimerNotification } from '@/hooks/useTimerNotification';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const systemScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const [session, setSession] = React.useState<Session | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = React.useState(false);

  // Resolve effective color scheme
  const resolvedScheme = themeMode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Activate timer notification hook (safely inside React, uses dynamic import)
  useTimerNotification();

  useEffect(() => {
    // Setup notification channel & register handlers for Android via dynamic import
    if (Platform.OS === 'android') {
      import('@/lib/notifications').then(({ setupTimerChannel, registerNotificationHandlers }) => {
        setupTimerChannel();
        registerNotificationHandlers({
          onPause: () => useTimerStore.getState().pauseTimer(),
          onResume: () => useTimerStore.getState().resumeTimer(),
          onStop: async () => {
            const result = useTimerStore.getState().stopTimer();
            if (result && result.durationSeconds > 0) {
              await useTimeEntryStore.getState().addEntry({
                project_id: result.projectId,
                description: result.description,
                start_time: new Date(result.startTime).toISOString(),
                end_time: new Date(result.endTime).toISOString(),
                duration_seconds: result.durationSeconds,
                is_manual: false,
                is_billable: true,
                is_invoiced: false,
                invoice_id: null,
              });
            }
          },
        });
      }).catch(() => {
        // Notifee not available (Expo Go / web) — ignore
      });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoaded(true);
      if (session) {
        useSettingsStore.getState().loadProfile();
        useClientStore.getState().loadClients();
        useProjectStore.getState().loadProjects();
        useInvoiceStore.getState().loadInvoices();
        useTimeEntryStore.getState().loadEntries();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        useSettingsStore.getState().loadProfile();
        useClientStore.getState().loadClients();
        useProjectStore.getState().loadProjects();
        useInvoiceStore.getState().loadInvoices();
        useTimeEntryStore.getState().loadEntries();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && isAuthLoaded) {
      SplashScreen.hideAsync();
      
      const inAuthGroup = segments[0] === 'onboarding' || segments[0] === 'login' || segments[0] === 'reset-password';
      
      if (!session && !inAuthGroup) {
        // Redirect to onboarding if not logged in
        router.replace('/onboarding');
      } else if (session && inAuthGroup) {
        // Redirect away from onboarding if already logged in
        router.replace('/(tabs)');
      }
    }
  }, [fontsLoaded, isAuthLoaded, session, segments]);

  if (!fontsLoaded) {
    return null;
  }

  // Customize themes with TickBill brand colors
  const tickBillLight = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#00FBB0',
      background: '#F8FAFC',
      card: '#FFFFFF',
      text: '#0F172A',
      border: '#E2E8F0',
    },
  };

  const tickBillDark = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#00FBB0',
      background: '#000000',
      card: '#1C1C1E',
      text: '#F8FAFC',
      border: '#38383A',
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={resolvedScheme === 'dark' ? tickBillDark : tickBillLight}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="login" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
