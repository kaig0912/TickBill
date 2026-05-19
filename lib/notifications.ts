/**
 * TickBill — Notification Manager
 * Handles persistent timer notifications via @notifee/react-native
 * Note: No store imports here to avoid circular dependencies!
 */
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

const CHANNEL_ID = 'timer_channel';
const NOTIFICATION_ID = 'timer_active';

export async function setupTimerChannel() {
  await notifee.requestPermission();
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Timer Benachrichtigungen',
    importance: AndroidImportance.HIGH,
  });
}

export async function displayTimerNotification(
  projectName: string,
  isPaused: boolean,
) {
  try {
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: '<font color="#000000"><b>TickBill</b></font>',
      body: `<font color="#000000">${isPaused ? 'Pausiert – ' : ''}${projectName}</font>`,
      android: {
        channelId: CHANNEL_ID,
        asForegroundService: true,
        color: isPaused ? '#FFC107' : '#00FBB0', // Lighter Amber/Yellow forces Android to use black text
        colorized: true,
        ongoing: true,
        smallIcon: 'ic_launcher',
        actions: [
          {
            title: `<font color="#000000">${isPaused ? 'Fortsetzen' : 'Pausieren'}</font>`,
            pressAction: { id: isPaused ? 'resume' : 'pause' },
          },
          {
            title: '<font color="#000000">Stoppen</font>',
            pressAction: { id: 'stop' },
          },
        ],
      },
    });
  } catch (error) {
    console.warn('[Notifications] displayTimerNotification failed:', error);
  }
}

export async function removeTimerNotification() {
  try {
    await notifee.stopForegroundService();
    await notifee.cancelNotification(NOTIFICATION_ID);
  } catch (error) {
    console.warn('[Notifications] removeTimerNotification failed:', error);
  }
}

/**
 * Register background + foreground handlers.
 * Pass in the action callbacks to avoid circular imports.
 */
export function registerNotificationHandlers(callbacks: {
  onPause: () => void;
  onResume: () => void;
  onStop: () => Promise<void>;
}) {
  // Background handler (app killed / in background)
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction) {
      const id = detail.pressAction.id;
      if (id === 'pause') callbacks.onPause();
      else if (id === 'resume') callbacks.onResume();
      else if (id === 'stop') await callbacks.onStop();
    }
  });

  // Foreground handler (app open)
  const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction) {
      const id = detail.pressAction.id;
      if (id === 'pause') callbacks.onPause();
      else if (id === 'resume') callbacks.onResume();
      else if (id === 'stop') callbacks.onStop();
    }
  });

  return unsubscribe;
}
