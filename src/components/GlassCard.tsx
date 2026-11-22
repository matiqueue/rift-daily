import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/GlassSurface';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
  padding?: number;
}

export function GlassCard({
  children,
  style,
  onPress,
  padding = 16,
}: GlassCardProps) {
  return (
    <GlassSurface
      radius={18}
      interactive={Boolean(onPress)}
      onPress={onPress}
      style={style}
      contentStyle={{ padding }}>
      {children}
    </GlassSurface>
  );
}
