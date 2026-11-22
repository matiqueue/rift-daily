import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/useAppTheme';

interface TypewriterTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  cursorColor?: string;
  speedMs?: number;
  startDelayMs?: number;
  keepCursor?: boolean;
  numberOfLines?: number;
}

/**
 * Crisp editorial typewriter animation with a subtle fading mono cursor.
 */
export function TypewriterText({
  text,
  style,
  cursorColor,
  speedMs = 22,
  startDelayMs = 40,
  keepCursor = false,
  numberOfLines,
}: TypewriterTextProps) {
  const theme = useAppTheme();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    let idx = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const startTimer = setTimeout(() => {
      setVisibleCount(0);
      setShowCursor(true);
      intervalId = setInterval(() => {
        idx += 1;
        setVisibleCount(idx);
        if (idx >= text.length) {
          if (intervalId) clearInterval(intervalId);
          if (!keepCursor) {
            hideTimer = setTimeout(() => setShowCursor(false), 850);
          }
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(startTimer);
      if (intervalId) clearInterval(intervalId);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [text, speedMs, startDelayMs, keepCursor]);

  useEffect(() => {
    cursorOpacity.set(
      withRepeat(
        withSequence(
          withTiming(0.15, { duration: 420, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, [cursorOpacity]);

  const cursorAnimStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const shown = text.slice(0, Math.min(visibleCount, text.length));

  return (
    <View style={styles.typewriterRow}>
      <Text style={style} numberOfLines={numberOfLines}>
        {shown}
      </Text>
      {showCursor && (
        <Animated.Text
          style={[
            style,
            styles.cursorGlyph,
            { color: cursorColor || theme.textSecondary },
            cursorAnimStyle,
          ]}>
          ▍
        </Animated.Text>
      )}
    </View>
  );
}

const SCRAMBLE_CHARS = '0123456789ABCDEF·:';

interface ScrambleTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  durationMs?: number;
  numberOfLines?: number;
}

/**
 * Flighty / departure-board monospace glyph-decode reveal.
 */
export function ScrambleText({
  text,
  style,
  durationMs = 320,
  numberOfLines = 1,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!text) return;
    const totalFrames = Math.max(6, Math.round(durationMs / 32));
    let frame = 0;

    const timer = setInterval(() => {
      frame += 1;
      const progress = frame / totalFrames;
      if (progress >= 1) {
        setDisplay(text);
        clearInterval(timer);
        return;
      }

      const lockedCount = Math.floor(progress * text.length);
      let next = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (i < lockedCount || ch === ' ' || ch === '·' || ch === '•' || ch === ':') {
          next += ch;
        } else {
          next += SCRAMBLE_CHARS[(frame * 7 + i * 3) % SCRAMBLE_CHARS.length];
        }
      }
      setDisplay(next);
    }, 32);

    return () => clearInterval(timer);
  }, [text, durationMs]);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {display}
    </Text>
  );
}

interface AnimatedNumberTextProps {
  value: string;
  style?: StyleProp<TextStyle>;
  durationMs?: number;
}

/**
 * Smoothly rolls numeric telemetry (e.g., "4.62", "120", "3 zaj.") with ease-out cubic interpolation.
 */
export function AnimatedNumberText({
  value,
  style,
  durationMs = 420,
}: AnimatedNumberTextProps) {
  const [rendered, setRendered] = useState(value);

  useEffect(() => {
    const match = /^([+-]?\d+(?:[.,]\d+)?)(.*)$/.exec(value.trim());
    if (!match) {
      const t = setTimeout(() => setRendered(value), 0);
      return () => clearTimeout(t);
    }

    const rawNum = match[1];
    const suffix = match[2] || '';
    const usesComma = rawNum.includes(',');
    const decimals = rawNum.includes('.')
      ? rawNum.split('.')[1].length
      : rawNum.includes(',')
      ? rawNum.split(',')[1].length
      : 0;
    const target = parseFloat(rawNum.replace(',', '.'));
    if (!Number.isFinite(target)) {
      const t = setTimeout(() => setRendered(value), 0);
      return () => clearTimeout(t);
    }

    const frames = Math.max(10, Math.round(durationMs / 24));
    let frame = 0;

    const timer = setInterval(() => {
      frame += 1;
      const t = Math.min(1, frame / frames);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = target * eased;
      const formatted =
        decimals > 0 ? current.toFixed(decimals) : String(Math.round(current));
      const finalStr = (usesComma ? formatted.replace('.', ',') : formatted) + suffix;
      setRendered(t >= 1 ? value : finalStr);
      if (t >= 1) clearInterval(timer);
    }, 24);

    return () => clearInterval(timer);
  }, [value, durationMs]);

  return (
    <Text style={style} numberOfLines={1} adjustsFontSizeToFit>
      {rendered}
    </Text>
  );
}

interface LivePulseDotProps {
  color: string;
  size?: number;
  active?: boolean;
}

/**
 * Breathing concentric radar pulse dot for live/ongoing classes.
 */
export function LivePulseDot({ color, size = 7, active = true }: LivePulseDotProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      pulse.set(0);
      return;
    }
    pulse.set(
      withRepeat(
        withTiming(1, { duration: 1650, easing: Easing.out(Easing.cubic) }),
        -1,
        false
      )
    );
  }, [active, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.9 }],
    opacity: (1 - pulse.value) * 0.5,
  }));

  return (
    <View style={[styles.pulseWrap, { width: size * 2.2, height: size * 2.2 }]}>
      {active && (
        <Animated.View
          style={[
            styles.pulseHalo,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
            },
            haloStyle,
          ]}
        />
      )}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

interface HairlineDrawProps {
  color: string;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Thin editorial hairline that draws smoothly left-to-right on mount.
 */
export function HairlineDraw({ color, delayMs = 0, style }: HairlineDrawProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      progress.set(withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs, progress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.hairline,
        { backgroundColor: color },
        animStyle,
        style,
      ]}
    />
  );
}

interface EditorialFadeProps {
  children: React.ReactNode;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Ultra-subtle editorial crossfade + 5px micro-lift (no spring bouncing).
 */
export function EditorialFade({ children, delayMs = 0, style }: EditorialFadeProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(5);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.set(withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }));
      translateY.set(withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) }));
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  typewriterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cursorGlyph: {
    marginLeft: 1,
    fontWeight: '400',
  },
  pulseWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseHalo: {
    position: 'absolute',
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
