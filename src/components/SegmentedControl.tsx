import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.isDark ? '#121215' : '#E4E4E7',
          borderColor: theme.cardBorder,
        },
      ]}>
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
            style={[
              styles.tab,
              active && {
                backgroundColor: theme.isDark ? '#27272A' : '#FFFFFF',
                borderColor: theme.isDark ? '#3F3F46' : '#D4D4D8',
                borderWidth: 1,
              },
            ]}>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: active ? theme.text : theme.textSecondary,
                  fontWeight: active ? '700' : '600',
                },
              ]}>
              {opt.label}
            </Text>
            {opt.badge !== undefined && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: active ? theme.primary : theme.primarySoft,
                  },
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    { color: active ? theme.primaryContrast : theme.textSecondary },
                  ]}>
                  {opt.badge}
                </Text>
              </View>
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
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 7,
  },
  badgeText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
});
