import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/GlassCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { UniversityIcon } from '@/components/UniversityIcon';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  getNotificationPermissionStatus,
  NotificationCategory,
  requestNotificationPermissions,
} from '@/services/notifications';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT, ThemeMode } from '@/theme/theme';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const user = useUsosStore((s) => s.user);
  const selectedInstallation = useUsosStore((s) => s.selectedInstallation);
  const isSyncing = useUsosStore((s) => s.isSyncing);
  const syncFromLiveApi = useUsosStore((s) => s.syncFromLiveApi);
  const lastSyncedAt = useUsosStore((s) => s.lastSyncedAt);

  const themeMode = useUsosStore((s) => s.themeMode);
  const setThemeMode = useUsosStore((s) => s.setThemeMode);

  const securityEnabled = useUsosStore((s) => s.securityEnabled);
  const biometricsEnabled = useUsosStore((s) => s.biometricsEnabled);
  const securityPin = useUsosStore((s) => s.securityPin);
  const configureSecurity = useUsosStore((s) => s.configureSecurity);
  const lockSession = useUsosStore((s) => s.lockSession);
  const logout = useUsosStore((s) => s.logout);

  const notificationPrefs = useUsosStore((s) => s.notificationPrefs);
  const updateNotificationPreferences = useUsosStore((s) => s.updateNotificationPreferences);
  const triggerTestNotification = useUsosStore((s) => s.triggerTestNotification);
  const notificationHistory = useUsosStore((s) => s.notificationHistory);
  const clearNotificationHistory = useUsosStore((s) => s.clearNotificationHistory);

  const [osPermissionGranted, setOsPermissionGranted] = useState<boolean>(true);
  const [testSentBanner, setTestSentBanner] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPermissionStatus().then(setOsPermissionGranted);
  }, [notificationPrefs.enabled]);

  const hapticTap = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const handleTogglePref = async (
    key: keyof typeof notificationPrefs,
    value: boolean | number
  ) => {
    hapticTap();
    await updateNotificationPreferences({ [key]: value });
    const granted = await getNotificationPermissionStatus();
    setOsPermissionGranted(granted);
  };

  const handleSendTest = async (category: NotificationCategory, label: string) => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    await triggerTestNotification(category);
    const granted = await getNotificationPermissionStatus();
    setOsPermissionGranted(granted);
    setTestSentBanner(`Wysłano test: ${label}`);
    setTimeout(() => setTestSentBanner(null), 2600);
  };

  const categoryColor = (cat: NotificationCategory) => {
    switch (cat) {
      case 'class_change':
        return theme.warning;
      case 'class_reminder':
        return theme.cyan;
      case 'grade':
        return theme.success;
      case 'task_exam':
        return theme.accent;
      case 'payment':
        return theme.purple;
      case 'survey':
        return theme.textSecondary;
    }
  };

  const categoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'class_change':
        return 'swap-horizontal-outline' as const;
      case 'class_reminder':
        return 'alarm-outline' as const;
      case 'grade':
        return 'school-outline' as const;
      case 'task_exam':
        return 'Clipboard-outline' in Ionicons.glyphMap
          ? ('clipboard-outline' as const)
          : ('document-text-outline' as const);
      case 'payment':
        return 'card-outline' as const;
      case 'survey':
        return 'chatbox-ellipses-outline' as const;
    }
  };

  const activeCategoriesCount = [
    notificationPrefs.classChanges,
    notificationPrefs.classReminders,
    notificationPrefs.newGrades,
    notificationPrefs.tasksAndExams,
    notificationPrefs.paymentsAndInstallments,
    notificationPrefs.surveys,
  ].filter(Boolean).length;

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={syncFromLiveApi}
              tintColor={theme.accent}
            />
          }>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(360)} style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.monoOverline, { color: theme.accent }]}>
                PREFERENCJE // POWIADOMIENIA I KONTO
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>Ustawienia</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: notificationPrefs.enabled
                    ? theme.successSoft
                    : theme.bgSecondary,
                  borderColor: notificationPrefs.enabled ? theme.success : theme.cardBorder,
                },
              ]}>
              <Ionicons
                name={
                  notificationPrefs.enabled ? 'notifications' : 'notifications-off-outline'
                }
                size={13}
                color={notificationPrefs.enabled ? theme.success : theme.textSecondary}
              />
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: notificationPrefs.enabled ? theme.success : theme.textSecondary,
                  },
                ]}>
                {notificationPrefs.enabled ? `${activeCategoriesCount}/6 AKTYWNE` : 'WYCISZONE'}
              </Text>
            </View>
          </Animated.View>

          {/* Student Profile Summary Card */}
          <Animated.View entering={FadeInDown.delay(40).duration(380)}>
            <GlassCard elevated style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View style={{ position: 'relative' }}>
                  <Avatar
                    name={`${user.first_name} ${user.last_name}`}
                    uri={user.photo_url}
                    size={56}
                    borderColor={theme.cardBorder}
                    variant="student"
                  />
                  <View style={{ position: 'absolute', bottom: -3, right: -4 }}>
                    <UniversityIcon installation={selectedInstallation} size={23} />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.profileName, { color: theme.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {user.first_name} {user.last_name}
                  </Text>
                  <Text style={[styles.profileMeta, { color: theme.accent }]} numberOfLines={1}>
                    ALBUM #{user.student_number} • {selectedInstallation.shortName}
                  </Text>
                  <Text
                    style={[styles.profileUni, { color: theme.textSecondary }]}
                    numberOfLines={1}>
                    {user.programmes[0]?.name.pl || selectedInstallation.namePl}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* SECTION 1: POWIADOMIENIA PUSH & ALERTY USOS */}
          <Animated.View entering={FadeInDown.delay(90).duration(400)} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionMono, { color: theme.accent }]}>
                POWIADOMIENIA I ALERTY USOS
              </Text>
              <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
                WYBIERZ NA CO CHCESZ ALERTY
              </Text>
            </View>

            <GlassCard style={{ gap: 14 }}>
              {/* Master Switch */}
              <View style={styles.prefRow}>
                <View
                  style={[
                    styles.prefIconWrap,
                    {
                      backgroundColor: notificationPrefs.enabled
                        ? theme.accentSoft
                        : theme.bgSecondary,
                      borderColor: notificationPrefs.enabled ? theme.accent : theme.cardBorder,
                    },
                  ]}>
                  <Ionicons
                    name="notifications-outline"
                    size={19}
                    color={notificationPrefs.enabled ? theme.accent : theme.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prefTitle, { color: theme.text }]}>
                    Powiadomienia z dziennika
                  </Text>
                  <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                    Główny przełącznik alertów o zmianach w USOS
                  </Text>
                </View>
                <Switch
                  value={notificationPrefs.enabled}
                  onValueChange={(v) => handleTogglePref('enabled', v)}
                  trackColor={{ false: theme.bgSecondary, true: theme.accent }}
                />
              </View>

              {!osPermissionGranted && Platform.OS !== 'web' && (
                <Pressable
                  onPress={async () => {
                    const res = await requestNotificationPermissions();
                    setOsPermissionGranted(res.granted);
                  }}
                  style={[
                    styles.permissionBanner,
                    {
                      backgroundColor: theme.warningSoft,
                      borderColor: theme.warning,
                    },
                  ]}>
                  <Ionicons name="alert-circle-outline" size={18} color={theme.warning} />
                  <Text style={[styles.permissionText, { color: theme.text }]}>
                    Zezwól na powiadomienia systemowe (iOS / Android), aby otrzymywać alerty na
                    ekranie blokady.
                  </Text>
                  <Text style={[styles.permissionAction, { color: theme.warning }]}>WŁĄCZ</Text>
                </Pressable>
              )}

              {notificationPrefs.enabled && (
                <>
                  {/* 1. Zmiana godzin lekcji i sal */}
                  <View style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                    <View
                      style={[
                        styles.prefIconWrap,
                        {
                          backgroundColor: theme.warningSoft,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Ionicons name="swap-horizontal-outline" size={18} color={theme.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefTitle, { color: theme.text }]}>
                        Zmiany godzin lekcji i sal
                      </Text>
                      <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                        Przesunięcie godziny zajęć, zmiana sali lub odwołanie w planie
                      </Text>
                    </View>
                    <Switch
                      value={notificationPrefs.classChanges}
                      onValueChange={(v) => handleTogglePref('classChanges', v)}
                      trackColor={{ false: theme.bgSecondary, true: theme.warning }}
                    />
                  </View>

                  {/* 2. Przypomnienia przed lekcjami + lead time */}
                  <View style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                    <View
                      style={[
                        styles.prefIconWrap,
                        {
                          backgroundColor: theme.cyanSoft,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Ionicons name="alarm-outline" size={18} color={theme.cyan} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefTitle, { color: theme.text }]}>
                        Przypomnienia przed zajęciami
                      </Text>
                      <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                        Alert przed rozpoczęciem kolejnych zajęć z numerem sali
                      </Text>
                    </View>
                    <Switch
                      value={notificationPrefs.classReminders}
                      onValueChange={(v) => handleTogglePref('classReminders', v)}
                      trackColor={{ false: theme.bgSecondary, true: theme.cyan }}
                    />
                  </View>

                  {notificationPrefs.classReminders && (
                    <View style={styles.leadTimeWrap}>
                      <Text style={[styles.leadTimeLabel, { color: theme.textSecondary }]}>
                        WYPRZEDZENIE PRZED ZAJĘCIAMI:
                      </Text>
                      <SegmentedControl<'15' | '30' | '60'>
                        options={[
                          { label: '15 min przed', value: '15' },
                          { label: '30 min przed', value: '30' },
                          { label: '60 min przed', value: '60' },
                        ]}
                        value={String(notificationPrefs.reminderMinutesBefore) as '15' | '30' | '60'}
                        onChange={(v) =>
                          handleTogglePref('reminderMinutesBefore', Number(v) as 15 | 30 | 60)
                        }
                      />
                    </View>
                  )}

                  {/* 3. Nowe oceny */}
                  <View style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                    <View
                      style={[
                        styles.prefIconWrap,
                        {
                          backgroundColor: theme.successSoft,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Ionicons name="school-outline" size={18} color={theme.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefTitle, { color: theme.text }]}>
                        Nowe oceny i protokoły
                      </Text>
                      <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                        Wpisanie nowej oceny końcowej lub zmiana oceny w USOS
                      </Text>
                    </View>
                    <Switch
                      value={notificationPrefs.newGrades}
                      onValueChange={(v) => handleTogglePref('newGrades', v)}
                      trackColor={{ false: theme.bgSecondary, true: theme.success }}
                    />
                  </View>

                  {/* 4. Zadania, sprawdziany i egzaminy */}
                  <View style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                    <View
                      style={[
                        styles.prefIconWrap,
                        {
                          backgroundColor: theme.accentSoft,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Ionicons name="clipboard-outline" size={18} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefTitle, { color: theme.text }]}>
                        Zadania, kolokwia i egzaminy
                      </Text>
                      <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                        Nowe punkty ze sprawdzianów (crstests), zadania i terminy sesji
                      </Text>
                    </View>
                    <Switch
                      value={notificationPrefs.tasksAndExams}
                      onValueChange={(v) => handleTogglePref('tasksAndExams', v)}
                      trackColor={{ false: theme.bgSecondary, true: theme.accent }}
                    />
                  </View>

                  {/* 5. Raty i płatności */}
                  <View style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                    <View
                      style={[
                        styles.prefIconWrap,
                        {
                          backgroundColor: theme.purpleSoft,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Ionicons name="wallet-outline" size={18} color={theme.purple} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefTitle, { color: theme.text }]}>
                        Raty czesnego i płatności
                      </Text>
                      <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                        Przypomnienie na 2 dni przed terminem płatności raty
                      </Text>
                    </View>
                    <Switch
                      value={notificationPrefs.paymentsAndInstallments}
                      onValueChange={(v) => handleTogglePref('paymentsAndInstallments', v)}
                      trackColor={{ false: theme.bgSecondary, true: theme.purple }}
                    />
                  </View>

                  {/* 6. Ankiety studenckie */}
                  <View style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                    <View
                      style={[
                        styles.prefIconWrap,
                        {
                          backgroundColor: theme.bgSecondary,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Ionicons
                        name="chatbox-ellipses-outline"
                        size={18}
                        color={theme.textSecondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefTitle, { color: theme.text }]}>
                        Ankiety oceny zajęć
                      </Text>
                      <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                        Powiadomienie o nowych ankietach studenckich w USOS
                      </Text>
                    </View>
                    <Switch
                      value={notificationPrefs.surveys}
                      onValueChange={(v) => handleTogglePref('surveys', v)}
                      trackColor={{ false: theme.bgSecondary, true: theme.accent }}
                    />
                  </View>

                  {/* 7. Cisza nocna */}
                  <View style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                    <View
                      style={[
                        styles.prefIconWrap,
                        {
                          backgroundColor: theme.bgSecondary,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Ionicons name="moon-outline" size={18} color={theme.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefTitle, { color: theme.text }]}>
                        Cisza nocna (22:00 – 07:00)
                      </Text>
                      <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                        Nie wysyłaj dźwiękowych powiadomień w nocy
                      </Text>
                    </View>
                    <Switch
                      value={notificationPrefs.quietHoursEnabled}
                      onValueChange={(v) => handleTogglePref('quietHoursEnabled', v)}
                      trackColor={{ false: theme.bgSecondary, true: theme.accent }}
                    />
                  </View>
                </>
              )}
            </GlassCard>
          </Animated.View>

          {/* SECTION 2: TEST POWIADOMIEŃ & HISTORIA ZMIAN */}
          <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionMono, { color: theme.textSecondary }]}>
                TESTUJ POWIADOMIENIA NA TELEFONIE
              </Text>
              {testSentBanner && (
                <Text style={[styles.testFeedbackText, { color: theme.success }]}>
                  {testSentBanner}
                </Text>
              )}
            </View>

            <GlassCard style={{ gap: 10 }}>
              <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                Dotknij wybranej kategorii, aby natychmiast wywołać przykładowe powiadomienie (iOS /
                Android):
              </Text>
              <View style={styles.testButtonsGrid}>
                <Pressable
                  onPress={() => handleSendTest('class_change', 'Zmiana godzin lekcji')}
                  style={[
                    styles.testChip,
                    {
                      backgroundColor: theme.warningSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Ionicons name="swap-horizontal-outline" size={15} color={theme.warning} />
                  <Text style={[styles.testChipText, { color: theme.text }]} numberOfLines={1}>
                    Zmiana lekcji
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSendTest('grade', 'Nowa ocena 5.0')}
                  style={[
                    styles.testChip,
                    {
                      backgroundColor: theme.successSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Ionicons name="school-outline" size={15} color={theme.success} />
                  <Text style={[styles.testChipText, { color: theme.text }]} numberOfLines={1}>
                    Nowa ocena
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSendTest('task_exam', 'Zadanie / Kolokwium')}
                  style={[
                    styles.testChip,
                    {
                      backgroundColor: theme.accentSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Ionicons name="clipboard-outline" size={15} color={theme.accent} />
                  <Text style={[styles.testChipText, { color: theme.text }]} numberOfLines={1}>
                    Zadanie / Test
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSendTest('payment', 'Rata czesnego')}
                  style={[
                    styles.testChip,
                    {
                      backgroundColor: theme.purpleSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Ionicons name="wallet-outline" size={15} color={theme.purple} />
                  <Text style={[styles.testChipText, { color: theme.text }]} numberOfLines={1}>
                    Rata / Płatność
                  </Text>
                </Pressable>
              </View>

              {notificationHistory.length > 0 && (
                <View style={[styles.historyBox, { borderTopColor: theme.separator }]}>
                  <View style={styles.historyHeader}>
                    <Text style={[styles.leadTimeLabel, { color: theme.textSecondary }]}>
                      OSTATNIE POWIADOMIENIA ({notificationHistory.length})
                    </Text>
                    <Pressable onPress={clearNotificationHistory}>
                      <Text style={[styles.clearHistoryLink, { color: theme.danger }]}>
                        WYCZYŚĆ
                      </Text>
                    </Pressable>
                  </View>
                  {notificationHistory.slice(0, 4).map((ev) => (
                    <View
                      key={ev.id}
                      style={[
                        styles.historyItem,
                        {
                          backgroundColor: theme.bgSecondary,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Ionicons
                        name={categoryIcon(ev.category)}
                        size={16}
                        color={categoryColor(ev.category)}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={styles.historyTopRow}>
                          <Text
                            style={[styles.historyTitle, { color: theme.text }]}
                            numberOfLines={1}>
                            {ev.title}
                          </Text>
                          <Text style={[styles.historyTime, { color: theme.textMuted }]}>
                            {ev.createdAt}
                          </Text>
                        </View>
                        <Text
                          style={[styles.historyBody, { color: theme.textSecondary }]}
                          numberOfLines={2}>
                          {ev.body}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          </Animated.View>

          {/* SECTION 3: WYGLĄD I MOTYW */}
          <Animated.View entering={FadeInDown.delay(190).duration(400)} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionMono, { color: theme.textSecondary }]}>
                WYGLĄD I MOTYW (JASNY / CIEMNY)
              </Text>
              <Ionicons
                name={theme.isDark ? 'moon-outline' : 'sunny-outline'}
                size={15}
                color={theme.warning}
              />
            </View>
            <GlassCard style={{ gap: 10 }}>
              <SegmentedControl<ThemeMode>
                options={[
                  { label: 'Ciemny (Dark)', value: 'dark' },
                  { label: 'Jasny (Light)', value: 'light' },
                  { label: 'Systemowy', value: 'system' },
                ]}
                value={themeMode}
                onChange={(m) => {
                  hapticTap();
                  setThemeMode(m);
                }}
              />
              <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                Styl Linear / Vercel Bento z miękkim zaokrągleniem kart (20px) i subtelnymi
                akcentami kolorystycznymi.
              </Text>
            </GlassCard>
          </Animated.View>

          {/* SECTION 4: BEZPIECZEŃSTWO PIN & FACE ID */}
          <Animated.View entering={FadeInDown.delay(230).duration(400)} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionMono, { color: theme.textSecondary }]}>
                BEZPIECZEŃSTWO (PIN I FACE ID)
              </Text>
              <Ionicons
                name={securityEnabled ? 'shield-checkmark' : 'shield-outline'}
                size={15}
                color={securityEnabled ? theme.success : theme.textMuted}
              />
            </View>

            <GlassCard style={{ gap: 12 }}>
              <Pressable
                onPress={() => {
                  hapticTap();
                  if (securityEnabled) {
                    configureSecurity({ enabled: false, pin: '', biometrics: false });
                  } else {
                    useUsosStore.setState({ securityConfigured: false });
                  }
                }}
                style={styles.settingRowFirst}>
                <View
                  style={[
                    styles.prefIconWrap,
                    {
                      backgroundColor: securityEnabled ? theme.successSoft : theme.bgSecondary,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Ionicons
                    name="keypad-outline"
                    size={18}
                    color={securityEnabled ? theme.success : theme.text}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prefTitle, { color: theme.text }]}>
                    {securityEnabled
                      ? 'Blokada 4-cyfrowym kodem PIN aktywna'
                      : 'Ustaw 4-cyfrowy kod PIN i Face ID'}
                  </Text>
                  <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                    {securityEnabled
                      ? 'Chroni dostęp do Twoich ocen i rozliczeń'
                      : 'Włącz blokadę przy starcie aplikacji'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.actionTag,
                    { color: securityEnabled ? theme.danger : theme.accent },
                  ]}>
                  {securityEnabled ? 'WYŁĄCZ' : 'USTAW PIN'}
                </Text>
              </Pressable>

              {securityEnabled && (
                <>
                  <View style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                    <View
                      style={[
                        styles.prefIconWrap,
                        {
                          backgroundColor: theme.accentSoft,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Ionicons name="scan-outline" size={18} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefTitle, { color: theme.text }]}>
                        Odblokowywanie przez Face ID
                      </Text>
                      <Text style={[styles.prefDesc, { color: theme.textSecondary }]}>
                        Automatyczne logowanie biometryczne przy uruchomieniu
                      </Text>
                    </View>
                    <Switch
                      value={biometricsEnabled}
                      onValueChange={(v) => {
                        hapticTap();
                        configureSecurity({
                          enabled: true,
                          pin: securityPin,
                          biometrics: v,
                        });
                      }}
                      trackColor={{ false: theme.bgSecondary, true: theme.accent }}
                    />
                  </View>

                  <Pressable
                    onPress={() => {
                      hapticTap();
                      useUsosStore.setState({ securityConfigured: false });
                    }}
                    style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                    <Ionicons name="create-outline" size={18} color={theme.text} />
                    <Text style={[styles.settingText, { color: theme.text }]}>
                      Zmień 4-cyfrowy kod PIN
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      hapticTap();
                      lockSession();
                    }}
                    style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={theme.warning} />
                    <Text style={[styles.settingText, { color: theme.text }]}>
                      Zablokuj aplikację teraz
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </Pressable>
                </>
              )}
            </GlassCard>
          </Animated.View>

          {/* SECTION 5: KONTO USOS I SYNCHRONIZACJA */}
          <Animated.View entering={FadeInDown.delay(270).duration(400)} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionMono, { color: theme.textSecondary }]}>
                KONTO USOS API I UCZELNIA
              </Text>
              <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
                SYNC: {lastSyncedAt || 'TERAZ'}
              </Text>
            </View>

            <GlassCard style={{ gap: 12 }}>
              <Pressable
                onPress={() => {
                  hapticTap();
                  syncFromLiveApi();
                }}
                style={styles.settingRowFirst}>
                <Ionicons name="sync-outline" size={18} color={theme.accent} />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Wymuś pełną synchronizację z USOS API
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </Pressable>

              <Pressable
                onPress={() => {
                  hapticTap();
                  router.push('/login');
                }}
                style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                <Ionicons name="business-outline" size={18} color={theme.text} />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Zmień uczelnię ({selectedInstallation.shortName})
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </Pressable>

              <Pressable
                onPress={() => {
                  hapticTap();
                  router.push('/modal/api-config');
                }}
                style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                <Ionicons name="key-outline" size={18} color={theme.text} />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Klucze OAuth 1.0a, autoryzacja PIN i diagnostyka
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </Pressable>

              <Pressable
                onPress={async () => {
                  hapticTap();
                  await logout();
                  router.replace('/login');
                }}
                style={[styles.prefRowDivider, { borderTopColor: theme.separator }]}>
                <Ionicons name="log-out-outline" size={18} color={theme.danger} />
                <Text style={[styles.settingText, { color: theme.danger }]}>
                  Wyloguj z konta USOS
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.danger} />
              </Pressable>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  monoOverline: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  profileCard: {
    gap: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '900',
  },
  profileMeta: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  profileUni: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionMono: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  sectionHint: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prefRowDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  prefIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  prefDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  permissionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  permissionAction: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '900',
  },
  leadTimeWrap: {
    gap: 6,
    paddingTop: 2,
  },
  leadTimeLabel: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  testFeedbackText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  testButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testChip: {
    flexGrow: 1,
    flexBasis: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 13,
    borderWidth: 1,
  },
  testChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  historyBox: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearHistoryLink: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 13,
    borderWidth: 1,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  historyTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  historyTime: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
  },
  historyBody: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  settingRowFirst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  actionTag: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '900',
  },
});
