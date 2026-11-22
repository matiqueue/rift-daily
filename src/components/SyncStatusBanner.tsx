import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';

type PillPhase = 'hidden' | 'syncing' | 'updated' | 'offline';

/**
 * Subtle floating pill at the top of the screen that informs the user
 * when cached data is being refreshed in the background ("Pobieram najnowsze dane...")
 * and confirms once updated ("Zaktualizowano dane").
 */
export function SyncStatusBanner() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<PillPhase>(() => {
    const s = useUsosStore.getState();
    return s.isAuthenticated && s.isSyncing ? 'syncing' : 'hidden';
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let wasSyncing = useUsosStore.getState().isSyncing;

    const unsubscribe = useUsosStore.subscribe((state) => {
      if (!state.isAuthenticated) {
        if (timer) clearTimeout(timer);
        wasSyncing = false;
        setPhase('hidden');
        return;
      }

      if (state.isSyncing) {
        if (timer) clearTimeout(timer);
        wasSyncing = true;
        setPhase('syncing');
        return;
      }

      if (wasSyncing) {
        wasSyncing = false;
        if (timer) clearTimeout(timer);
        if (state.syncError) {
          setPhase('offline');
          timer = setTimeout(() => setPhase('hidden'), 3200);
        } else if (state.lastSyncedAt) {
          setPhase('updated');
          timer = setTimeout(() => setPhase('hidden'), 2400);
        } else {
          setPhase('hidden');
        }
      }
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (phase === 'hidden') return null;

  const isUpdated = phase === 'updated';
  const isOffline = phase === 'offline';

  const label = isUpdated
    ? 'Zaktualizowano dane'
    : isOffline
      ? 'Tryb offline · dane z pamięci'
      : 'Pobieram najnowsze dane...';

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          top: Math.max(insets.top + 6, 14),
        },
      ]}>
      <Animated.View
        entering={FadeInUp.duration(220)}
        exiting={FadeOutUp.duration(240)}
        style={[
          styles.pill,
          {
            backgroundColor: theme.isDark ? 'rgba(18, 18, 22, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: isUpdated
              ? theme.isDark
                ? 'rgba(52, 211, 153, 0.35)'
                : 'rgba(16, 185, 129, 0.35)'
              : theme.cardBorder,
            shadowColor: '#000',
          },
        ]}>
        {phase === 'syncing' ? (
          <ActivityIndicator size="small" color={theme.accent} style={styles.spinner} />
        ) : isUpdated ? (
          <Ionicons name="checkmark-circle" size={14} color={theme.success} />
        ) : (
          <Ionicons name="cloud-offline-outline" size={14} color={theme.warning} />
        )}
        <Text
          style={[
            styles.text,
            {
              color: isUpdated ? theme.success : isOffline ? theme.warning : theme.text,
            },
          ]}
          numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 90,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  spinner: {
    transform: [{ scale: 0.72 }],
    width: 14,
    height: 14,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
