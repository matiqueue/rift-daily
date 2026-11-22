import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  rightText?: string;
  rightBadge?: string;
  rightBadgeColor?: string;
  showChevron?: boolean;
  showDivider?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  dense?: boolean;
}

export function ListRow({
  title,
  subtitle,
  left,
  right,
  rightText,
  rightBadge,
  rightBadgeColor,
  showChevron = false,
  showDivider = true,
  destructive = false,
  onPress,
  style,
  dense = false,
}: ListRowProps) {
  const theme = useAppTheme();

  const inner = (
    <View
      style={[
        styles.row,
        dense && styles.rowDense,
        showDivider && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
        style,
      ]}>
      {left ? <View style={styles.leftSlot}>{left}</View> : null}

      <View style={styles.textCol}>
        <Text
          style={[
            styles.title,
            { color: destructive ? theme.danger : theme.text },
          ]}
          numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? (
        <View style={styles.rightSlot}>{right}</View>
      ) : (
        <View style={styles.rightSlot}>
          {rightText ? (
            <Text style={[styles.rightText, { color: theme.textMuted }]} numberOfLines={1}>
              {rightText}
            </Text>
          ) : null}
          {rightBadge ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: rightBadgeColor ? `${rightBadgeColor}1F` : theme.bgSecondary,
                },
              ]}>
              <Text
                style={[
                  styles.badgeText,
                  { color: rightBadgeColor || theme.textSecondary },
                ]}>
                {rightBadge}
              </Text>
            </View>
          ) : null}
          {showChevron ? (
            <Ionicons
              name="chevron-forward"
              size={15}
              color={destructive ? theme.danger : theme.textMuted}
            />
          ) : null}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.selectionAsync().catch(() => {});
          }
          onPress();
        }}
        style={({ pressed }) => [
          pressed && {
            backgroundColor: theme.isDark
              ? 'rgba(255, 255, 255, 0.035)'
              : 'rgba(9, 9, 11, 0.035)',
          },
        ]}>
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    minHeight: 54,
  },
  rowDense: {
    paddingVertical: 11,
    minHeight: 46,
  },
  leftSlot: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  rightText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
  },
});
