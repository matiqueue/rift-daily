import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { SecurityGateOverlay } from '@/components/SecurityGateOverlay';
import { useAppTheme } from '@/hooks/useAppTheme';
import { registerBackgroundSyncAsync } from '@/services/backgroundSync';
import { useUsosStore } from '@/store/useUsosStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const theme = useAppTheme();
  const hydrate = useUsosStore((s) => s.hydrate);
  const isHydrated = useUsosStore((s) => s.isHydrated);
  const isAuthenticated = useUsosStore((s) => s.isAuthenticated);
  const isSyncing = useUsosStore((s) => s.isSyncing);
  const lastSyncedAt = useUsosStore((s) => s.lastSyncedAt);
  const isLocked = useUsosStore((s) => s.isLocked);
  const securityConfigured = useUsosStore((s) => s.securityConfigured);

  const [bootFinished, setBootFinished] = useState(false);
  const appStateRef = useRef<string>(AppState.currentState || 'active');

  useEffect(() => {
    hydrate().finally(() => {
      SplashScreen.hideAsync().catch(() => {});
      setTimeout(() => setBootFinished(true), 650);
    });
  }, [hydrate]);

  // Register native OS background refresh + auto-refresh when returning from background or every 15 min
  useEffect(() => {
    if (!isAuthenticated) return;

    registerBackgroundSyncAsync().catch(() => {});

    const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes
    const maybeSyncIfStale = () => {
      const s = useUsosStore.getState();
      if (!s.isAuthenticated || s.isSyncing) return;
      if (Date.now() - s.lastSyncedTimestamp >= STALE_AFTER_MS) {
        s.syncFromLiveApi().catch(() => {});
      }
    };

    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if ((prev === 'background' || prev === 'inactive') && nextState === 'active') {
        maybeSyncIfStale();
      }
    });

    const intervalId = setInterval(maybeSyncIfStale, 15 * 60 * 1000);
    return () => {
      sub.remove();
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const showInitialLoader =
    !isHydrated || !bootFinished || (isAuthenticated && isSyncing && !lastSyncedAt);

  return (
    <ThemeProvider value={theme.isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {isHydrated && (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bg },
            animation: 'fade_from_bottom',
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="modal/course/[id]"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.72, 1.0],
              sheetInitialDetentIndex: 0,
              sheetGrabberVisible: true,
              sheetCornerRadius: 24,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="modal/module/[slug]"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.72, 1.0],
              sheetInitialDetentIndex: 0,
              sheetGrabberVisible: true,
              sheetCornerRadius: 24,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="modal/api-config"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.72, 1.0],
              sheetInitialDetentIndex: 0,
              sheetGrabberVisible: true,
              sheetCornerRadius: 24,
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      )}

      {showInitialLoader && (
        <AppLoadingScreen
          subtitle={
            isAuthenticated
              ? 'Pobieranie ocen, planu zajęć i rozliczeń...'
              : 'Inicjalizacja Rift Daily // e-Dziennik...'
          }
        />
      )}

      {!showInitialLoader && isAuthenticated && isLocked && (
        <SecurityGateOverlay mode="unlock" />
      )}

      {!showInitialLoader && isAuthenticated && !isLocked && !securityConfigured && (
        <SecurityGateOverlay mode="setup" />
      )}
    </ThemeProvider>
  );
}
