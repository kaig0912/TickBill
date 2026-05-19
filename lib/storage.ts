/**
 * TickBill — Safe Storage
 * Uses AsyncStorage on native platforms (iOS/Android) and localStorage on web
 * Ensures SSR safety and local persistence.
 */

import { StateStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SSR-safe storage for zustand persist.
 * Automatically chooses AsyncStorage (Native) or localStorage (Web).
 */
export const safeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      try {
        return window.localStorage.getItem(name);
      } catch {
        return null;
      }
    } else {
      try {
        return await AsyncStorage.getItem(name);
      } catch {
        return null;
      }
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(name, value);
      } catch {
        // Storage full or blocked
      }
    } else {
      try {
        await AsyncStorage.setItem(name, value);
      } catch {
        // Ignore
      }
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.removeItem(name);
      } catch {
        // Ignore
      }
    } else {
      try {
        await AsyncStorage.removeItem(name);
      } catch {
        // Ignore
      }
    }
  },
};
