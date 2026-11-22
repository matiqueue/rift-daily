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

function getInitials(name: string): string {
  const cleaned = (name || '')
    .replace(/\b(dr|hab|prof|mgr|inż|lic|nadzw|zw|u[a-z]{1,4})\.?\b/gi, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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
  const borderRadius = Math.round(size * 0.5);
  const showPhoto = Boolean(uri && !imgError);
  const initials = getInitials(name);

  return (
    <View style={{ width: size, height: size, flexShrink: 0 }}>
      <View
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: theme.bgSecondary,
            borderColor: borderColor || theme.cardBorder,
          },
        ]}>
        {showPhoto ? (
          <Image
            source={{ uri: uri! }}
            style={{ width: size, height: size, borderRadius }}
            contentFit="cover"
            contentPosition={variant === 'student' ? 'center' : 'top'}
            transition={200}
            cachePolicy="memory-disk"
            onError={() => setImgError(true)}
          />
        ) : (
          <LinearGradient
            colors={theme.isDark ? ['#232329', '#141418'] : ['#EFEFF2', '#E2E2E7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.fallback, { width: size, height: size, borderRadius }]}>
            <Text
              style={[
                styles.initialsText,
                {
                  color: theme.textSecondary,
                  fontSize: Math.max(9, Math.round(size * 0.34)),
                },
              ]}>
              {initials}
            </Text>
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
          <Text style={[styles.badgeText, { color: theme.text }]} numberOfLines={1}>
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
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: MONO_FONT,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  badge: {
    position: 'absolute',
    bottom: -3,
    right: -4,
    borderWidth: StyleSheet.hairlineWidth,
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
