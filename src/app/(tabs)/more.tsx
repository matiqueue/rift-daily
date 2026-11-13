import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/GlassCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { UniversityIcon } from '@/components/UniversityIcon';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT, ThemeMode } from '@/theme/theme';

export default function MoreHubScreen() {
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
  const exams = useUsosStore((s) => s.exams);
  const payments = useUsosStore((s) => s.payments);
  const surveys = useUsosStore((s) => s.surveys);
  const staff = useUsosStore((s) => s.staff);
  const buildings = useUsosStore((s) => s.buildings);

  const pendingSurveys = surveys.filter((s) => !s.filled_out).length;
  const unpaidCount = payments.filter((p) => p.status === 'unpaid').length;

  const modules = [
    {
      slug: 'mcard',
      title: 'mLegitymacja Studencka (ELS)',
      subtitle: 'Zdjęcie, status studenta i kod karty',
      icon: 'id-card-outline' as const,
      badge: 'AKTYWNA',
    },
    {
      slug: 'staff',
      title: 'Twoi Wykładowcy i Katalog Kadry',
      subtitle: 'Zdjęcia, tytuły naukowe, konsultacje i e-mail',
      icon: 'people-outline' as const,
      badge: `${staff.length}`,
    },
    {
      slug: 'exams',
      title: 'Egzaminy i Sesja',
      subtitle: 'Terminy egzaminów i protokoły sesyjne',
      icon: 'calendar-clear-outline' as const,
      badge: `${exams.length}`,
    },
    {
      slug: 'payments',
      title: 'Płatności i Konto Uczelniane',
      subtitle: 'Rozliczenia ze studiów i numer IBAN',
      icon: 'wallet-outline' as const,
      badge: unpaidCount > 0 ? `${unpaidCount}` : '0 PLN',
    },
    {
      slug: 'surveys',
      title: 'Ankiety Oceny Zajęć',
      subtitle: 'Anonimowe ankiety studenckie w USOS',
      icon: 'chatbox-ellipses-outline' as const,
      badge: `${pendingSurveys}`,
    },
    {
      slug: 'buildings',
      title: 'Budynki i Kampus Uczelni',
      subtitle: 'Lokalizacje budynków dydaktycznych',
      icon: 'map-outline' as const,
      badge: `${buildings.length}`,
    },
    {
      slug: 'registrations',
      title: 'Rejestracje na Przedmioty',
      subtitle: 'Tury zapisów na przedmioty i do grup',
      icon: 'checkbox-outline' as const,
      badge: 'USOS',
    },
    {
      slug: 'thesis',
      title: 'Dyplom (APD), Akademik i Obiegówka',
      subtitle: 'Archiwum Prac Dyplomowych i rozliczenia',
      icon: 'ribbon-outline' as const,
      badge: 'APD',
    },
  ];

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
              tintColor={theme.text}
            />
          }>
          <View>
            <Text style={[styles.monoOverline, { color: theme.accent }]}>
              RIFT DAILY // E-DZIENNIK USOS
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>Moduły uczelniane</Text>
          </View>

          {/* Student & University Profile Card with Photo */}
          <GlassCard elevated style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={{ position: 'relative' }}>
                <Avatar
                  name={`${user.first_name} ${user.last_name}`}
                  uri={user.photo_url}
                  size={58}
                  borderColor={theme.cardBorder}
                  variant="student"
                />
                <View style={{ position: 'absolute', bottom: -3, right: -4 }}>
                  <UniversityIcon installation={selectedInstallation} size={24} />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.profileName, { color: theme.text }]}>
                  {user.first_name} {user.last_name}
                </Text>
                <Text style={[styles.profileMeta, { color: theme.textSecondary }]}>
                  #{user.student_number} // {selectedInstallation.shortName}
                </Text>
                <Text style={[styles.profileUni, { color: theme.textSecondary }]} numberOfLines={1}>
                  {user.programmes[0]?.name.pl || selectedInstallation.namePl}
                </Text>
              </View>
            </View>

            <View style={[styles.syncStrip, { borderTopColor: theme.separator }]}>
              <Text style={[styles.syncText, { color: theme.textSecondary }]}>
                SYNC: {lastSyncedAt || 'TERAZ'}
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/settings')}>
                <Text style={[styles.switchUniLink, { color: theme.accent }]}>
                  USTAWIENIA I POWIADOMIENIA →
                </Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* Theme Switcher Card (Jasny / Ciemny / Systemowy) */}
          <GlassCard style={{ gap: 10 }}>
            <View style={styles.themeTopRow}>
              <Text style={[styles.sectionMono, { color: theme.textSecondary }]}>
                MOTYW KOLORYSTYCZNY (JASNY / CIEMNY)
              </Text>
              <Ionicons
                name={theme.isDark ? 'moon-outline' : 'sunny-outline'}
                size={16}
                color={theme.warning}
              />
            </View>
            <SegmentedControl<ThemeMode>
              options={[
                { label: 'Ciemny (Dark)', value: 'dark' },
                { label: 'Jasny (Light)', value: 'light' },
                { label: 'Auto', value: 'system' },
              ]}
              value={themeMode}
              onChange={(m) => setThemeMode(m)}
            />
          </GlassCard>

          {/* PIN & Face ID Biometric Security Card */}
          <GlassCard style={{ gap: 10 }}>
            <View style={styles.themeTopRow}>
              <Text style={[styles.sectionMono, { color: theme.accent }]}>
                OCHRONA PIN / FACE ID
              </Text>
              <Ionicons
                name={securityEnabled ? 'shield-checkmark' : 'shield-outline'}
                size={16}
                color={securityEnabled ? theme.success : theme.textMuted}
              />
            </View>

            <Pressable
              onPress={() => {
                if (securityEnabled) {
                  configureSecurity({ enabled: false, pin: '', biometrics: false });
                } else {
                  useUsosStore.setState({ securityConfigured: false });
                }
              }}
              style={styles.settingRowFirst}>
              <Ionicons
                name="keypad-outline"
                size={18}
                color={securityEnabled ? theme.success : theme.text}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingText, { color: theme.text }]}>
                  {securityEnabled
                    ? 'Kod PIN i Face ID są aktywne'
                    : 'Skonfiguruj 4-cyfrowy kod PIN i Face ID'}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                  {securityEnabled
                    ? 'Dotknij, aby wyłączyć lub zresetować kod PIN'
                    : 'Domyślna blokada przy uruchomieniu aplikacji'}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: MONO_FONT,
                  fontSize: 11,
                  fontWeight: '800',
                  color: securityEnabled ? theme.danger : theme.accent,
                }}>
                {securityEnabled ? 'WYŁĄCZ' : 'USTAW PIN'}
              </Text>
            </Pressable>

            {securityEnabled && (
              <>
                <Pressable
                  onPress={() =>
                    configureSecurity({
                      enabled: true,
                      pin: securityPin,
                      biometrics: !biometricsEnabled,
                    })
                  }
                  style={[styles.settingRow, { borderTopColor: theme.separator }]}>
                  <Ionicons name="scan-outline" size={18} color={theme.accent} />
                  <Text style={[styles.settingText, { color: theme.text }]}>
                    Odblokowywanie przez Face ID / Touch ID
                  </Text>
                  <Ionicons
                    name={biometricsEnabled ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={biometricsEnabled ? theme.success : theme.textMuted}
                  />
                </Pressable>

                <Pressable
                  onPress={lockSession}
                  style={[styles.settingRow, { borderTopColor: theme.separator }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.warning} />
                  <Text style={[styles.settingText, { color: theme.text }]}>
                    Zablokuj aplikację teraz
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </Pressable>
              </>
            )}
          </GlassCard>

          {/* Modules List */}
          <Text style={[styles.sectionMono, { color: theme.textSecondary, marginTop: 4 }]}>
            WSZYSTKIE MODUŁY USOS API
          </Text>

          <View style={styles.modulesStack}>
            {modules.map((m) => (
              <GlassCard
                key={m.slug}
                padding={14}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.selectionAsync().catch(() => {});
                  }
                  router.push(`/modal/module/${m.slug}`);
                }}>
                <View style={styles.modRow}>
                  <View
                    style={[
                      styles.modIconBox,
                      {
                        backgroundColor: theme.bgSecondary,
                        borderColor: theme.cardBorder,
                      },
                    ]}>
                    <Ionicons name={m.icon} size={20} color={theme.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modTitle, { color: theme.text }]} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <Text
                      style={[styles.modSubtitle, { color: theme.textSecondary }]}
                      numberOfLines={1}>
                      {m.subtitle}
                    </Text>
                  </View>
                  <View style={styles.modRight}>
                    <View
                      style={[
                        styles.modBadge,
                        {
                          backgroundColor: theme.bgSecondary,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Text style={[styles.modBadgeText, { color: theme.text }]}>
                        {m.badge}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>

          {/* Account Actions */}
          <Text style={[styles.sectionMono, { color: theme.textSecondary, marginTop: 4 }]}>
            POŁĄCZENIE I KONTO USOS
          </Text>

          <GlassCard style={{ gap: 12 }}>
            <Pressable onPress={syncFromLiveApi} style={styles.settingRowFirst}>
              <Ionicons name="sync-outline" size={18} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>
                Odśwież wszystkie dane z USOS API
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/modal/api-config')}
              style={[styles.settingRow, { borderTopColor: theme.separator }]}>
              <Ionicons name="key-outline" size={18} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>
                Autoryzacja PIN i diagnostyka serwera USOS
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </Pressable>

            <Pressable
              onPress={async () => {
                await logout();
                router.replace('/login');
              }}
              style={[styles.settingRow, { borderTopColor: theme.separator }]}>
              <Ionicons name="log-out-outline" size={18} color={theme.danger} />
              <Text style={[styles.settingText, { color: theme.danger }]}>
                Wyloguj z konta USOS i wróć do wyboru uczelni
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.danger} />
            </Pressable>
          </GlassCard>
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
    paddingBottom: 118,
    gap: 12,
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
  profileCard: {
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
  },
  profileMeta: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  profileUni: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  syncStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
  },
  syncText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    flex: 1,
  },
  switchUniLink: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
  },
  themeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionMono: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  modulesStack: {
    gap: 8,
  },
  modRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  modSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
  },
  modBadgeText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  settingRowFirst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
});
