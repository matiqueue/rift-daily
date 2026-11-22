import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { GlassSurface } from '@/components/GlassSurface';
import { ListRow } from '@/components/ListRow';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  getNotificationPermissionStatus,
  NotificationCategory,
  requestNotificationPermissions,
} from '@/services/notifications';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT, ThemeMode } from '@/theme/theme';

export function SettingsSection() {
  const theme = useAppTheme();
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
  const deleteAllLocalData = useUsosStore((s) => s.deleteAllLocalData);

  const notificationPrefs = useUsosStore((s) => s.notificationPrefs);
  const updateNotificationPreferences = useUsosStore((s) => s.updateNotificationPreferences);
  const triggerTestNotification = useUsosStore((s) => s.triggerTestNotification);
  const notificationHistory = useUsosStore((s) => s.notificationHistory);
  const clearNotificationHistory = useUsosStore((s) => s.clearNotificationHistory);

  const [osPermissionGranted, setOsPermissionGranted] = useState<boolean>(true);
  const [testSentBanner, setTestSentBanner] = useState<string | null>(null);
  const [syncStatusHint, setSyncStatusHint] = useState<string | null>(null);

  const handleManualSync = async () => {
    hapticTap();
    setSyncStatusHint(null);
    const res = await syncFromLiveApi();
    if (res.synced) {
      setSyncStatusHint('Zaktualizowano dane z USOS');
      setTimeout(() => setSyncStatusHint(null), 3000);
    } else if (res.waitSec) {
      setSyncStatusHint(`Dane są aktualne — kolejne ręczne odświeżenie za ${res.waitSec} s`);
      setTimeout(() => setSyncStatusHint(null), 3500);
    }
  };

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
    setTestSentBanner(`Wysłano: ${label}`);
    setTimeout(() => setTestSentBanner(null), 2400);
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
        return 'document-text-outline' as const;
      case 'payment':
        return 'card-outline' as const;
      case 'survey':
        return 'chatbox-ellipses-outline' as const;
    }
  };

  // Unified monochrome switch track color across all toggles
  const switchTrack = {
    false: theme.bgSecondary,
    true: theme.isDark ? '#52525B' : '#18181B',
  };

  return (
    <View>
      {/* 1. WYGLĄD I MOTYW */}
      <SectionHeader
        title="Wygląd i motyw"
        rightText={theme.isDark ? 'DARK' : 'LIGHT'}
        style={styles.firstSection}
      />
      <SegmentedControl<ThemeMode>
        options={[
          { label: 'Ciemny', value: 'dark' },
          { label: 'Jasny', value: 'light' },
          { label: 'Systemowy', value: 'system' },
        ]}
        value={themeMode}
        onChange={(m) => {
          hapticTap();
          setThemeMode(m);
        }}
      />

      {/* 2. POWIADOMIENIA I ALERTY USOS */}
      <SectionHeader
        title="Powiadomienia USOS"
        rightText={notificationPrefs.enabled ? 'AKTYWNE' : 'WYCISZONE'}
      />

      <ListRow
        title="Powiadomienia z dziennika"
        subtitle="Główny przełącznik alertów o zmianach w USOS"
        left={<Ionicons name="notifications-outline" size={18} color={theme.text} />}
        right={
          <Switch
            value={notificationPrefs.enabled}
            onValueChange={(v) => handleTogglePref('enabled', v)}
            trackColor={switchTrack}
          />
        }
        showDivider={notificationPrefs.enabled}
      />

      {!osPermissionGranted && Platform.OS !== 'web' && (
        <Pressable
          onPress={async () => {
            const res = await requestNotificationPermissions();
            setOsPermissionGranted(res.granted);
          }}
          style={[
            styles.permissionBanner,
            { backgroundColor: theme.warningSoft, borderColor: `${theme.warning}40` },
          ]}>
          <Ionicons name="alert-circle-outline" size={17} color={theme.warning} />
          <Text style={[styles.permissionText, { color: theme.text }]}>
            Zezwól na powiadomienia systemowe, aby otrzymywać alerty na ekranie blokady.
          </Text>
          <Text style={[styles.permissionAction, { color: theme.warning }]}>WŁĄCZ</Text>
        </Pressable>
      )}

      {notificationPrefs.enabled && (
        <>
          <ListRow
            dense
            title="Zmiany godzin zajęć i sal"
            subtitle="Przesunięcie godziny, zmiana sali lub odwołanie"
            left={<Ionicons name="swap-horizontal-outline" size={17} color={theme.textSecondary} />}
            right={
              <Switch
                value={notificationPrefs.classChanges}
                onValueChange={(v) => handleTogglePref('classChanges', v)}
                trackColor={switchTrack}
              />
            }
          />

          <ListRow
            dense
            title="Przypomnienia przed zajęciami"
            subtitle="Alert przed startem kolejnych zajęć z numerem sali"
            left={<Ionicons name="alarm-outline" size={17} color={theme.textSecondary} />}
            right={
              <Switch
                value={notificationPrefs.classReminders}
                onValueChange={(v) => handleTogglePref('classReminders', v)}
                trackColor={switchTrack}
              />
            }
            showDivider={!notificationPrefs.classReminders}
          />

          {notificationPrefs.classReminders && (
            <View style={[styles.leadTimeRow, { borderBottomColor: theme.separator }]}>
              <Text style={[styles.leadTimeLabel, { color: theme.textMuted }]}>
                WYPRZEDZENIE:
              </Text>
              <View style={{ flex: 1 }}>
                <SegmentedControl<'15' | '30' | '60'>
                  options={[
                    { label: '15 min', value: '15' },
                    { label: '30 min', value: '30' },
                    { label: '60 min', value: '60' },
                  ]}
                  value={String(notificationPrefs.reminderMinutesBefore) as '15' | '30' | '60'}
                  onChange={(v) =>
                    handleTogglePref('reminderMinutesBefore', Number(v) as 15 | 30 | 60)
                  }
                />
              </View>
            </View>
          )}

          <ListRow
            dense
            title="Nowe oceny i protokoły"
            subtitle="Wpisanie nowej oceny końcowej lub zmiana oceny"
            left={<Ionicons name="school-outline" size={17} color={theme.textSecondary} />}
            right={
              <Switch
                value={notificationPrefs.newGrades}
                onValueChange={(v) => handleTogglePref('newGrades', v)}
                trackColor={switchTrack}
              />
            }
          />

          <ListRow
            dense
            title="Zadania, kolokwia i egzaminy"
            subtitle="Nowe punkty ze sprawdzianów (crstests) i terminy sesji"
            left={<Ionicons name="document-text-outline" size={17} color={theme.textSecondary} />}
            right={
              <Switch
                value={notificationPrefs.tasksAndExams}
                onValueChange={(v) => handleTogglePref('tasksAndExams', v)}
                trackColor={switchTrack}
              />
            }
          />

          <ListRow
            dense
            title="Raty czesnego i płatności"
            subtitle="Przypomnienie na 2 dni przed terminem raty"
            left={<Ionicons name="wallet-outline" size={17} color={theme.textSecondary} />}
            right={
              <Switch
                value={notificationPrefs.paymentsAndInstallments}
                onValueChange={(v) => handleTogglePref('paymentsAndInstallments', v)}
                trackColor={switchTrack}
              />
            }
          />

          <ListRow
            dense
            title="Ankiety oceny zajęć"
            subtitle="Powiadomienie o nowych ankietach w USOS"
            left={<Ionicons name="chatbox-ellipses-outline" size={17} color={theme.textSecondary} />}
            right={
              <Switch
                value={notificationPrefs.surveys}
                onValueChange={(v) => handleTogglePref('surveys', v)}
                trackColor={switchTrack}
              />
            }
          />

          <ListRow
            dense
            title="Cisza nocna (22:00 – 07:00)"
            subtitle="Nie wysyłaj dźwiękowych powiadomień w nocy"
            left={<Ionicons name="moon-outline" size={17} color={theme.textSecondary} />}
            right={
              <Switch
                value={notificationPrefs.quietHoursEnabled}
                onValueChange={(v) => handleTogglePref('quietHoursEnabled', v)}
                trackColor={switchTrack}
              />
            }
            showDivider={false}
          />
        </>
      )}

      {/* 3. TEST POWIADOMIEŃ & HISTORIA */}
      <SectionHeader
        title="Test powiadomień"
        rightText={testSentBanner || undefined}
      />

      <View style={styles.testPillsRow}>
        {(
          [
            { cat: 'class_change', label: 'Zmiana lekcji', icon: 'swap-horizontal-outline' },
            { cat: 'grade', label: 'Nowa ocena', icon: 'school-outline' },
            { cat: 'task_exam', label: 'Zadanie', icon: 'document-text-outline' },
            { cat: 'payment', label: 'Rata', icon: 'wallet-outline' },
          ] as const
        ).map((item) => (
          <GlassSurface
            key={item.cat}
            radius={999}
            interactive
            onPress={() => handleSendTest(item.cat, item.label)}
            contentStyle={styles.testPill}>
            <Ionicons name={item.icon} size={14} color={theme.textSecondary} />
            <Text style={[styles.testPillText, { color: theme.text }]}>{item.label}</Text>
          </GlassSurface>
        ))}
      </View>

      {notificationHistory.length > 0 && (
        <>
          <SectionHeader
            title={`Ostatnie alerty (${notificationHistory.length})`}
            actionLabel="Wyczyść"
            onActionPress={clearNotificationHistory}
          />
          {notificationHistory.slice(0, 4).map((ev, idx) => (
            <ListRow
              key={ev.id}
              dense
              title={ev.title}
              subtitle={ev.body}
              left={
                <Ionicons
                  name={categoryIcon(ev.category)}
                  size={16}
                  color={theme.textSecondary}
                />
              }
              rightText={ev.createdAt}
              showDivider={idx < Math.min(4, notificationHistory.length) - 1}
            />
          ))}
        </>
      )}

      {/* 4. BEZPIECZEŃSTWO PIN & FACE ID */}
      <SectionHeader
        title="Bezpieczeństwo (PIN / Face ID)"
        rightText={securityEnabled ? 'AKTYWNA' : 'WYŁĄCZONA'}
      />

      <ListRow
        dense
        title={
          securityEnabled
            ? 'Blokada 4-cyfrowym kodem PIN'
            : 'Ustaw 4-cyfrowy kod PIN i Face ID'
        }
        subtitle={
          securityEnabled
            ? 'Chroni dostęp do ocen, płatności i mLegitymacji'
            : 'Włącz blokadę przy uruchomieniu aplikacji'
        }
        left={<Ionicons name="keypad-outline" size={18} color={theme.textSecondary} />}
        rightBadge={securityEnabled ? 'WYŁĄCZ' : 'USTAW'}
        rightBadgeColor={securityEnabled ? theme.danger : undefined}
        showDivider={securityEnabled}
        onPress={() => {
          if (securityEnabled) {
            configureSecurity({ enabled: false, pin: '', biometrics: false });
          } else {
            useUsosStore.setState({ securityConfigured: false });
          }
        }}
      />

      {securityEnabled && (
        <>
          <ListRow
            dense
            title="Odblokowywanie przez Face ID"
            subtitle="Automatyczne logowanie biometryczne przy starcie"
            left={<Ionicons name="scan-outline" size={18} color={theme.textSecondary} />}
            right={
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
                trackColor={switchTrack}
              />
            }
          />

          <ListRow
            dense
            title="Zmień 4-cyfrowy kod PIN"
            left={<Ionicons name="create-outline" size={18} color={theme.textSecondary} />}
            showChevron
            onPress={() => useUsosStore.setState({ securityConfigured: false })}
          />

          <ListRow
            dense
            title="Zablokuj aplikację teraz"
            left={<Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} />}
            showChevron
            showDivider={false}
            onPress={lockSession}
          />
        </>
      )}

      {/* 5. KONTO USOS I SYNCHRONIZACJA */}
      <SectionHeader
        title="Konto USOS i uczelnia"
        rightText={`SYNC ${lastSyncedAt || '—'}`}
      />

      <ListRow
        dense
        title={isSyncing ? 'Synchronizowanie danych z USOS...' : 'Odśwież dane z USOS'}
        subtitle={
          syncStatusHint ||
          'Dane odświeżają się automatycznie przy starcie i w tle (limit: 1× / 60 s)'
        }
        left={<Ionicons name="sync-outline" size={18} color={theme.text} />}
        rightText={isSyncing ? '...' : lastSyncedAt || undefined}
        showChevron={!isSyncing}
        onPress={isSyncing ? undefined : handleManualSync}
      />

      <ListRow
        dense
        title={`Zmień uczelnię (${selectedInstallation.shortName})`}
        left={<Ionicons name="business-outline" size={18} color={theme.textSecondary} />}
        showChevron
        onPress={() => router.push('/login')}
      />

      <ListRow
        dense
        title="Klucze OAuth 1.0a, PIN i diagnostyka"
        left={<Ionicons name="key-outline" size={18} color={theme.textSecondary} />}
        showChevron
        onPress={() => router.push('/modal/api-config')}
      />

      <ListRow
        dense
        destructive
        title="Wyloguj z konta USOS"
        left={<Ionicons name="log-out-outline" size={18} color={theme.danger} />}
        showChevron
        onPress={async () => {
          await logout();
          router.replace('/login');
        }}
      />

      <ListRow
        dense
        destructive
        title="Usuń wszystkie dane z urządzenia"
        subtitle="Czyści sesję, PIN, historię alertów i ustawienia"
        left={<Ionicons name="trash-outline" size={18} color={theme.danger} />}
        showChevron
        showDivider={false}
        onPress={() => {
          Alert.alert(
            'Usuń wszystkie dane',
            'Spowoduje to trwałe usunięcie zaszyfrowanej sesji USOS, kodu PIN, preferencji i historii powiadomień z tego urządzenia. Rift Daily nie przechowuje Twoich danych w żadnej zewnętrznej bazie. Aby cofnąć autoryzację OAuth na uczelni, możesz dodatkowo usunąć aplikację w panelu USOSweb.',
            [
              { text: 'Anuluj', style: 'cancel' },
              {
                text: 'Usuń trwale',
                style: 'destructive',
                onPress: async () => {
                  await deleteAllLocalData();
                  router.replace('/login');
                },
              },
            ]
          );
        }}
      />

      {/* 6. PRYWATNOŚĆ, REGULAMIN I POMOC */}
      <SectionHeader title="Prywatność i pomoc" rightText="RIFT DAILY" />

      <ListRow
        dense
        title="Polityka prywatności (RODO)"
        subtitle="rift-daily.vercel.app/privacy"
        left={<Ionicons name="shield-checkmark-outline" size={18} color={theme.textSecondary} />}
        showChevron
        onPress={() =>
          Linking.openURL('https://rift-daily.vercel.app/privacy').catch(() => {})
        }
      />

      <ListRow
        dense
        title="Regulamin korzystania"
        subtitle="rift-daily.vercel.app/terms"
        left={<Ionicons name="document-text-outline" size={18} color={theme.textSecondary} />}
        showChevron
        onPress={() =>
          Linking.openURL('https://rift-daily.vercel.app/terms').catch(() => {})
        }
      />

      <ListRow
        dense
        title="Pomoc i kontakt"
        subtitle="rift-daily.vercel.app/support"
        left={<Ionicons name="help-circle-outline" size={18} color={theme.textSecondary} />}
        showChevron
        onPress={() =>
          Linking.openURL('https://rift-daily.vercel.app/support').catch(() => {})
        }
      />

      <ListRow
        dense
        title="Kod źródłowy (GitHub)"
        subtitle="github.com/matiqueue/rift-daily"
        left={<Ionicons name="logo-github" size={18} color={theme.text} />}
        showChevron
        showDivider={Platform.OS !== 'ios'}
        onPress={() =>
          Linking.openURL('https://github.com/matiqueue/rift-daily').catch(() => {})
        }
      />

      {Platform.OS !== 'ios' && (
        <ListRow
          dense
          title="Buy me a coffee"
          subtitle="matiqueue-portfolio.vercel.app"
          left={<Ionicons name="cafe-outline" size={18} color={theme.textSecondary} />}
          showChevron
          showDivider={false}
          onPress={() =>
            Linking.openURL('https://matiqueue-portfolio.vercel.app').catch(() => {})
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  firstSection: {
    paddingTop: 10,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  permissionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  permissionAction: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '800',
  },
  leadTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leadTimeLabel: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
  },
  testPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  testPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  testPillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
