import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { Avatar } from '@/components/Avatar';
import { GlassSurface } from '@/components/GlassSurface';
import {
  EditorialFade,
  HairlineDraw,
  ScrambleText,
  TypewriterText,
} from '@/components/KineticText';
import { ListRow } from '@/components/ListRow';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SettingsSection } from '@/components/SettingsSection';
import { UniversityIcon } from '@/components/UniversityIcon';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';

type MoreSection = 'modules' | 'settings';

function parseSectionParam(raw?: string): MoreSection {
  return raw === 'settings' ? 'settings' : 'modules';
}

export default function MoreHubScreen() {
  const { section: sectionParam } = useLocalSearchParams<{ section?: string }>();
  const theme = useAppTheme();

  const user = useUsosStore((s) => s.user);
  const selectedInstallation = useUsosStore((s) => s.selectedInstallation);
  const lastSyncedAt = useUsosStore((s) => s.lastSyncedAt);
  const logout = useUsosStore((s) => s.logout);
  const exams = useUsosStore((s) => s.exams);
  const payments = useUsosStore((s) => s.payments);
  const surveys = useUsosStore((s) => s.surveys);
  const staff = useUsosStore((s) => s.staff);
  const buildings = useUsosStore((s) => s.buildings);
  const notificationPrefs = useUsosStore((s) => s.notificationPrefs);

  const [sectionOverride, setSectionOverride] = useState<{
    forParam: string | undefined;
    value: MoreSection;
  } | null>(null);

  const activeSection: MoreSection =
    sectionOverride && sectionOverride.forParam === sectionParam
      ? sectionOverride.value
      : parseSectionParam(sectionParam);

  const setActiveSection = (next: MoreSection) => {
    setSectionOverride({ forParam: sectionParam, value: next });
  };

  const hapticTap = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const pendingSurveys = useMemo(
    () => surveys.filter((s) => !s.filled_out).length,
    [surveys]
  );
  const unpaidCount = useMemo(
    () => payments.filter((p) => p.status === 'unpaid' && p.amount > 0).length,
    [payments]
  );

  const activeNotifCount = [
    notificationPrefs.classChanges,
    notificationPrefs.classReminders,
    notificationPrefs.newGrades,
    notificationPrefs.tasksAndExams,
    notificationPrefs.paymentsAndInstallments,
    notificationPrefs.surveys,
  ].filter(Boolean).length;

  // 4 core modules rendered in an open hairline 2x2 editorial matrix (no boxy cards)
  const matrixQuadrants = useMemo(
    () => [
      {
        slug: 'payments',
        title: 'Płatności',
        subtitle: 'Saldo i rachunek IBAN',
        icon: 'wallet-outline' as const,
        value: unpaidCount > 0 ? `${unpaidCount} RATA` : '0 PLN',
        alert: unpaidCount > 0,
      },
      {
        slug: 'exams',
        title: 'Egzaminy',
        subtitle: 'Sesja i terminy',
        icon: 'calendar-clear-outline' as const,
        value: String(exams.length),
        alert: false,
      },
      {
        slug: 'staff',
        title: 'Kadra',
        subtitle: 'Konsultacje i e-mail',
        icon: 'people-outline' as const,
        value: String(staff.length),
        alert: false,
      },
      {
        slug: 'surveys',
        title: 'Ankiety',
        subtitle: 'Ocena zajęć USOS',
        icon: 'chatbox-ellipses-outline' as const,
        value: pendingSurveys > 0 ? `${pendingSurveys} NOWE` : '0',
        alert: pendingSurveys > 0,
      },
    ],
    [unpaidCount, exams.length, staff.length, pendingSurveys]
  );

  const secondaryModules = useMemo(
    () => [
      {
        slug: 'buildings',
        title: 'Budynki i kampus',
        subtitle: 'Lokalizacje i adresy wydziałów',
        icon: 'map-outline' as const,
        badge: `${buildings.length}`,
      },
      {
        slug: 'registrations',
        title: 'Rejestracje na przedmioty',
        subtitle: 'Tury zapisów i rejestracja żetonowa',
        icon: 'checkbox-outline' as const,
        badge: 'USOS',
      },
      {
        slug: 'thesis',
        title: 'Dyplom (APD) i sprawy',
        subtitle: 'Praca dyplomowa, akademik i obiegówka',
        icon: 'ribbon-outline' as const,
        badge: 'APD',
      },
    ],
    [buildings.length]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <AmbientBackdrop variant="more" />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Clean Editorial Header (matching Dziś & Plan) */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TypewriterText
              text={`RIFT DAILY · ${selectedInstallation.shortName}`}
              speedMs={18}
              startDelayMs={30}
              style={[styles.monoOverline, { color: theme.textMuted }]}
              numberOfLines={1}
            />
            <Text style={[styles.title, { color: theme.text }]}>Więcej</Text>
          </View>

          <GlassSurface
            radius={999}
            interactive
            onPress={() => setActiveSection('settings')}
            contentStyle={styles.notifStatusPill}>
            <Ionicons
              name={
                notificationPrefs.enabled ? 'notifications-outline' : 'notifications-off-outline'
              }
              size={13}
              color={notificationPrefs.enabled ? theme.text : theme.textMuted}
            />
            <Text
              style={[
                styles.notifStatusText,
                { color: notificationPrefs.enabled ? theme.text : theme.textMuted },
              ]}>
              {notificationPrefs.enabled ? `${activeNotifCount}/6` : 'OFF'}
            </Text>
          </GlassSurface>
        </View>

        {/* Sliding Switcher */}
        <View style={styles.segmentWrap}>
          <SegmentedControl<MoreSection>
            options={[
              { label: 'Moduły', value: 'modules', badge: 8 },
              { label: 'Ustawienia', value: 'settings' },
            ]}
            value={activeSection}
            onChange={setActiveSection}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Open Editorial Student Hero (identical visual DNA to Dziś Live Hero) */}
          <EditorialFade delayMs={25}>
            <Pressable
              onPress={() => {
                hapticTap();
                router.push('/modal/module/mcard');
              }}
              style={({ pressed }) => [styles.studentHeroWrap, pressed && { opacity: 0.78 }]}>
              <HairlineDraw color={theme.separator} delayMs={20} />

              <View style={styles.studentHeroInner}>
                <View style={styles.studentTopRow}>
                  <View style={styles.avatarWrap}>
                    <Avatar
                      name={`${user.first_name} ${user.last_name}`}
                      uri={user.photo_url}
                      size={46}
                      borderColor={theme.cardBorder}
                      variant="student"
                    />
                    <View style={styles.uniOverlay}>
                      <UniversityIcon installation={selectedInstallation} size={17} />
                    </View>
                  </View>

                  <View style={styles.identityTextCol}>
                    <Text style={[styles.identityName, { color: theme.text }]} numberOfLines={1}>
                      {user.first_name} {user.last_name}
                    </Text>
                    <Text style={[styles.identitySub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {user.programmes[0]?.name.pl || selectedInstallation.namePl}
                    </Text>
                  </View>

                  <View style={[styles.elsPrimaryPill, { backgroundColor: theme.primary }]}>
                    <ScrambleText
                      text="ELS"
                      durationMs={280}
                      style={[styles.elsPrimaryText, { color: theme.primaryContrast }]}
                    />
                    <Ionicons name="chevron-forward" size={12} color={theme.primaryContrast} />
                  </View>
                </View>

                {/* 3-Column Open Student Telemetry Row */}
                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryCell}>
                    <Text style={[styles.telemetryLabel, { color: theme.textMuted }]}>ALBUM</Text>
                    <Text style={[styles.telemetryValue, { color: theme.text }]} numberOfLines={1}>
                      #{user.student_number}
                    </Text>
                  </View>

                  <View style={[styles.telemetryDivider, { backgroundColor: theme.separator }]} />

                  <View style={styles.telemetryCell}>
                    <Text style={[styles.telemetryLabel, { color: theme.textMuted }]}>SEMESTR</Text>
                    <Text style={[styles.telemetryValue, { color: theme.text }]} numberOfLines={1}>
                      {user.current_term_id}
                    </Text>
                  </View>

                  <View style={[styles.telemetryDivider, { backgroundColor: theme.separator }]} />

                  <View style={styles.telemetryCell}>
                    <Text style={[styles.telemetryLabel, { color: theme.textMuted }]}>SYNC</Text>
                    <Text
                      style={[styles.telemetryValue, { color: theme.textSecondary }]}
                      numberOfLines={1}>
                      {lastSyncedAt || '—'}
                    </Text>
                  </View>
                </View>
              </View>

              <HairlineDraw color={theme.separator} delayMs={80} />
            </Pressable>
          </EditorialFade>

          {activeSection === 'modules' ? (
            <>
              {/* Open Hairline 2x2 Editorial Matrix (NO boxy cards — crisp hairline cross grid) */}
              <View style={styles.matrixWrap}>
                {[matrixQuadrants.slice(0, 2), matrixQuadrants.slice(2, 4)].map(
                  (rowItems, rowIdx) => (
                    <View
                      key={rowIdx}
                      style={[
                        styles.matrixRow,
                        rowIdx === 0 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.separator,
                        },
                      ]}>
                      {rowItems.map((item, colIdx) => (
                        <Pressable
                          key={item.slug}
                          onPress={() => {
                            hapticTap();
                            router.push(`/modal/module/${item.slug}`);
                          }}
                          style={({ pressed }) => [
                            styles.matrixCell,
                            colIdx === 0
                              ? {
                                  paddingRight: 14,
                                  borderRightWidth: StyleSheet.hairlineWidth,
                                  borderRightColor: theme.separator,
                                }
                              : { paddingLeft: 14 },
                            pressed && { opacity: 0.65 },
                          ]}>
                          <View style={styles.matrixCellTop}>
                            <Ionicons name={item.icon} size={17} color={theme.textSecondary} />
                            <Text
                              style={[
                                styles.matrixMetric,
                                { color: item.alert ? theme.warning : theme.text },
                              ]}
                              numberOfLines={1}>
                              {item.value}
                            </Text>
                          </View>

                          <View style={styles.matrixCellBottom}>
                            <Text style={[styles.matrixTitle, { color: theme.text }]} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text
                              style={[styles.matrixSub, { color: theme.textMuted }]}
                              numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )
                )}
              </View>

              {/* Secondary Modules — Clean Hairline Rows */}
              <SectionHeader title="Pozostałe moduły" />
              {secondaryModules.map((m, idx) => (
                <ListRow
                  key={m.slug}
                  dense
                  title={m.title}
                  subtitle={m.subtitle}
                  left={<Ionicons name={m.icon} size={18} color={theme.textSecondary} />}
                  rightBadge={m.badge}
                  showChevron
                  showDivider={idx < secondaryModules.length - 1}
                  onPress={() => router.push(`/modal/module/${m.slug}`)}
                />
              ))}

              {/* Connection & Account */}
              <SectionHeader
                title="Połączenie i sesja"
                rightText={`SYNC ${lastSyncedAt || '—'}`}
              />
              <ListRow
                dense
                title="Ustawienia powiadomień, motywu i PIN"
                left={<Ionicons name="settings-outline" size={18} color={theme.textSecondary} />}
                showChevron
                onPress={() => setActiveSection('settings')}
              />
              <ListRow
                dense
                title="Autoryzacja PIN i diagnostyka API"
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
                showDivider={false}
                onPress={async () => {
                  await logout();
                  router.replace('/login');
                }}
              />
            </>
          ) : (
            <SettingsSection />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  monoOverline: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 1,
  },
  notifStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  notifStatusText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  segmentWrap: {
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 112,
  },
  studentHeroWrap: {
    marginBottom: 4,
  },
  studentHeroInner: {
    paddingVertical: 14,
    gap: 14,
  },
  studentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  uniOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -3,
  },
  identityTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  identityName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  identitySub: {
    fontSize: 12,
  },
  elsPrimaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 0,
  },
  elsPrimaryText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  telemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
  },
  telemetryCell: {
    flex: 1,
    gap: 2,
  },
  telemetryLabel: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  telemetryValue: {
    fontFamily: MONO_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  telemetryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    marginHorizontal: 10,
  },
  matrixWrap: {
    marginTop: 4,
  },
  matrixRow: {
    flexDirection: 'row',
  },
  matrixCell: {
    flex: 1,
    paddingVertical: 15,
    justifyContent: 'space-between',
    gap: 14,
  },
  matrixCellTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  matrixMetric: {
    fontFamily: MONO_FONT,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  matrixCellBottom: {
    gap: 1.5,
  },
  matrixTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  matrixSub: {
    fontSize: 11.5,
  },
});
