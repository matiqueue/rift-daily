import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/GlassCard';
import { GradeBadge } from '@/components/GradeBadge';
import { UniversityIcon } from '@/components/UniversityIcon';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT, ThemeMode } from '@/theme/theme';
import { getNextClassHighlight } from '@/utils/timetableUtils';

export default function DashboardScreen() {
  const theme = useAppTheme();
  const user = useUsosStore((s) => s.user);
  const selectedInstallation = useUsosStore((s) => s.selectedInstallation);
  const isSyncing = useUsosStore((s) => s.isSyncing);
  const syncFromLiveApi = useUsosStore((s) => s.syncFromLiveApi);
  const timetable = useUsosStore((s) => s.timetable);
  const grades = useUsosStore((s) => s.grades);
  const courses = useUsosStore((s) => s.courses);
  const staff = useUsosStore((s) => s.staff);
  const payments = useUsosStore((s) => s.payments);
  const setThemeMode = useUsosStore((s) => s.setThemeMode);
  const lockSession = useUsosStore((s) => s.lockSession);
  const securityEnabled = useUsosStore((s) => s.securityEnabled);

  const [globalSearch, setGlobalSearch] = useState('');

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

  const nextClassInfo = useMemo(() => getNextClassHighlight(timetable), [timetable]);

  const scheduleRows = useMemo(() => {
    if (nextClassInfo && nextClassInfo.daySchedule.length > 0) {
      return nextClassInfo.daySchedule.slice(0, 6);
    }
    const nowDay = new Date().getDay();
    const targetDay = nowDay === 0 || nowDay === 6 ? 1 : nowDay;
    const todayClasses = timetable.filter((t) => t.day_of_week === targetDay);
    if (todayClasses.length > 0) return todayClasses.slice(0, 6);
    return timetable.slice(0, 6);
  }, [timetable, nextClassInfo]);

  const nextActivity = nextClassInfo?.activity || scheduleRows[0] || null;
  const recentGrades = useMemo(() => grades.slice(0, 5), [grades]);
  const myTeachers = useMemo(() => staff.slice(0, 8), [staff]);

  const toggleLightDark = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
    const next: ThemeMode = theme.isDark ? 'light' : 'dark';
    setThemeMode(next);
  };

  const quickModules = useMemo(
    () => [
      {
        label: 'mLegitymacja',
        icon: 'id-card-outline' as const,
        slug: 'mcard',
        color: theme.accent,
      },
      {
        label: 'Wykładowcy',
        icon: 'people-outline' as const,
        slug: 'staff',
        color: theme.purple,
      },
      {
        label: 'Egzaminy',
        icon: 'calendar-clear-outline' as const,
        slug: 'exams',
        color: theme.success,
      },
      {
        label: 'Płatności',
        icon: 'wallet-outline' as const,
        slug: 'payments',
        color: theme.warning,
      },
      {
        label: 'Ankiety',
        icon: 'chatbox-ellipses-outline' as const,
        slug: 'surveys',
        color: theme.cyan,
      },
      {
        label: 'Budynki',
        icon: 'map-outline' as const,
        slug: 'buildings',
        color: '#EC4899',
      },
      {
        label: 'Rejestracje',
        icon: 'checkbox-outline' as const,
        slug: 'registrations',
        color: theme.indigo,
      },
      {
        label: 'Dyplom APD',
        icon: 'ribbon-outline' as const,
        slug: 'thesis',
        color: '#14B8A6',
      },
    ],
    [theme]
  );

  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return null;

    const matchedCourses = courses
      .filter(
        (c) =>
          c.course_name.pl.toLowerCase().includes(q) ||
          c.course_id.toLowerCase().includes(q) ||
          c.coordinator.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedTeachers = staff
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.titles.toLowerCase().includes(q) ||
          s.room.toLowerCase().includes(q) ||
          (s.courses_taught || []).some((ct) => ct.toLowerCase().includes(q))
      )
      .slice(0, 4);

    const matchedGrades = grades
      .filter(
        (g) =>
          g.course_name.pl.toLowerCase().includes(q) ||
          g.author_name.toLowerCase().includes(q) ||
          g.value_symbol.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedModules = quickModules.filter((m) => m.label.toLowerCase().includes(q));

    return {
      courses: matchedCourses,
      teachers: matchedTeachers,
      grades: matchedGrades,
      modules: matchedModules,
      total:
        matchedCourses.length +
        matchedTeachers.length +
        matchedGrades.length +
        matchedModules.length,
    };
  }, [globalSearch, courses, staff, grades, quickModules]);

  const unpaidPayments = useMemo(
    () => payments.filter((p) => p.status === 'unpaid' && p.amount > 0),
    [payments]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={syncFromLiveApi}
              tintColor={theme.accent}
            />
          }>
          {/* 1. TOP GLOBAL SEARCH BAR ABOVE PROFILE CARD */}
          <Animated.View
            entering={FadeInDown.duration(260)}
            style={[
              styles.topSearchBar,
              {
                backgroundColor: theme.card,
                borderColor: globalSearch ? theme.accent : theme.cardBorder,
              },
            ]}>
            <Ionicons name="search" size={18} color={theme.accent} />
            <TextInput
              value={globalSearch}
              onChangeText={setGlobalSearch}
              placeholder="Szukaj przedmiotu, wykładowcy, oceny, sali lub modułu..."
              placeholderTextColor={theme.textMuted}
              style={[styles.topSearchInput, { color: theme.text }]}
            />
            {globalSearch.length > 0 ? (
              <Pressable onPress={() => setGlobalSearch('')}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </Pressable>
            ) : (
              <View style={[styles.kbdPill, { backgroundColor: theme.bgSecondary }]}>
                <Text style={[styles.kbdText, { color: theme.textMuted }]}>USOS</Text>
              </View>
            )}
          </Animated.View>

          {/* Instant Global Search Results Panel */}
          {searchResults && (
            <GlassCard elevated padding={14} style={styles.searchDropdownCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardHeaderMono, { color: theme.accent }]}>
                  WYNIKI WYSZUKIWANIA ({searchResults.total})
                </Text>
                <Pressable onPress={() => setGlobalSearch('')}>
                  <Text style={[styles.seeAllLink, { color: theme.textSecondary }]}>Zamknij</Text>
                </Pressable>
              </View>

              {searchResults.total === 0 ? (
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Brak wyników dla „{globalSearch}”. Spróbuj wpisać nazwisko prowadzącego w katalogu
                  kadry.
                </Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {searchResults.courses.map((c) => (
                    <Pressable
                      key={`sr-c-${c.course_id}`}
                      onPress={() => {
                        setGlobalSearch('');
                        router.push(`/modal/course/${c.course_id}`);
                      }}
                      style={[styles.searchHitRow, { borderTopColor: theme.separator }]}>
                      <Avatar name={c.coordinator} uri={c.coordinator_photo} size={34} />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.tabularSubject, { color: theme.text }]}
                          numberOfLines={1}>
                          {c.course_name.pl}
                        </Text>
                        <Text
                          style={[styles.tabularSubMeta, { color: theme.textSecondary }]}
                          numberOfLines={1}>
                           Przedmiot • {c.coordinator}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                    </Pressable>
                  ))}

                  {searchResults.teachers.map((t) => (
                    <Pressable
                      key={`sr-t-${t.id}`}
                      onPress={() => {
                        setGlobalSearch('');
                        router.push('/modal/module/staff');
                      }}
                      style={[styles.searchHitRow, { borderTopColor: theme.separator }]}>
                      <Avatar name={t.name} uri={t.photo_url} size={34} />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.tabularSubject, { color: theme.text }]}
                          numberOfLines={1}>
                          {t.titles} {t.name}
                        </Text>
                        <Text
                          style={[styles.tabularSubMeta, { color: theme.textSecondary }]}
                          numberOfLines={1}>
                          Wykładowca • {t.room}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                    </Pressable>
                  ))}

                  {searchResults.grades.map((g) => (
                    <Pressable
                      key={`sr-g-${g.id}`}
                      onPress={() => {
                        setGlobalSearch('');
                        router.push(`/modal/course/${g.course_id}`);
                      }}
                      style={[styles.searchHitRow, { borderTopColor: theme.separator }]}>
                      <GradeBadge symbol={g.value_symbol} size="sm" />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.tabularSubject, { color: theme.text }]}
                          numberOfLines={1}>
                          {g.course_name.pl}
                        </Text>
                        <Text
                          style={[styles.tabularSubMeta, { color: theme.textSecondary }]}
                          numberOfLines={1}>
                          Ocena • {g.author_name}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                    </Pressable>
                  ))}
                </View>
              )}
            </GlassCard>
          )}

          {/* 2. STUDENT PROFILE & UNIVERSITY CARD WITH HIGH-RES PHOTO */}
          <GlassCard elevated padding={15} delay={40}>
            <View style={styles.profileTopRow}>
              <Pressable
                onPress={() => router.push('/modal/module/mcard')}
                style={styles.avatarRow}>
                <Avatar
                  name={`${user.first_name} ${user.last_name}`}
                  uri={user.photo_url}
                  size={56}
                  borderColor={theme.accent}
                  variant="student"
                />
                <View style={styles.uniBadgeOverlay}>
                  <UniversityIcon installation={selectedInstallation} size={22} />
                </View>
              </Pressable>

              <View style={styles.profileTextCol}>
                <View style={styles.uniTagRow}>
                  <View style={[styles.brandDot, { backgroundColor: theme.accent }]} />
                  <Text
                    style={[styles.uniShortText, { color: theme.accent }]}
                    numberOfLines={1}>
                    RIFT DAILY // {selectedInstallation.shortName}
                  </Text>
                </View>

                <Text style={[styles.greeting, { color: theme.text }]} numberOfLines={1}>
                  {user.first_name} {user.last_name}
                </Text>

                <Text
                  style={[styles.programmeText, { color: theme.textSecondary }]}
                  numberOfLines={1}>
                  #{user.student_number} •{' '}
                  {user.programmes[0]?.name.pl || selectedInstallation.namePl}
                </Text>
              </View>

              <View style={styles.topActions}>
                <Pressable
                  onPress={() => router.push('/(tabs)/settings')}
                  accessibilityLabel="Powiadomienia i ustawienia"
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: theme.bgSecondary,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Ionicons name="notifications-outline" size={17} color={theme.accent} />
                </Pressable>

                <Pressable
                  onPress={toggleLightDark}
                  accessibilityLabel="Przełącz jasny i ciemny motyw"
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: theme.bgSecondary,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Ionicons
                    name={theme.isDark ? 'sunny-outline' : 'moon-outline'}
                    size={17}
                    color={theme.warning}
                  />
                </Pressable>

                {securityEnabled && (
                  <Pressable
                    onPress={lockSession}
                    accessibilityLabel="Zablokuj aplikację kodem PIN"
                    style={[
                      styles.iconBtn,
                      {
                        backgroundColor: theme.bgSecondary,
                        borderColor: theme.cardBorder,
                      },
                    ]}>
                    <Ionicons name="lock-closed-outline" size={16} color={theme.accent} />
                  </Pressable>
                )}
              </View>
            </View>
          </GlassCard>

          {/* 2B. IMMEDIATE NEXT / ONGOING CLASS SPOTLIGHT CARD */}
          {nextClassInfo && (
            <GlassCard
              elevated
              padding={15}
              delay={60}
              onPress={() => router.push(`/modal/course/${nextClassInfo.activity.course_id}`)}
              style={styles.nextClassCard}>
              <View style={styles.nextClassTopBar}>
                <View style={styles.nextClassTitleWrap}>
                  <View
                    style={[
                      styles.liveDot,
                      {
                        backgroundColor: nextClassInfo.isOngoing
                          ? theme.success
                          : theme.accent,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.cardHeaderMono,
                      {
                        color: nextClassInfo.isOngoing ? theme.success : theme.accent,
                      },
                    ]}>
                    {nextClassInfo.isOngoing ? 'TRWAJĄCE ZAJĘCIA' : 'NAJBLIŻSZE ZAJĘCIA'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.nextClassStatusBadge,
                    {
                      backgroundColor: nextClassInfo.isOngoing
                        ? theme.successSoft
                        : theme.accentSoft,
                      borderColor: nextClassInfo.isOngoing
                        ? `${theme.success}55`
                        : `${theme.accent}55`,
                    },
                  ]}>
                  <Ionicons
                    name={nextClassInfo.isOngoing ? 'radio-button-on' : 'time-outline'}
                    size={12}
                    color={nextClassInfo.isOngoing ? theme.success : theme.accent}
                  />
                  <Text
                    style={[
                      styles.nextClassStatusText,
                      {
                        color: nextClassInfo.isOngoing ? theme.success : theme.accent,
                      },
                    ]}>
                    {nextClassInfo.statusBadge}
                  </Text>
                </View>
              </View>

              <View style={styles.nextClassMainRow}>
                <Avatar
                  name={nextClassInfo.activity.lecturer_name}
                  uri={nextClassInfo.activity.lecturer_photo}
                  size={48}
                  borderColor={theme.cardBorder}
                />

                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.nextClassCourseName, { color: theme.text }]}
                    numberOfLines={1}>
                    {nextClassInfo.activity.course_name.pl}
                  </Text>
                  <Text
                    style={[styles.nextClassMetaLine, { color: theme.textSecondary }]}
                    numberOfLines={1}>
                    {nextClassInfo.activity.class_type.pl} • {nextClassInfo.activity.lecturer_name}
                  </Text>
                  <View style={styles.nextClassChipsRow}>
                    <View
                      style={[
                        styles.nextClassChip,
                        {
                          backgroundColor: theme.bgSecondary,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Ionicons name="time-outline" size={12} color={theme.accent} />
                      <Text style={[styles.nextClassChipText, { color: theme.text }]}>
                        {nextClassInfo.activity.start_time}–{nextClassInfo.activity.end_time}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.nextClassChip,
                        {
                          backgroundColor: theme.warningSoft,
                          borderColor: `${theme.warning}45`,
                        },
                      ]}>
                      <Ionicons name="location-outline" size={12} color={theme.warning} />
                      <Text
                        style={[styles.nextClassChipText, { color: theme.warning }]}
                        numberOfLines={1}>
                        Sala {nextClassInfo.activity.room_number}
                      </Text>
                    </View>

                    <Text
                      style={[styles.nextClassCountdown, { color: theme.textSecondary }]}
                      numberOfLines={1}>
                      {nextClassInfo.countdownLabel}
                    </Text>
                  </View>
                </View>
              </View>

              {nextClassInfo.afterActivity && (
                <View
                  style={[
                    styles.nextClassAfterStrip,
                    { borderTopColor: theme.separator },
                  ]}>
                  <Ionicons name="arrow-forward-circle-outline" size={14} color={theme.textMuted} />
                  <Text
                    style={[styles.nextClassAfterText, { color: theme.textSecondary }]}
                    numberOfLines={1}>
                    Następnie ({nextClassInfo.afterActivity.start_time}):{' '}
                    <Text style={{ color: theme.text, fontWeight: '800' }}>
                      {nextClassInfo.afterActivity.course_name.pl}
                    </Text>{' '}
                    • s. {nextClassInfo.afterActivity.room_number}
                  </Text>
                </View>
              )}
            </GlassCard>
          )}

          {/* 3. CONCEPT B ASYMMETRIC BENTO GRID (GPA + ECTS + KURSY + INDEKS) */}
          <View style={styles.bentoContainer}>
            {/* Left Big GPA Tile */}
            <GlassCard
              style={styles.bentoLeftGpa}
              padding={17}
              delay={80}
              onPress={() => router.push('/(tabs)/grades')}>
              <View style={styles.bentoHeaderRow}>
                <View style={styles.bentoIconLabel}>
                  <View style={[styles.miniAccentDot, { backgroundColor: theme.success }]} />
                  <Text style={[styles.bentoLabel, { color: theme.textSecondary }]}>
                    GPA / ŚREDNIA
                  </Text>
                </View>
                <Ionicons name="trending-up" size={16} color={theme.success} />
              </View>
              <Text
                style={[styles.bentoHeroNumber, { color: theme.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {weightedGpa}
              </Text>
              <Text
                style={[styles.bentoSubText, { color: theme.textSecondary }]}
                numberOfLines={1}>
                {grades.length} ocen w protokołach
              </Text>
            </GlassCard>

            {/* Right Stack: Top 2 mini tiles (ECTS + KURSY), Bottom payment/card strip */}
            <View style={styles.bentoRightCol}>
              <View style={styles.bentoTopMiniRow}>
                <GlassCard
                  style={styles.bentoMiniTile}
                  padding={12}
                  delay={110}
                  onPress={() => router.push('/(tabs)/grades')}>
                  <Text style={[styles.bentoLabel, { color: theme.accent }]} numberOfLines={1}>
                    ECTS
                  </Text>
                  <Text
                    style={[styles.bentoMiniValue, { color: theme.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {totalEcts}
                  </Text>
                </GlassCard>

                <GlassCard
                  style={styles.bentoMiniTile}
                  padding={12}
                  delay={130}
                  onPress={() => router.push('/(tabs)/courses')}>
                  <Text style={[styles.bentoLabel, { color: theme.purple }]} numberOfLines={1}>
                    KURSY
                  </Text>
                  <Text
                    style={[styles.bentoMiniValue, { color: theme.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {courses.length}
                  </Text>
                </GlassCard>
              </View>

              <GlassCard
                style={styles.bentoBottomStrip}
                padding={12}
                delay={150}
                onPress={() =>
                  router.push(
                    unpaidPayments.length > 0 ? '/modal/module/payments' : '/modal/module/mcard'
                  )
                }>
                {unpaidPayments.length > 0 ? (
                  <>
                    <View style={styles.stripTopRow}>
                      <View style={[styles.miniAccentDot, { backgroundColor: theme.warning }]} />
                      <Text
                        style={[styles.bentoStripCode, { color: theme.warning }]}
                        numberOfLines={1}>
                        RATA DO ZAPŁATY: {unpaidPayments[0].amount.toFixed(0)} PLN
                      </Text>
                    </View>
                    <Text
                      style={[styles.bentoStripSub, { color: theme.textSecondary }]}
                      numberOfLines={1}>
                      {unpaidPayments[0].title}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={[styles.bentoStripCode, { color: theme.text }]}
                      numberOfLines={1}>
                      {selectedInstallation.shortName} // #{user.student_number}
                    </Text>
                    <Text
                      style={[styles.bentoStripSub, { color: theme.textSecondary }]}
                      numberOfLines={1}>
                      mLegitymacja ELS • Aktywny student
                    </Text>
                  </>
                )}
              </GlassCard>
            </View>
          </View>

          {/* 5. CONCEPT B TEACHER PORTRAIT LIST CARD */}
          <GlassCard padding={16} delay={220} style={styles.teachersCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardHeaderMono, { color: theme.textSecondary }]}>
                TWOI WYKŁADOWCY I PROWADZĄCY
              </Text>
              <Pressable onPress={() => router.push('/modal/module/staff')}>
                <Text style={[styles.seeAllLink, { color: theme.accent }]}>
                  Katalog ({staff.length}) →
                </Text>
              </Pressable>
            </View>

            {myTeachers.length === 0 ? (
              <Pressable
                onPress={() => router.push('/modal/module/staff')}
                style={styles.emptyClassRow}>
                <Ionicons name="people-outline" size={22} color={theme.purple} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    Wyszukiwarka kadry {selectedInstallation.shortName}
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                    Dotknij, aby wyszukać wykładowców, pokoje i godziny konsultacji
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View style={styles.teacherRowsWrap}>
                {myTeachers.slice(0, 5).map((teacher, idx) => (
                  <Pressable
                    key={teacher.id}
                    onPress={() => router.push('/modal/module/staff')}
                    style={[
                      styles.teacherListItem,
                      idx > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: theme.separator,
                      },
                    ]}>
                    <Avatar
                      name={teacher.name}
                      uri={teacher.photo_url}
                      size={46}
                      borderColor={theme.cardBorder}
                    />
                    <View style={styles.teacherTextCol}>
                      <View style={styles.teacherTitleRow}>
                        <Text
                          style={[styles.teacherRowName, { color: theme.text }]}
                          numberOfLines={1}>
                          {teacher.name}
                        </Text>
                        <View
                          style={[
                            styles.degreePill,
                            {
                              backgroundColor: theme.purpleSoft,
                              borderColor: `${theme.purple}40`,
                            },
                          ]}>
                          <Text
                            style={[styles.degreePillText, { color: theme.purple }]}
                            numberOfLines={1}>
                            {teacher.titles}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[styles.teacherRowSub, { color: theme.textSecondary }]}
                        numberOfLines={1}>
                        {teacher.courses_taught?.[0] || teacher.office_hours || teacher.faculty}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </Pressable>
                ))}
              </View>
            )}
          </GlassCard>

          {/* 6. LATEST GRADES IN PROTOCOLS WITH AUTHOR AVATARS */}
          <GlassCard padding={16} delay={260} style={styles.gradesCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardHeaderMono, { color: theme.textSecondary }]}>
                OSTATNIE OCENY W PROTOKOŁACH
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/grades')}>
                <Text style={[styles.seeAllLink, { color: theme.accent }]}>
                  Wykaz ({grades.length}) →
                </Text>
              </Pressable>
            </View>

            {recentGrades.length === 0 ? (
              <View style={styles.emptyClassRow}>
                <Ionicons name="school-outline" size={22} color={theme.success} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    Brak wpisanych ocen w bieżącym protokole
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                    Pociągnij w dół, aby zsynchronizować protokoły ocen z USOS API.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.teacherRowsWrap}>
                {recentGrades.map((grade, idx) => (
                  <Pressable
                    key={grade.id}
                    onPress={() => router.push(`/modal/course/${grade.course_id}`)}
                    style={[
                      styles.gradeRow,
                      idx > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: theme.separator,
                      },
                    ]}>
                    <GradeBadge symbol={grade.value_symbol} size="sm" />
                    <View style={styles.teacherTextCol}>
                      <Text
                        style={[styles.gradeCourseName, { color: theme.text }]}
                        numberOfLines={1}>
                        {grade.course_name.pl}
                      </Text>
                      <View style={styles.gradeAuthorLine}>
                        <Avatar name={grade.author_name} uri={grade.author_photo} size={18} />
                        <Text
                          style={[styles.gradeMeta, { color: theme.textSecondary }]}
                          numberOfLines={1}>
                          {grade.author_name} • {grade.term_id}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </Pressable>
                ))}
              </View>
            )}
          </GlassCard>

          {/* 7. ALL USOS MODULES QUICK GRID (4x2 with subtle color accents) */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardHeaderMono, { color: theme.textSecondary }]}>
              MODUŁY USOS NA SKRÓTY
            </Text>
          </View>

          <View style={styles.modulesGrid}>
            {quickModules.map((m) => (
              <Pressable
                key={m.slug}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.selectionAsync().catch(() => {});
                  }
                  router.push(`/modal/module/${m.slug}`);
                }}
                style={({ pressed }) => [
                  styles.moduleTile,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <View
                  style={[
                    styles.modIconCircle,
                    { backgroundColor: `${m.color}20`, borderColor: `${m.color}40` },
                  ]}>
                  <Ionicons name={m.icon} size={19} color={m.color} />
                </View>
                <Text style={[styles.moduleTileLabel, { color: theme.text }]} numberOfLines={1}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
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
    paddingTop: 6,
    paddingBottom: 118,
    gap: 12,
  },
  topSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  topSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  kbdPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  kbdText: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '800',
  },
  searchDropdownCard: {
    gap: 10,
  },
  searchHitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRow: {
    position: 'relative',
    flexShrink: 0,
  },
  uniBadgeOverlay: {
    position: 'absolute',
    bottom: -3,
    right: -4,
  },
  profileTextCol: {
    flex: 1,
    minWidth: 0,
  },
  uniTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  uniShortText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  programmeText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoLeftGpa: {
    flex: 1.05,
    justifyContent: 'space-between',
    minHeight: 146,
  },
  bentoRightCol: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  bentoTopMiniRow: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  bentoMiniTile: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniAccentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bentoLabel: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bentoHeroNumber: {
    fontFamily: MONO_FONT,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginVertical: 4,
  },
  bentoSubText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bentoMiniValue: {
    fontFamily: MONO_FONT,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  bentoBottomStrip: {
    justifyContent: 'center',
    gap: 2,
  },
  stripTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bentoStripCode: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },
  bentoStripSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  scheduleCard: {
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  cardHeaderMono: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  livePillText: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '800',
  },
  seeAllLink: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 0,
  },
  tabularList: {
    marginTop: 2,
  },
  tabularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  tabularTimeRoomCol: {
    width: 86,
    gap: 3,
    flexShrink: 0,
  },
  tabularTime: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
  },
  roomPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  roomPillText: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '800',
  },
  tabularTextCol: {
    flex: 1,
    minWidth: 0,
  },
  tabularSubject: {
    fontSize: 14,
    fontWeight: '800',
  },
  tabularSubMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  teachersCard: {
    gap: 8,
  },
  teacherRowsWrap: {
    marginTop: 2,
  },
  teacherListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  teacherTextCol: {
    flex: 1,
    minWidth: 0,
  },
  teacherTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teacherRowName: {
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  degreePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
    maxWidth: 96,
  },
  degreePillText: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '800',
  },
  teacherRowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  gradesCard: {
    gap: 8,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  gradeCourseName: {
    fontSize: 14,
    fontWeight: '800',
  },
  gradeAuthorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  gradeMeta: {
    fontSize: 11,
    flex: 1,
  },
  emptyClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: -2,
    paddingHorizontal: 2,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  moduleTile: {
    width: '22.8%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderRadius: 18,
    borderWidth: 1,
    gap: 7,
  },
  modIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTileLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  nextClassCard: {
    gap: 12,
  },
  nextClassTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nextClassTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  nextClassStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  nextClassStatusText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  nextClassMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextClassCourseName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  nextClassMetaLine: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  nextClassChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 8,
  },
  nextClassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
  },
  nextClassChipText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  nextClassCountdown: {
    fontSize: 11,
    fontWeight: '700',
  },
  nextClassAfterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  nextClassAfterText: {
    flex: 1,
    fontSize: 12,
  },
});
