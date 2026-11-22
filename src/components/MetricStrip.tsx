import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AnimatedNumberText, HairlineDraw } from '@/components/KineticText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';

export interface MetricItem {
  label: string;
  value: string;
  valueColor?: string;
  onPress?: () => void;
}

interface MetricStripProps {
  items: MetricItem[];
  style?: StyleProp<ViewStyle>;
}

export function MetricStrip({ items, style }: MetricStripProps) {
  const theme = useAppTheme();

  return (
    <View style={style}>
      <HairlineDraw color={theme.separator} delayMs={40} />
      <View style={styles.container}>
        {items.map((item, idx) => {
          const content = (
            <View style={styles.cellInner}>
              <Text style={[styles.label, { color: theme.textMuted }]} numberOfLines={1}>
                {item.label}
              </Text>
              <AnimatedNumberText
                value={item.value}
                durationMs={420 + idx * 55}
                style={[styles.value, { color: item.valueColor || theme.text }]}
              />
            </View>
          );

          return (
            <React.Fragment key={item.label}>
              {idx > 0 && (
                <View style={[styles.divider, { backgroundColor: theme.separator }]} />
              )}
              {item.onPress ? (
                <Pressable
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.selectionAsync().catch(() => {});
                    }
                    item.onPress?.();
                  }}
                  style={({ pressed }) => [styles.cell, pressed && { opacity: 0.65 }]}>
                  {content}
                </Pressable>
              ) : (
                <View style={styles.cell}>{content}</View>
              )}
            </React.Fragment>
          );
        })}
      </View>
      <HairlineDraw color={theme.separator} delayMs={110} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cellInner: {
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: MONO_FONT,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
});
