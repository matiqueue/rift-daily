import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { GlobalSearchModal } from '@/components/GlobalSearchModal';
import { GradeBadge } from '@/components/GradeBadge';
import {
  EditorialFade,
  HairlineDraw,
  LivePulseDot,
  ScrambleText,
  TypewriterText,
} from '@/components/KineticText';
import { ListRow } from '@/components/ListRow';
import { MetricStrip } from '@/components/MetricStrip';
import { ScheduleGapRow, ScheduleTimelineRow } from '@/components/ScheduleTimelineRow';
import { SectionHeader } from '@/components/SectionHeader';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';
import {
  formatDurationPl,
  formatPolishDateHeader,
  formatShortDatePl,
  getClassTypeShort,
  getGapMinutes,
  getNextClassHighlight,
  toLocalIsoDate,
} from '@/utils/timetableUtils';

export default function TodayJournalScreen() {
  const theme = useAppTheme();
  const user = useUsosStore((s) => s.user);
  const selectedInstallation = useUsosStore((s) => s.selectedInstallation);
  const timetable = useUsosStore((s) => s.timetable);
  const upcomingTimetable = useUsosStore((s) => s.upcomingTimetable);
  const grades = useUsosStore((s) => s.grades);
  const courses = useUsosStore((s) => s.courses);
  const exams = useUsosStore((s) => s.exams);
  const payments = useUsosStore((s) => s.payments);
  const lockSession = useUsosStore((s) => s.lockSession);
  const securityEnabled = useUsosStore((s) => s.securityEnabled);

  const [searchVisible, setSearchVisible] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hapticTap = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const dateHeader = useMemo(() => formatPolishDateHeader(now), [now]);

  const weightedGpa = useMemo(() => {
    let weightedSum = 0;
    let ectsSum = 0;
    let simpleSum = 0;
    let simpleCount = 0;
    for (const g of grades) {
      if (g.value_numeric !== null) {
        simpleSum += g.value_numeric;
        simpleCount++;
        if (g.ects > 0) {
          weightedSum += g.value_numeric * g.ects;
          ectsSum += g.ects;
        }
      }
    }
    if (ectsSum > 0) return (weightedSum / ectsSum).toFixed(2);
    if (simpleCount > 0) return (simpleSum / simpleCount).toFixed(2);
    return '—';
  }, [grades]);

  const totalEcts = useMemo(() => {
    const courseEcts = courses.reduce((acc, c) => acc + (c.ects || 0), 0);
    if (courseEcts > 0) return courseEcts;
    const gradeEcts = grades.reduce((acc, g) => acc + (g.ects || 0), 0);
    return gradeEcts > 0 ? gradeEcts : courses.length * 3;
  }, [courses, grades]);

  const effectiveUpcoming = useMemo(
    () => (upcomingTimetable.length > 0 ? upcomingTimetable : timetable),
    [upcomingTimetable, timetable]
  );

  const nextClassInfo = useMemo(
    () => getNextClassHighlight(effectiveUpcoming, now),
    [effectiveUpcoming, now]
  );

  const { agendaItems, agendaIsToday, agendaDayLabel } = useMemo(() => {
    const todayIso = toLocalIsoDate(now);
    const todayItems = effectiveUpcoming
      .filter((t) => t.date === todayIso)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    if (todayItems.length > 0) {
      return {
        agendaItems: todayItems,
        agendaIsToday: true,
        agendaDayLabel: 'DZISIEJSZY PLAN',
      };
    }

    if (nextClassInfo && nextClassInfo.daySchedule.length > 0) {
      const shortDate = formatShortDatePl(nextClassInfo.activity.date);
      return {
        agendaItems: nextClassInfo.daySchedule,
        agendaIsToday: nextClassInfo.isToday,
        agendaDayLabel: nextClassInfo.isToday
          ? 'DZISIEJSZY PLAN'
          : `NAJBLIŻSZY DZIEŃ · ${nextClassInfo.dayNamePl.toUpperCase()}${
              shortDate ? ` ${shortDate}` : ''
            }`,
      };
    }

    return {
      agendaItems: [],
      agendaIsToday: true,
      agendaDayLabel: 'DZISIEJSZY PLAN',
    };
  }, [effectiveUpcoming, nextClassInfo, now]);

  const unpaidPayments = useMemo(
    () => payments.filter((p) => p.status === 'unpaid' && p.amount > 0),
    [payments]
  );

  const totalUnpaidAmount = useMemo(
    () => unpaidPayments.reduce((sum, p) => sum + p.amount, 0),
    [unpaidPayments]
  );

  const upcomingExams = useMemo(() => {
    const todayIso = toLocalIsoDate(now);
    return [...exams]
      .filter((e) => !e.date || e.date >= todayIso)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .slice(0, 1);
  }, [exams, now]);

  const recentGrades = useMemo(
    () => grades.slice(0, upcomingExams.length > 0 ? 3 : 4),
    [grades, upcomingExams.length]
  );

  const quickPills = useMemo(
    () => [
      { label: 'mLegitymacja', icon: 'id-card-outline' as const, slug: 'mcard', alert: false },
      {
        label: 'Egzaminy',
        icon: 'calendar-clear-outline' as const,
        slug: 'exams',
        alert: upcomingExams.length > 0,
      },
      {
        label: 'Płatności',
        icon: 'wallet-outline' as const,
        slug: 'payments',
        alert: unpaidPayments.length > 0,
      },
      { label: 'Kadra', icon: 'people-outline' as const, slug: 'staff', alert: false },
    ],
    [upcomingExams.length, unpaidPayments.length]
  );

  const spotlightAfterGap = useMemo(() => {
    if (!nextClassInfo?.afterActivity) return 0;
    return getGapMinutes(nextClassInfo.activity, nextClassInfo.afterActivity);
  }, [nextClassInfo]);

  const headerTagLine = `${dateHeader.shortTag} · ${selectedInstallation.shortName}`;

  const dynamicBrief = useMemo(() => {
    if (nextClassInfo?.isOngoing) {
      return `Trwa teraz · ${nextClassInfo.countdownLabel.toLowerCase()}`;
    }
    if (agendaIsToday && agendaItems.length > 0) {
      const span = `${agendaItems[0].start_time}–${agendaItems[agendaItems.length - 1].end_time}`;
      return `${agendaItems.length} zajęcia dziś · ${span}`;
    }
    if (nextClassInfo) {
      return `Dziś wolne · następne w ${nextClassInfo.dayNamePl.toLowerCase()} o ${nextClassInfo.activity.start_time}`;
    }
    return 'Brak zaplanowanych zajęć w najbliższych dniach';
  }, [nextClassInfo, agendaIsToday, agendaItems]);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <AmbientBackdrop variant="today" />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* STICKY TOP HEADER ("Cześć, Szymon" pinned cleanly above scroll) */}
        <View style={[styles.stickyHeader, { borderBottomColor: theme.separator }]}>
          <View style={styles.topUtilityBar}>
            <TypewriterText
              text={headerTagLine}
              speedMs={20}
              startDelayMs={40}
              style={[styles.dateMono, { color: theme.textMuted }]}
              numberOfLines={1}
            />

            <View style={styles.headerActions}>
              <GlassSurface
                radius={17}
                interactive
                accessibilityLabel="Szukaj w dzienniku"
                onPress={() => setSearchVisible(true)}
                contentStyle={styles.glassIconBtn}>
                <Ionicons name="search" size={15} color={theme.text} />
              </GlassSurface>

              <GlassSurface
                radius={17}
                interactive
                accessibilityLabel="Ustawienia"
                onPress={() =>
                  router.push({ pathname: '/(tabs)/more', params: { section: 'settings' } })
                }
                contentStyle={styles.glassIconBtn}>
                <Ionicons name="settings-outline" size={15} color={theme.textSecondary} />
              </GlassSurface>

              {securityEnabled && (
                <GlassSurface
                  radius={17}
                  interactive
                  accessibilityLabel="Zablokuj aplikację"
                  onPress={lockSession}
                  contentStyle={styles.glassIconBtn}>
                  <Ionicons name="lock-closed-outline" size={14} color={theme.textSecondary} />
                </GlassSurface>
              )}

              <Pressable
                onPress={() => {
                  hapticTap();
                  router.push('/modal/module/mcard');
                }}
                accessibilityLabel="Otwórz mLegitymację"
                style={({ pressed }) => [pressed && { opacity: 0.72 }]}>
                <Avatar
                  name={`${user.first_name} ${user.last_name}`}
                  uri={user.photo_url}
                  size={34}
                  borderColor={theme.cardBorder}
                  variant="student"
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.greetingBlock}>
            <Text style={[styles.greetingTitle, { color: theme.text }]} numberOfLines={1}>
              Cześć, {user.first_name}
            </Text>
            <Text style={[styles.briefSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {dynamicBrief}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* 3. FLIGHTY-STYLE GLANCEABLE LIVE HERO (Pure Open Typography + Telemetry Row) */}
          <EditorialFade delayMs={30}>
            {nextClassInfo ? (
              <Pressable
                onPress={() => {
                  hapticTap();
                  router.push(`/modal/course/${nextClassInfo.activity.course_id}`);
                }}
                style={({ pressed }) => [
                  styles.spotlightWrap,
                  pressed && { opacity: 0.76 },
                ]}>
                <HairlineDraw color={theme.separator} delayMs={20} />

                <View style={styles.spotlightInner}>
                  <View style={styles.spotlightTopRow}>
                    <View style={styles.spotlightLabelRow}>
                      <LivePulseDot
                        color={nextClassInfo.isOngoing ? theme.success : theme.text}
                        size={6}
                        active={nextClassInfo.isOngoing}
                      />
                      <Text
                        style={[
                          styles.spotlightOverline,
                          { color: nextClassInfo.isOngoing ? theme.success : theme.textMuted },
                        ]}>
                        {nextClassInfo.isOngoing ? 'TRWA TERAZ' : 'NASTĘPNE ZAJĘCIA'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.countdownPill,
                        {
                          backgroundColor: nextClassInfo.isOngoing
                            ? theme.successSoft
                            : theme.primary,
                        },
                      ]}>
                      <ScrambleText
                        text={nextClassInfo.statusBadge}
                        durationMs={340}
                        style={[
                          styles.countdownPillText,
                          {
                            color: nextClassInfo.isOngoing
                              ? theme.success
                              : theme.primaryContrast,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <Text style={[styles.spotlightTitle, { color: theme.text }]} numberOfLines={2}>
                    {nextClassInfo.activity.course_name.pl}
                  </Text>

                  {/* High-utility 3-column Flighty glance row: TIME | ROOM | TYPE */}
                  <View style={styles.telemetryGrid}>
                    <View style={styles.telemetryCell}>
                      <Text style={[styles.telemetryLabel, { color: theme.textMuted }]}>
                        GODZINA
                      </Text>
                      <Text style={[styles.telemetryValue, { color: theme.text }]}>
                        {nextClassInfo.activity.start_time}–{nextClassInfo.activity.end_time}
                      </Text>
                    </View>

                    <View
                      style={[styles.telemetryDivider, { backgroundColor: theme.separator }]}
                    />

                    <View style={styles.telemetryCell}>
                      <Text style={[styles.telemetryLabel, { color: theme.textMuted }]}>
                        SALA
                      </Text>
                      <Text
                        style={[styles.telemetryValue, { color: theme.text }]}
                        numberOfLines={1}>
                        {nextClassInfo.activity.room_number || '—'}
                      </Text>
                    </View>

                    <View
                      style={[styles.telemetryDivider, { backgroundColor: theme.separator }]}
                    />

                    <View style={styles.telemetryCell}>
                      <Text style={[styles.telemetryLabel, { color: theme.textMuted }]}>
                        FORMA
                      </Text>
                      <Text
                        style={[styles.telemetryValue, { color: theme.textSecondary }]}
                        numberOfLines={1}>
                        {getClassTypeShort(nextClassInfo.activity.class_type_id)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.spotlightLecturerRow}>
                    <Avatar
                      name={nextClassInfo.activity.lecturer_name}
                      uri={nextClassInfo.activity.lecturer_photo}
                      size={20}
                    />
                    <Text
                      style={[styles.spotlightLecturerText, { color: theme.textSecondary }]}
                      numberOfLines={1}>
                      {nextClassInfo.activity.lecturer_name}
                      {nextClassInfo.activity.building_name?.pl
                        ? ` · ${nextClassInfo.activity.building_name.pl}`
                        : ''}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                  </View>

                  {nextClassInfo.isOngoing && (
                    <View style={styles.progressWrap}>
                      <View style={[styles.progressTrack, { backgroundColor: theme.bgSecondary }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${nextClassInfo.progressPercent}%`,
                              backgroundColor: theme.success,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressCaption, { color: theme.textSecondary }]}>
                        {nextClassInfo.countdownLabel} · {nextClassInfo.progressPercent}%
                      </Text>
                    </View>
                  )}

                  {nextClassInfo.afterActivity && (
                    <Text style={[styles.afterInline, { color: theme.textMuted }]} numberOfLines={1}>
                      {spotlightAfterGap >= 20
                        ? `Okienko ${formatDurationPl(spotlightAfterGap)} → `
                        : 'Następnie '}
                      <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>
                        {nextClassInfo.afterActivity.start_time}{' '}
                        {nextClassInfo.afterActivity.course_name.pl}
                      </Text>
                      {nextClassInfo.afterActivity.room_number
                        ? ` · s. ${nextClassInfo.afterActivity.room_number}`
                        : ''}
                    </Text>
                  )}
                </View>

                <HairlineDraw color={theme.separator} delayMs={90} />
              </Pressable>
            ) : (
              <View style={[styles.calmNotice, { borderTopColor: theme.separator, borderBottomColor: theme.separator }]}>
                <Ionicons name="checkmark-done-outline" size={17} color={theme.textSecondary} />
                <Text style={[styles.calmNoticeText, { color: theme.textSecondary }]}>
                  Brak nadchodzących zajęć w rozkładzie. Dane aktualizują się automatycznie.
                </Text>
              </View>
            )}
          </EditorialFade>

          {/* 4. OPTIONAL SLIM UNPAID ALERT (Restrained semantic amber) */}
          {unpaidPayments.length > 0 && (
            <Pressable
              onPress={() => {
                hapticTap();
                router.push('/modal/module/payments');
              }}
              style={({ pressed }) => [
                styles.inlineAlertBar,
                { borderBottomColor: theme.separator, opacity: pressed ? 0.72 : 1 },
              ]}>
              <View style={[styles.alertDot, { backgroundColor: theme.warning }]} />
              <Text style={[styles.inlineAlertText, { color: theme.text }]} numberOfLines={1}>
                Rata do zapłaty:{' '}
                <Text style={{ fontFamily: MONO_FONT, fontWeight: '800' }}>
                  {totalUnpaidAmount.toFixed(0)} {unpaidPayments[0].currency}
                </Text>
                {unpaidPayments[0].due_date ? ` · do ${unpaidPayments[0].due_date}` : ''}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
            </Pressable>
          )}

          {/* 5. MONOCHROME LIQUID GLASS QUICK CAPSULES */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPillsRow}
            style={styles.quickPillsScroll}>
            {quickPills.map((pill) => (
              <GlassSurface
                key={pill.slug}
                radius={999}
                interactive
                onPress={() => router.push(`/modal/module/${pill.slug}`)}
                contentStyle={styles.quickPillInner}>
                <Ionicons name={pill.icon} size={14} color={theme.textSecondary} />
                <Text style={[styles.quickPillText, { color: theme.text }]}>{pill.label}</Text>
                {pill.alert && (
                  <View
                    style={[
                      styles.pillNotifDot,
                      {
                        backgroundColor:
                          pill.slug === 'payments' ? theme.warning : theme.text,
                      },
                    ]}
                  />
                )}
              </GlassSurface>
            ))}
          </ScrollView>

          {/* 6. TODAY'S AGENDA TIMELINE */}
          <SectionHeader
            title={agendaDayLabel}
            actionLabel="Pełny plan →"
            onActionPress={() => router.push('/(tabs)/timetable')}
          />

          {agendaItems.length === 0 ? (
            <View style={[styles.emptySection, { borderBottomColor: theme.separator }]}>
              <Text style={[styles.emptySectionTitle, { color: theme.text }]}>
                Wolny dzień od zajęć
              </Text>
              <Text style={[styles.emptySectionSub, { color: theme.textSecondary }]}>
                Sprawdź cały tydzień w zakładce Plan lub odśwież dane z USOS.
              </Text>
            </View>
          ) : (
            <View>
              {agendaItems.map((act, idx) => {
                const prev = idx > 0 ? agendaItems[idx - 1] : null;
                const gapMin = prev ? getGapMinutes(prev, act) : 0;
                return (
                  <React.Fragment key={act.id}>
                    {gapMin >= 20 && <ScheduleGapRow minutes={gapMin} />}
                    <ScheduleTimelineRow
                      activity={act}
                      now={now}
                      compact
                      showDivider={idx < agendaItems.length - 1}
                      onPress={() => router.push(`/modal/course/${act.course_id}`)}
                    />
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* 7. SPACIOUS 3-COLUMN ACADEMIC TELEMETRY STRIP */}
          <SectionHeader
            title="Podsumowanie"
            actionLabel="Dziennik →"
            onActionPress={() =>
              router.push({ pathname: '/(tabs)/grades', params: { tab: 'grades' } })
            }
          />
          <MetricStrip
            items={[
              {
                label: 'Średnia',
                value: weightedGpa,
                onPress: () =>
                  router.push({ pathname: '/(tabs)/grades', params: { tab: 'grades' } }),
              },
              {
                label: 'ECTS',
                value: String(totalEcts),
                onPress: () =>
                  router.push({ pathname: '/(tabs)/grades', params: { tab: 'courses' } }),
              },
              {
                label: 'Kursy',
                value: String(courses.length),
                onPress: () =>
                  router.push({ pathname: '/(tabs)/grades', params: { tab: 'courses' } }),
              },
            ]}
          />

          {/* 8. RECENT ACTIVITY FEED */}
          <SectionHeader
            title="Ostatnie wpisy"
            actionLabel={`Wszystkie (${grades.length}) →`}
            onActionPress={() =>
              router.push({ pathname: '/(tabs)/grades', params: { tab: 'grades' } })
            }
          />

          {recentGrades.length === 0 && upcomingExams.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={[styles.emptySectionTitle, { color: theme.text }]}>
                Brak nowych wpisów w protokołach
              </Text>
              <Text style={[styles.emptySectionSub, { color: theme.textSecondary }]}>
                Nowe oceny i terminy egzaminów pojawią się tutaj po synchronizacji.
              </Text>
            </View>
          ) : (
            <View>
              {upcomingExams.map((ex) => (
                <ListRow
                  key={`exam-${ex.id}`}
                  dense
                  title={ex.course_name}
                  subtitle={`${ex.type} · ${ex.date}${ex.time ? `, ${ex.time}` : ''}${
                    ex.room ? ` · s. ${ex.room}` : ''
                  }`}
                  left={
                    <View style={[styles.examIconBox, { backgroundColor: theme.primarySoft }]}>
                      <Ionicons name="calendar-outline" size={15} color={theme.text} />
                    </View>
                  }
                  rightBadge={ex.is_registered ? 'ZAPISANY' : 'SESJA'}
                  showChevron
                  showDivider={recentGrades.length > 0}
                  onPress={() => router.push('/modal/module/exams')}
                />
              ))}

              {recentGrades.map((grade, idx) => (
                <ListRow
                  key={grade.id}
                  dense
                  title={grade.course_name.pl}
                  subtitle={`${grade.author_name} · ${grade.class_type || `Sem. ${grade.term_id}`}`}
                  left={<GradeBadge symbol={grade.value_symbol} size="xs" />}
                  rightText={grade.date_modified ? grade.date_modified.slice(0, 10) : grade.term_id}
                  showChevron
                  showDivider={idx < recentGrades.length - 1}
                  onPress={() => router.push(`/modal/course/${grade.course_id}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <GlobalSearchModal visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stickyHeader: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 112,
  },
  topUtilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  dateMono: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  glassIconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingBlock: {
    gap: 2,
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  briefSubtitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  spotlightWrap: {
    marginBottom: 4,
  },
  spotlightInner: {
    paddingVertical: 18,
    gap: 10,
  },
  spotlightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  spotlightLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  spotlightOverline: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  countdownPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  countdownPillText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  spotlightTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.55,
    lineHeight: 25,
  },
  telemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  telemetryCell: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  telemetryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    marginRight: 12,
  },
  telemetryLabel: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  telemetryValue: {
    fontFamily: MONO_FONT,
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  spotlightLecturerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spotlightLecturerText: {
    fontSize: 13,
    flex: 1,
  },
  progressWrap: {
    gap: 4,
    marginTop: 2,
  },
  progressTrack: {
    height: 3.5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressCaption: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '600',
  },
  afterInline: {
    fontSize: 12,
    marginTop: 2,
  },
  calmNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  calmNoticeText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
  },
  inlineAlertBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  alertDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  inlineAlertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  quickPillsScroll: {
    marginHorizontal: -18,
    marginTop: 14,
  },
  quickPillsRow: {
    paddingHorizontal: 18,
    gap: 8,
    paddingVertical: 4,
  },
  quickPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 36,
    paddingHorizontal: 14,
  },
  quickPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillNotifDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  examIconBox: {
    width: 34,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySection: {
    paddingVertical: 20,
    gap: 4,
  },
  emptySectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  emptySectionSub: {
    fontSize: 13,
    lineHeight: 18,
  },
});
