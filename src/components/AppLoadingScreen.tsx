import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';

interface AppLoadingScreenProps {
  subtitle?: string;
}

export function AppLoadingScreen({
  subtitle = 'Synchronizacja protokołów USOS API...',
}: AppLoadingScreenProps) {
  const theme = useAppTheme();
  const pulse = useSharedValue(1);
  const progress = useSharedValue(0.15);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    progress.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.22, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulse, progress]);

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const barAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(260)}
      style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.centerBox}>
        <Animated.View
          style={[
            styles.iconFrame,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            },
            logoAnimStyle,
          ]}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logoImage}
            contentFit="cover"
          />
        </Animated.View>

        <Text style={[styles.brandOverline, { color: theme.accent }]}>
          RIFT DAILY // E-DZIENNIK USOS
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>Rift Daily</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>

        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.bgSecondary, borderColor: theme.cardBorder },
          ]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.accent },
              barAnimStyle,
            ]}
          />
        </View>

        <View style={styles.spinnerRow}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[styles.statusMono, { color: theme.textMuted }]}>
            OAUTH 1.0A SECURE SESSION
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centerBox: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  iconFrame: {
    width: 92,
    height: 92,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandOverline: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 22,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  statusMono: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
