import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { useUsosStore } from '@/store/useUsosStore';

export const BACKGROUND_SYNC_TASK = 'RIFT_DAILY_BACKGROUND_SYNC';

// Must be defined at top-level module scope before React mounts
if (Platform.OS !== 'web') {
  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      const store = useUsosStore.getState();
      if (!store.isHydrated) {
        await store.hydrate();
      }
      const afterHydrate = useUsosStore.getState();
      if (!afterHydrate.isAuthenticated) {
        return BackgroundTask.BackgroundTaskResult.Success;
      }
      await afterHydrate.syncFromLiveApi();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/**
 * Registers the periodic OS background sync task (iOS BGProcessingTask / Android WorkManager).
 * Runs opportunistically in the background to refresh timetable, grades, exams & fire alerts.
 */
export async function registerBackgroundSyncAsync(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      return;
    }
    const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (!alreadyRegistered) {
      await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15, // minutes
      });
    }
  } catch {
    // Gracefully ignore in simulators or restricted environments
  }
}

export async function unregisterBackgroundSyncAsync(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (registered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    }
  } catch {
    // Ignore
  }
}
