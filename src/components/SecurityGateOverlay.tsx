import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/GlassCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';

interface SecurityGateOverlayProps {
  mode: 'setup' | 'unlock';
}

export function SecurityGateOverlay({ mode }: SecurityGateOverlayProps) {
  const theme = useAppTheme();
  const user = useUsosStore((s) => s.user);
  const selectedInstallation = useUsosStore((s) => s.selectedInstallation);
  const securityPin = useUsosStore((s) => s.securityPin);
  const biometricsEnabled = useUsosStore((s) => s.biometricsEnabled);
  const configureSecurity = useUsosStore((s) => s.configureSecurity);
  const unlockSession = useUsosStore((s) => s.unlockSession);
  const logout = useUsosStore((s) => s.logout);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [useBio, setUseBio] = useState(true);
  const [hasBioHardware, setHasBioHardware] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const shakeX = useSharedValue(0);

  const triggerShake = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    shakeX.value = withSequence(
      withTiming(-12, { duration: 55 }),
      withTiming(12, { duration: 55 }),
      withTiming(-8, { duration: 55 }),
      withTiming(8, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  }, [shakeX]);

  const promptBiometrics = useCallback(async () => {
    try {
      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHw || !isEnrolled) return;
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Odblokuj Rift Daily (e-Dziennik USOS)',
        cancelLabel: 'Użyj kodu PIN',
        fallbackLabel: 'Kod PIN',
      });
      if (res.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        unlockSession();
      }
    } catch {
      // Fallback to PIN keypad
    }
  }, [unlockSession]);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync()
      .then((hw) => setHasBioHardware(hw))
      .catch(() => {});

    if (mode === 'unlock' && biometricsEnabled) {
      promptBiometrics();
    }
  }, [mode, biometricsEnabled, promptBiometrics]);

  const handleDigitPress = async (digit: string) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
    setErrorMsg(null);

    if (mode === 'unlock') {
      const next = (pin + digit).slice(0, 4);
      setPin(next);
      if (next.length === 4) {
        if (next === securityPin) {
          if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
          unlockSession();
        } else {
          triggerShake();
          setErrorMsg('Nieprawidłowy kod PIN. Spróbuj ponownie.');
          setTimeout(() => setPin(''), 220);
        }
      }
      return;
    }

    // Setup mode
    if (step === 'enter') {
      const next = (pin + digit).slice(0, 4);
      setPin(next);
      if (next.length === 4) {
        setTimeout(() => setStep('confirm'), 160);
      }
    } else {
      const next = (confirmPin + digit).slice(0, 4);
      setConfirmPin(next);
      if (next.length === 4) {
        if (next === pin) {
          if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
          await configureSecurity({
            enabled: true,
            pin: next,
            biometrics: useBio,
          });
        } else {
          triggerShake();
          setErrorMsg('Kody PIN nie są identyczne. Wprowadź ponownie.');
          setTimeout(() => {
            setPin('');
            setConfirmPin('');
            setStep('enter');
          }, 260);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
    if (mode === 'setup' && step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const activePinValue = mode === 'setup' && step === 'confirm' ? confirmPin : pin;

  const dotsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.overlay, { backgroundColor: theme.bg }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topSection}>
          <Avatar
            name={`${user.first_name} ${user.last_name}`}
            uri={user.photo_url}
            size={68}
            borderColor={theme.accent}
            variant="student"
          />
          <Text style={[styles.overline, { color: theme.accent }]}>
            RIFT DAILY // OCHRONA KONTA USOS
          </Text>
          <Text style={[styles.heading, { color: theme.text }]}>
            {mode === 'unlock'
              ? `Witaj, ${user.first_name}`
              : step === 'enter'
              ? 'Ustaw szybki kod PIN i Face ID'
              : 'Potwierdź swój 4-cyfrowy PIN'}
          </Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>
            {mode === 'unlock'
              ? `Odblokuj dostęp do e-Dziennika (${selectedInstallation.shortName})`
              : 'Zabezpiecz swoje oceny, płatności i mLegitymację 4-cyfrowym kodem PIN oraz Face ID.'}
          </Text>

          {/* PIN 4 Dots */}
          <Animated.View style={[styles.dotsRow, dotsAnimStyle]}>
            {[0, 1, 2, 3].map((i) => {
              const filled = activePinValue.length > i;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: filled ? theme.accent : theme.bgSecondary,
                      borderColor: filled ? theme.accent : theme.cardBorder,
                      transform: [{ scale: filled ? 1.12 : 1 }],
                    },
                  ]}
                />
              );
            })}
          </Animated.View>

          {errorMsg && (
            <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
          )}

          {mode === 'setup' && hasBioHardware && (
            <GlassCard
              padding={12}
              style={styles.bioToggleCard}
              onPress={() => setUseBio((v) => !v)}>
              <View style={styles.bioToggleRow}>
                <Ionicons name="scan-outline" size={20} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bioTitle, { color: theme.text }]}>
                    Odblokowywanie przez Face ID / Touch ID
                  </Text>
                  <Text style={[styles.bioSub, { color: theme.textSecondary }]}>
                    Domyślnie pytaj o biometrię przy starcie aplikacji
                  </Text>
                </View>
                <Ionicons
                  name={useBio ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={useBio ? theme.success : theme.textMuted}
                />
              </View>
            </GlassCard>
          )}
        </View>

        {/* Numeric Keypad */}
        <Animated.View entering={FadeInDown.duration(280)} style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keyRow}>
              {row.map((digit) => (
                <Pressable
                  key={digit}
                  onPress={() => handleDigitPress(digit)}
                  style={({ pressed }) => [
                    styles.keyBtn,
                    {
                      backgroundColor: pressed ? theme.primarySoft : theme.card,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Text style={[styles.keyDigit, { color: theme.text }]}>{digit}</Text>
                </Pressable>
              ))}
            </View>
          ))}

          <View style={styles.keyRow}>
            {mode === 'unlock' && biometricsEnabled ? (
              <Pressable
                onPress={promptBiometrics}
                style={[
                  styles.keyBtn,
                  { backgroundColor: theme.accentSoft, borderColor: theme.cardBorder },
                ]}>
                <Ionicons name="scan-outline" size={24} color={theme.accent} />
              </Pressable>
            ) : (
              <View style={styles.keyBtnPlaceholder} />
            )}

            <Pressable
              onPress={() => handleDigitPress('0')}
              style={({ pressed }) => [
                styles.keyBtn,
                {
                  backgroundColor: pressed ? theme.primarySoft : theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}>
              <Text style={[styles.keyDigit, { color: theme.text }]}>0</Text>
            </Pressable>

            <Pressable
              onPress={handleBackspace}
              style={[
                styles.keyBtn,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}>
              <Ionicons name="backspace-outline" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Bottom Footer Action */}
        <View style={styles.footerRow}>
          {mode === 'setup' ? (
            <Pressable
              onPress={() =>
                configureSecurity({
                  enabled: false,
                  pin: '',
                  biometrics: false,
                })
              }>
              <Text style={[styles.footerLink, { color: theme.textMuted }]}>
                Pomiń teraz (możesz włączyć w Ustawieniach)
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => logout()}>
              <Text style={[styles.footerLink, { color: theme.danger }]}>
                Zaloguj na inne konto USOS
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 950,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  overline: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 4,
    textAlign: 'center',
  },
  subText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 310,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 22,
    marginBottom: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  bioToggleCard: {
    width: '100%',
    marginTop: 14,
  },
  bioToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bioTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  bioSub: {
    fontSize: 11,
    marginTop: 1,
  },
  keypad: {
    gap: 12,
    alignItems: 'center',
  },
  keyRow: {
    flexDirection: 'row',
    gap: 18,
  },
  keyBtn: {
    width: 74,
    height: 74,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnPlaceholder: {
    width: 74,
    height: 74,
  },
  keyDigit: {
    fontFamily: MONO_FONT,
    fontSize: 26,
    fontWeight: '800',
  },
  footerRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '700',
  },
});
