import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface GlassSurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  tintColor?: string;
  glassStyle?: 'regular' | 'clear';
  interactive?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const HAS_LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();

export function GlassSurface({
  children,
  style,
  contentStyle,
  radius = 16,
  tintColor,
  glassStyle = 'regular',
  interactive = false,
  onPress,
  accessibilityLabel,
}: GlassSurfaceProps) {
  const theme = useAppTheme();

  const rimColor = theme.isDark
    ? 'rgba(255, 255, 255, 0.13)'
    : 'rgba(9, 9, 11, 0.09)';

  const neutralGlassTint =
    tintColor ||
    (theme.isDark ? 'rgba(28, 28, 32, 0.52)' : 'rgba(255, 255, 255, 0.72)');

  const specularTop: [string, string] = theme.isDark
    ? ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0)']
    : ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0)'];

  const body = HAS_LIQUID_GLASS ? (
    <GlassView
      glassEffectStyle={glassStyle}
      isInteractive={interactive || Boolean(onPress)}
      tintColor={tintColor}
      colorScheme={theme.isDark ? 'dark' : 'light'}
      style={[styles.glassBase, { borderRadius: radius }, style, contentStyle]}>
      {children}
    </GlassView>
  ) : (
    <View
      style={[
        styles.fallbackOuter,
        {
          borderRadius: radius,
          borderColor: rimColor,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : neutralGlassTint,
        },
        style,
      ]}>
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={theme.isDark ? 44 : 60}
          tint={theme.isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      )}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: neutralGlassTint, borderRadius: radius },
        ]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={specularTop}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.specularStrip,
          { borderTopLeftRadius: radius, borderTopRightRadius: radius },
        ]}
      />
      <View style={contentStyle}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.selectionAsync().catch(() => {});
          }
          onPress();
        }}
        style={({ pressed }) => [pressed && { opacity: 0.78 }]}>
        {body}
      </Pressable>
    );
  }

  return body;
}

const styles = StyleSheet.create({
  glassBase: {
    overflow: 'hidden',
  },
  fallbackOuter: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  specularStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 16,
  },
});
