import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/useAppTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
  padding?: number;
  delay?: number;
}

export function GlassCard({
  children,
  style,
  onPress,
  elevated = false,
  padding = 16,
  delay = 0,
}: GlassCardProps) {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const innerContent = (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(320).springify().damping(20)}
      style={[
        styles.card,
        {
          backgroundColor: elevated ? theme.cardElevated : theme.card,
          borderColor: theme.cardBorder,
          padding,
          shadowColor: '#000000',
          shadowOpacity: theme.isDark ? 0.35 : 0.05,
          shadowRadius: elevated ? 16 : 8,
          shadowOffset: { width: 0, height: elevated ? 6 : 3 },
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.984, { damping: 18, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 320 });
        }}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.selectionAsync().catch(() => {});
          }
          onPress();
        }}>
        <Animated.View style={animatedPressStyle}>{innerContent}</Animated.View>
      </Pressable>
    );
  }

  return innerContent;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
