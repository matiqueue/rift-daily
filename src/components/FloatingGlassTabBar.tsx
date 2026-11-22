import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React, { ComponentProps, useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';

type TabBarRenderFn = NonNullable<ComponentProps<typeof Tabs>['tabBar']>;
type FloatingGlassTabBarProps = Parameters<TabBarRenderFn>[0];

const DOCK_PADDING = 4;

function TabIconAnimated({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(focused ? 1.08 : 1);
  const lift = useSharedValue(focused ? -1 : 0);

  useEffect(() => {
    scale.set(
      withSpring(focused ? 1.08 : 1, {
        damping: 18,
        stiffness: 300,
      })
    );
    lift.set(
      withSpring(focused ? -1 : 0, {
        damping: 18,
        stiffness: 300,
      })
    );
  }, [focused, scale, lift]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

/**
 * Compact Obsidian Smoked-Glass Floating Dock.
 * Deep black translucent glass with crisp specular top edge,
 * frosted blur underneath, and a precision sliding luminous bar.
 */
export function FloatingGlassTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: FloatingGlassTabBarProps) {
  const theme = useAppTheme();
  const [innerWidth, setInnerWidth] = useState(0);

  const count = state.routes.length;
  const tabWidth = count > 0 && innerWidth > 0 ? innerWidth / count : 0;

  const pillX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      pillX.set(
        withSpring(state.index * tabWidth, {
          damping: 22,
          stiffness: 310,
          mass: 0.68,
        })
      );
    }
  }, [state.index, tabWidth, pillX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setInnerWidth(w - DOCK_PADDING * 2);
    }
  };

  const bottomOffset = Math.max(insets.bottom, 10) + 2;

  return (
    <View pointerEvents="box-none" style={styles.outerOverlay}>
      <View
        style={[
          styles.dockShadowWrap,
          {
            bottom: bottomOffset,
            shadowColor: '#000000',
            shadowOpacity: theme.isDark ? 0.78 : 0.16,
          },
        ]}>
        <View
          style={[
            styles.dockShell,
            {
              borderColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.18)'
                : 'rgba(9, 9, 11, 0.12)',
              backgroundColor:
                Platform.OS === 'ios'
                  ? 'transparent'
                  : theme.isDark
                  ? 'rgba(5, 5, 7, 0.90)'
                  : 'rgba(250, 250, 252, 0.92)',
            },
          ]}>
          {/* Real backdrop blur underneath smoked obsidian glass */}
          {Platform.OS === 'ios' && (
            <BlurView
              intensity={theme.isDark ? 55 : 68}
              tint={theme.isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Deep smoked-black obsidian glass tint */}
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(4, 4, 6, 0.68)'
                  : 'rgba(255, 255, 255, 0.62)',
              },
            ]}
          />

          {/* Razor-thin glass top highlight sheen */}
          <LinearGradient
            pointerEvents="none"
            colors={
              theme.isDark
                ? ['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0.02)', 'rgba(0, 0, 0, 0.15)']
                : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.2)', 'rgba(0, 0, 0, 0.03)']
            }
            locations={[0, 0.35, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.row} onLayout={handleLayout}>
            {/* Sliding Obsidian Active Pill with Top Luminous Accent Strip */}
            {tabWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.activePill,
                  {
                    width: tabWidth,
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.10)'
                      : 'rgba(9, 9, 11, 0.08)',
                    borderColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.16)'
                      : 'rgba(9, 9, 11, 0.08)',
                  },
                  indicatorStyle,
                ]}>
                <View
                  style={[
                    styles.activeTopGlowBar,
                    {
                      backgroundColor: theme.isDark ? '#FFFFFF' : '#09090B',
                    },
                  ]}
                />
              </Animated.View>
            )}

            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label =
                typeof options.tabBarLabel === 'string'
                  ? options.tabBarLabel
                  : typeof options.title === 'string'
                  ? options.title
                  : route.name;

              const isFocused = state.index === index;
              const iconColor = isFocused
                ? theme.isDark
                  ? '#FFFFFF'
                  : '#09090B'
                : theme.isDark
                ? '#71717A'
                : '#71717A';

              const onPress = () => {
                if (Platform.OS === 'ios') {
                  Haptics.selectionAsync().catch(() => {});
                }
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigateToTab(route.key);
                }
              };

              const onLongPress = () => {
                emitter.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel || label}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.tabBtn}>
                  <TabIconAnimated focused={isFocused}>
                    {options.tabBarIcon
                      ? options.tabBarIcon({
                          focused: isFocused,
                          color: iconColor,
                          size: 19,
                        })
                      : null}
                  </TabIconAnimated>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabLabel,
                      {
                        color: iconColor,
                        fontWeight: isFocused ? '700' : '500',
                      },
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  dockShadowWrap: {
    position: 'absolute',
    left: 28,
    right: 28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  dockShell: {
    height: 54,
    borderRadius: 27,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DOCK_PADDING,
    paddingVertical: DOCK_PADDING,
  },
  activePill: {
    position: 'absolute',
    left: DOCK_PADDING,
    top: DOCK_PADDING,
    bottom: DOCK_PADDING,
    borderRadius: 23,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    overflow: 'hidden',
  },
  activeTopGlowBar: {
    width: 18,
    height: 2,
    borderRadius: 1,
    marginTop: 1,
    opacity: 0.9,
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
  },
  tabLabel: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    letterSpacing: 0.2,
  },
});
