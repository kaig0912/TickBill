/**
 * useTimerNotification
 * Watches timer state reactively and manages Notifee notifications.
 * This hook is the ONLY place where @notifee is called — safely inside React lifecycle.
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useTimerStore } from '@/stores/timerStore';
import { useProjectStore } from '@/stores/projectStore';

export function useTimerNotification() {
  const isRunning = useTimerStore((s) => s.isRunning);
  const isPaused = useTimerStore((s) => s.isPaused);
  const currentProjectId = useTimerStore((s) => s.currentProjectId);
  const currentDescription = useTimerStore((s) => s.currentDescription);
  const getProject = useProjectStore((s) => s.getProject);

  const prevIsRunning = useRef(isRunning);
  const prevIsPaused = useRef(isPaused);

  useEffect(() => {
    // Only run on Android — iOS would need Live Activities for the real experience
    if (Platform.OS !== 'android') return;

    const notify = async () => {
      try {
        const { displayTimerNotification, removeTimerNotification } = await import('@/lib/notifications');
        
        if (!isRunning) {
          await removeTimerNotification();
        } else {
          const project = currentProjectId ? getProject(currentProjectId) : null;
          const label = project?.name || currentDescription || 'Arbeitszeit';
          await displayTimerNotification(label, isPaused);
        }
      } catch (e) {
        // Notifee not available (e.g. web/Expo Go) — fail silently
        console.warn('[useTimerNotification] Notifee not available:', e);
      }
    };

    notify();
    prevIsRunning.current = isRunning;
    prevIsPaused.current = isPaused;
  }, [isRunning, isPaused, currentProjectId, currentDescription]);
}
