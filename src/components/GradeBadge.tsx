import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';

interface GradeBadgeProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * Refined monochrome tonal grade pill:
 * - 5 / 5.0 / ZAL: high-contrast inverted primary pill (instant visual prominence)
 * - 4.5 / 4.0: soft neutral frosted surface
 * - 3.5 / 3.0: quiet outline pill
 * - 2 / NZAL: restrained semantic danger tint
 */
export function GradeBadge({ symbol, size = 'md' }: GradeBadgeProps) {
  const theme = useAppTheme();
  const normalized = symbol.replace(',', '.').toUpperCase();

  let bg = theme.primarySoft;
  let fg = theme.text;
  let border = theme.separator;

  if (normalized === '5' || normalized === '5.0' || normalized === 'ZAL') {
    bg = theme.primary;
    fg = theme.primaryContrast;
    border = theme.primary;
  } else if (normalized === '4.5' || normalized === '4' || normalized === '4.0') {
    bg = theme.isDark ? 'rgba(255, 255, 255, 0.11)' : 'rgba(9, 9, 11, 0.08)';
    fg = theme.text;
    border = theme.cardBorder;
  } else if (normalized === '3.5' || normalized === '3' || normalized === '3.0') {
    bg = 'transparent';
    fg = theme.textSecondary;
    border = theme.cardBorder;
  } else if (normalized === '2' || normalized === '2.0' || normalized === 'NZAL') {
    bg = theme.dangerSoft;
    fg = theme.danger;
    border = `${theme.danger}45`;
  }

  const dims =
    size === 'lg'
      ? { width: 48, height: 46, borderRadius: 12, fontSize: 16 }
      : size === 'xs'
      ? { width: 34, height: 28, borderRadius: 8, fontSize: 11 }
      : size === 'sm'
      ? { width: 40, height: 34, borderRadius: 9, fontSize: 12.5 }
      : { width: 44, height: 38, borderRadius: 10, fontSize: 14 };

  return (
    <View
      style={[
        styles.badge,
        {
          width: dims.width,
          height: dims.height,
          borderRadius: dims.borderRadius,
          backgroundColor: bg,
          borderColor: border,
        },
      ]}>
      <Text style={[styles.text, { color: fg, fontSize: dims.fontSize }]} numberOfLines={1}>
        {symbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  text: {
    fontFamily: MONO_FONT,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
});
