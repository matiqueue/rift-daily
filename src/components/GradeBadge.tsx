import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';

interface GradeBadgeProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GradeBadge({ symbol, size = 'md' }: GradeBadgeProps) {
  const theme = useAppTheme();
  const normalized = symbol.replace(',', '.').toUpperCase();

  let bg = theme.primarySoft;
  let fg = theme.text;
  let border = theme.cardBorder;

  if (normalized === '5' || normalized === '5.0' || normalized === 'ZAL') {
    bg = theme.successSoft;
    fg = theme.success;
    border = `${theme.success}45`;
  } else if (normalized === '4.5' || normalized === '4' || normalized === '4.0') {
    bg = theme.primarySoft;
    fg = theme.text;
    border = theme.cardBorder;
  } else if (normalized === '3.5' || normalized === '3' || normalized === '3.0') {
    bg = theme.warningSoft;
    fg = theme.warning;
    border = `${theme.warning}45`;
  } else if (normalized === '2' || normalized === '2.0' || normalized === 'NZAL') {
    bg = theme.dangerSoft;
    fg = theme.danger;
    border = `${theme.danger}45`;
  }

  const dims =
    size === 'lg'
      ? { width: 54, height: 54, borderRadius: 17, fontSize: 18 }
      : size === 'sm'
      ? { width: 38, height: 36, borderRadius: 11, fontSize: 12 }
      : { width: 46, height: 46, borderRadius: 14, fontSize: 15 };

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
      <Text style={[styles.text, { color: fg, fontSize: dims.fontSize }]}>{symbol}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontFamily: MONO_FONT,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
});
