import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';

export interface DateWheelItem {
  dateIso: string;
  dayOfWeek: number;
  dayNum: number;
  monthNum: number;
  yearNum: number;
  twoLetterPl: string;
  fullPl: string;
  isToday: boolean;
  weekOffset: number;
  classCount: number;
}

interface DateWheelCarouselProps {
  days: DateWheelItem[];
  selectedDateIso: string;
  onSelectDay: (item: DateWheelItem) => void;
}

const ITEM_WIDTH = 62;

function WheelDayCell({
  item,
  index,
  scrollX,
  isSelected,
  onPress,
}: {
  item: DateWheelItem;
  index: number;
  scrollX: SharedValue<number>;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const dotCount = Math.min(3, item.classCount);

  const animStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value - index * ITEM_WIDTH) / ITEM_WIDTH;
    const scale = interpolate(distance, [0, 1, 2, 3], [1.1, 0.9, 0.78, 0.68], Extrapolation.CLAMP);
    const opacity = interpolate(
      distance,
      [0, 1, 2, 3],
      [1, 0.56, 0.32, 0.14],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      distance,
      [0, 1, 2, 3],
      [0, 2.5, 6, 10],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.cellHitbox}>
      <Animated.View style={[styles.cellInner, animStyle]}>
        <Text
          style={[
            styles.dayLetter,
            {
              color: isSelected
                ? theme.text
                : item.isToday
                ? theme.textSecondary
                : theme.textMuted,
            },
          ]}>
          {item.twoLetterPl}
        </Text>

        <Text
          style={[
            styles.dayNumber,
            {
              color: isSelected
                ? theme.text
                : item.isToday
                ? theme.text
                : item.classCount > 0
                ? theme.textSecondary
                : theme.textMuted,
              fontWeight: isSelected ? '800' : '600',
            },
          ]}>
          {item.dayNum}
        </Text>

        <View style={styles.dotsRow}>
          {dotCount === 0 ? (
            <View style={styles.dotPlaceholder} />
          ) : (
            Array.from({ length: dotCount }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.loadDot,
                  {
                    backgroundColor: isSelected ? theme.text : theme.textMuted,
                  },
                ]}
              />
            ))
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Horizontal iPhone Timer / Wheel-style Date Carousel.
 * Smooth snapping with curved scale/opacity falloff and per-day haptic detents.
 */
export function DateWheelCarousel({
  days,
  selectedDateIso,
  onSelectDay,
}: DateWheelCarouselProps) {
  const theme = useAppTheme();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(() => Dimensions.get('window').width);

  const selectedIndex = Math.max(
    0,
    days.findIndex((d) => d.dateIso === selectedDateIso)
  );

  const scrollX = useSharedValue(selectedIndex * ITEM_WIDTH);
  const lastHapticIdx = useSharedValue(selectedIndex);
  const didInitScroll = useRef(false);
  const isUserDragging = useRef(false);

  const triggerDetentHaptic = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const x = event.contentOffset.x;
      scrollX.set(x);
      const nearest = Math.round(x / ITEM_WIDTH);
      if (nearest !== lastHapticIdx.value && nearest >= 0 && nearest < days.length) {
        lastHapticIdx.set(nearest);
        scheduleOnRN(triggerDetentHaptic);
      }
    },
  });

  // Sync external selection (e.g. "DZIŚ" button or tap) smoothly to center
  useEffect(() => {
    if (isUserDragging.current) return;
    const targetX = selectedIndex * ITEM_WIDTH;
    const animated = didInitScroll.current;
    didInitScroll.current = true;
    scrollRef.current?.scrollTo({ x: targetX, y: 0, animated });
    if (!animated) {
      scrollX.set(targetX);
      lastHapticIdx.set(selectedIndex);
    }
  }, [selectedIndex, scrollX, lastHapticIdx]);

  const commitOffset = useCallback(
    (offsetX: number) => {
      const idx = Math.max(0, Math.min(days.length - 1, Math.round(offsetX / ITEM_WIDTH)));
      const picked = days[idx];
      if (picked && picked.dateIso !== selectedDateIso) {
        onSelectDay(picked);
      }
    },
    [days, selectedDateIso, onSelectDay]
  );

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserDragging.current = false;
    commitOffset(e.nativeEvent.contentOffset.x);
  };

  const handleDragEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const vx = Math.abs(e.nativeEvent.velocity?.x ?? 0);
    if (vx < 0.05) {
      isUserDragging.current = false;
      commitOffset(e.nativeEvent.contentOffset.x);
    }
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 1) {
      setContainerWidth(w);
    }
  };

  const sidePadding = Math.max(0, (containerWidth - ITEM_WIDTH) / 2);

  return (
    <View
      onLayout={handleLayout}
      style={[styles.wrap, { borderBottomColor: theme.separator }]}>
      {/* Fixed center reticle (like iPhone Timer wheel highlight) */}
      <View
        pointerEvents="none"
        style={[
          styles.centerReticle,
          {
            left: sidePadding + 3,
            width: ITEM_WIDTH - 6,
            backgroundColor: theme.isDark
              ? 'rgba(255, 255, 255, 0.07)'
              : 'rgba(9, 9, 11, 0.055)',
            borderColor: theme.isDark
              ? 'rgba(255, 255, 255, 0.16)'
              : 'rgba(9, 9, 11, 0.10)',
          },
        ]}
      />

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        onScrollBeginDrag={() => {
          isUserDragging.current = true;
        }}
        onScrollEndDrag={handleDragEnd}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingHorizontal: sidePadding }}>
        {days.map((item, idx) => (
          <WheelDayCell
            key={item.dateIso}
            item={item}
            index={idx}
            scrollX={scrollX}
            isSelected={item.dateIso === selectedDateIso}
            onPress={() => {
              isUserDragging.current = false;
              triggerDetentHaptic();
              scrollRef.current?.scrollTo({ x: idx * ITEM_WIDTH, y: 0, animated: true });
              onSelectDay(item);
            }}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 76,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  centerReticle: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 15,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  cellHitbox: {
    width: ITEM_WIDTH,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayLetter: {
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  dayNumber: {
    fontFamily: MONO_FONT,
    fontSize: 19,
    letterSpacing: -0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.5,
    height: 5,
    marginTop: 1,
  },
  dotPlaceholder: {
    height: 4,
  },
  loadDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
  },
});
