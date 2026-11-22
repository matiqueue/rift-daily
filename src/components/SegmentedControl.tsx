import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';

interface SegmentedOption<T extends string> {
  label: string;
  value: T;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

const PAD = 3;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useAppTheme();
  const [innerWidth, setInnerWidth] = useState(0);

  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const segWidth = options.length > 0 && innerWidth > 0 ? innerWidth / options.length : 0;

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (segWidth > 0) {
      translateX.set(
        withSpring(activeIndex * segWidth, {
          damping: 24,
          stiffness: 300,
          mass: 0.72,
        })
      );
    }
  }, [activeIndex, segWidth, translateX]);

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setInnerWidth(w - PAD * 2);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(9, 9, 11, 0.055)',
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.10)'
            : 'rgba(9, 9, 11, 0.08)',
        },
      ]}>
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={28}
          tint={theme.isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Smooth Sliding Frosted Pill */}
      {segWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.slider,
            {
              width: segWidth,
              backgroundColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(255, 255, 255, 0.92)',
              borderColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.18)'
                : 'rgba(9, 9, 11, 0.08)',
            },
            sliderStyle,
          ]}
        />
      )}

      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.selectionAsync().catch(() => {});
              }
              onChange(opt.value);
            }}
            style={styles.tab}>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: active ? theme.text : theme.textSecondary,
                  fontWeight: active ? '700' : '500',
                },
              ]}>
              {opt.label}
            </Text>
            {opt.badge !== undefined && (
              <Text
                style={[
                  styles.badgeText,
                  { color: active ? theme.accent : theme.textMuted },
                ]}>
                {opt.badge}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: PAD,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  slider: {
    position: 'absolute',
    left: PAD,
    top: PAD,
    bottom: PAD,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7.5,
    paddingHorizontal: 8,
    gap: 5,
  },
  label: {
    fontSize: 12.5,
    letterSpacing: -0.1,
  },
  badgeText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
  },
});
