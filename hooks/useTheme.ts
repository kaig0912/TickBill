/**
 * TickBill — Theme Hook
 * Provides typed access to color tokens based on current color scheme.
 * Respects user preference from settingsStore (system / light / dark).
 */

import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, ThemeColors } from '@/constants/Colors';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Resolves the effective color scheme based on user preference.
 * 'system' → follows device setting, 'light'/'dark' → forced override.
 */
function useResolvedScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);

  if (themeMode === 'light' || themeMode === 'dark') {
    return themeMode;
  }
  // themeMode === 'system'
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function useTheme(): ThemeColors & { colorScheme: 'light' | 'dark'; isDark: boolean } {
  const colorScheme = useResolvedScheme();
  const colors = Colors[colorScheme];

  return {
    ...colors,
    colorScheme,
    isDark: colorScheme === 'dark',
  } as ThemeColors & { colorScheme: 'light' | 'dark'; isDark: boolean };
}

export function useThemeColor(
  colorName: keyof ThemeColors,
): string {
  const colorScheme = useResolvedScheme();
  return Colors[colorScheme][colorName] as string;
}
