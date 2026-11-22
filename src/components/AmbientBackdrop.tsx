import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface AmbientBackdropProps {
  variant?: 'today' | 'plan' | 'journal' | 'more';
}

/**
 * Pure monochrome silver-chrome atmospheric light sheen.
 * Gives Liquid Glass surfaces luminous depth without introducing color noise.
 */
export function AmbientBackdrop(_props: AmbientBackdropProps) {
  const theme = useAppTheme();

  const topColors: [string, string, string] = theme.isDark
    ? ['rgba(255, 255, 255, 0.07)', 'rgba(255, 255, 255, 0.02)', 'rgba(9, 9, 11, 0)']
    : ['rgba(9, 9, 11, 0.045)', 'rgba(9, 9, 11, 0.012)', 'rgba(250, 250, 250, 0)'];

  const bottomGlow: [string, string] = theme.isDark
    ? ['rgba(9, 9, 11, 0)', 'rgba(255, 255, 255, 0.045)']
    : ['rgba(250, 250, 250, 0)', 'rgba(9, 9, 11, 0.035)'];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={topColors}
        locations={[0, 0.48, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.topMesh}
      />
      <LinearGradient
        colors={bottomGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomMesh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topMesh: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  bottomMesh: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
});
