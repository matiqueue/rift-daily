import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
  subtitleBadge?: string;
  borderColor?: string;
  variant?: 'student' | 'teacher' | 'faculty';
}

const PORTRAIT_PALETTES: [string, string, string][] = [
  ['#1E1B4B', '#312E81', '#818CF8'], // Indigo portrait
  ['#064E3B', '#065F46', '#34D399'], // Emerald portrait
  ['#3B0764', '#4C1D95', '#A78BFA'], // Violet portrait
  ['#0C4A6E', '#075985', '#38BDF8'], // Sky portrait
  ['#451A03', '#78350F', '#FBBF24'], // Amber portrait
  ['#1E293B', '#334155', '#94A3B8'], // Slate portrait
];

function pickPalette(name: string): [string, string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PORTRAIT_PALETTES[Math.abs(hash) % PORTRAIT_PALETTES.length];
}

export function Avatar({
  name,
  uri,
  size = 46,
  subtitleBadge,
  borderColor,
  variant = 'teacher',
}: AvatarProps) {
  const theme = useAppTheme();
  const [imgError, setImgError] = useState(false);
  const borderRadius = Math.round(size * 0.34);
  const [bgStart, bgEnd, accentColor] = pickPalette(name || 'Rift Daily');
  const showPhoto = Boolean(uri && !imgError);

  const iconName: keyof typeof Ionicons.glyphMap =
    variant === 'student'
      ? 'person-outline'
      : variant === 'faculty'
      ? 'business-outline'
      : 'school-outline';

  const iconSize = Math.max(16, Math.round(size * 0.42));
  const innerCircleSize = Math.round(size * 0.72);

  return (
    <View style={{ width: size, height: size, flexShrink: 0 }}>
      <View
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: theme.isDark ? '#18181B' : '#E4E4E7',
            borderColor: borderColor || theme.cardBorder,
          },
        ]}>
        {showPhoto ? (
          <Image
            source={{ uri: uri! }}
            style={{ width: size, height: size, borderRadius }}
            contentFit="cover"
            contentPosition="top"
            transition={220}
            cachePolicy="memory-disk"
            onError={() => setImgError(true)}
          />
        ) : (
          <LinearGradient
            colors={theme.isDark ? [bgStart, bgEnd] : [`${accentColor}20`, `${accentColor}38`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.fallback, { width: size, height: size, borderRadius }]}>
            <View
              style={[
                styles.centeredIconBubble,
                {
                  width: innerCircleSize,
                  height: innerCircleSize,
                  borderRadius: Math.round(innerCircleSize / 2),
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(255,255,255,0.72)',
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.12)'
                    : `${accentColor}35`,
                },
              ]}>
              <Ionicons
                name={iconName}
                size={iconSize}
                color={theme.isDark ? '#FAFAFA' : accentColor}
              />
            </View>
          </LinearGradient>
        )}
      </View>

      {subtitleBadge ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.cardElevated,
              borderColor: theme.cardBorder,
            },
          ]}>
          <Text style={[styles.badgeText, { color: theme.accent }]} numberOfLines={1}>
            {subtitleBadge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredIconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    bottom: -3,
    right: -4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontFamily: MONO_FONT,
    fontSize: 8,
    fontWeight: '800',
  },
});
