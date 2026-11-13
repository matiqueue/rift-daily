import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';

import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { SecurityGateOverlay } from '@/components/SecurityGateOverlay';
import { useAppTheme } from '@/hooks/useAppTheme';
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

  useEffect(() => {
    hydrate().finally(() => {
      SplashScreen.hideAsync().catch(() => {});
      setTimeout(() => setBootFinished(true), 650);
    });
  }, [hydrate]);

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
