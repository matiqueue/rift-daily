import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  rightText?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
  rightText,
  accentColor,
  style,
}: SectionHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.row, style]}>
      <Text
        style={[styles.title, { color: accentColor || theme.textMuted }]}
        numberOfLines={1}>
        {title}
      </Text>
      {actionLabel && onActionPress ? (
        <Pressable
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.selectionAsync().catch(() => {});
            }
            onActionPress();
          }}
          hitSlop={10}>
          <Text style={[styles.action, { color: theme.accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : rightText ? (
        <Text style={[styles.rightMono, { color: theme.textMuted }]}>{rightText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 22,
    paddingBottom: 10,
  },
  title: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  action: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '600',
  },
  rightMono: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '600',
  },
});
