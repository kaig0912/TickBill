/**
 * TickBill — Timer Store (Zustand + localStorage)
 * Manages active timer state with persistence
 * NOTE: No notifee imports here — notifications are handled via React hook (useTimerNotification)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedAt: number | null;
  accumulatedSeconds: number;
  currentProjectId: string | null;
  currentDescription: string;

  startTimer: (projectId: string, description?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => { projectId: string; description: string; startTime: number; endTime: number; durationSeconds: number } | null;
  resetTimer: () => void;
  setProject: (projectId: string) => void;
  setDescription: (description: string) => void;
  getElapsedSeconds: () => number;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedAt: null,
      accumulatedSeconds: 0,
      currentProjectId: null,
      currentDescription: '',

      startTimer: (projectId: string, description = '') => {
        set({
          isRunning: true,
          isPaused: false,
          startTime: Date.now(),
          pausedAt: null,
          accumulatedSeconds: 0,
          currentProjectId: projectId,
          currentDescription: description,
        });
      },

      pauseTimer: () => {
        const state = get();
        if (!state.isRunning || state.isPaused) return;
        const elapsed = Math.floor((Date.now() - (state.startTime || Date.now())) / 1000);
        set({
          isPaused: true,
          pausedAt: Date.now(),
          accumulatedSeconds: state.accumulatedSeconds + elapsed,
          startTime: null,
        });
      },

      resumeTimer: () => {
        const state = get();
        if (!state.isPaused) return;
        set({
          isPaused: false,
          startTime: Date.now(),
          pausedAt: null,
        });
      },

      stopTimer: () => {
        const state = get();
        if (!state.isRunning) return null;

        const now = Date.now();
        let durationSeconds = state.accumulatedSeconds;
        if (!state.isPaused && state.startTime) {
          durationSeconds += Math.floor((now - state.startTime) / 1000);
        }

        const result = {
          projectId: state.currentProjectId!,
          description: state.currentDescription,
          startTime: now - durationSeconds * 1000,
          endTime: now,
          durationSeconds,
        };

        set({
          isRunning: false,
          isPaused: false,
          startTime: null,
          pausedAt: null,
          accumulatedSeconds: 0,
          currentProjectId: null,
          currentDescription: '',
        });

        return result;
      },

      resetTimer: () => {
        set({
          isRunning: false,
          isPaused: false,
          startTime: null,
          pausedAt: null,
          accumulatedSeconds: 0,
          currentProjectId: null,
          currentDescription: '',
        });
      },

      setProject: (projectId: string) => set({ currentProjectId: projectId }),
      setDescription: (description: string) => set({ currentDescription: description }),

      getElapsedSeconds: () => {
        const state = get();
        if (!state.isRunning) return 0;
        if (state.isPaused) return state.accumulatedSeconds;
        if (state.startTime) {
          return state.accumulatedSeconds + Math.floor((Date.now() - state.startTime) / 1000);
        }
        return 0;
      },
    }),
    {
      name: 'tickbill-timer',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        startTime: state.startTime,
        pausedAt: state.pausedAt,
        accumulatedSeconds: state.accumulatedSeconds,
        currentProjectId: state.currentProjectId,
        currentDescription: state.currentDescription,
      }),
    }
  )
);
