import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
import { GradeBadge } from '@/components/GradeBadge';
import { ScrambleText } from '@/components/KineticText';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';
import {
  DAY_SHORT_PL,
  formatShortDatePl,
  getClassTypeColor,
  toLocalIsoDate,
} from '@/utils/timetableUtils';

export default function CourseDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();

  const courses = useUsosStore((s) => s.courses);
  const grades = useUsosStore((s) => s.grades);
  const staff = useUsosStore((s) => s.staff);
  const timetable = useUsosStore((s) => s.timetable);
  const upcomingTimetable = useUsosStore((s) => s.upcomingTimetable);

  const course = useMemo(
    () => courses.find((c) => c.course_id === id) || courses[0],
    [courses, id]
  );

  const courseGrades = useMemo(
    () => (course ? grades.filter((g) => g.course_id === course.course_id) : []),
    [course, grades]
  );

  const upcomingSessions = useMemo(() => {
    if (!course) return [];
    const pool = upcomingTimetable.length > 0 ? upcomingTimetable : timetable;
    const todayIso = toLocalIsoDate(new Date());
    const seen = new Set<string>();

    return pool
      .filter((t) => t.course_id === course.course_id && (!t.date || t.date >= todayIso))
      .sort((a, b) => {
        const dCmp = (a.date || '').localeCompare(b.date || '');
        if (dCmp !== 0) return dCmp;
        return a.start_time.localeCompare(b.start_time);
      })
      .filter((t) => {
        const key = `${t.date}|${t.start_time}|${t.room_number}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }, [course, upcomingTimetable, timetable]);

  const enrichedLecturers = useMemo(() => {
    if (!course) return [];

    const findStaffMatch = (lecturerId?: string, name?: string) => {
      if (lecturerId) {
        const byId = staff.find((s) => s.id === lecturerId);
        if (byId) return byId;
      }
      const normName = (name || '').trim().toLowerCase();
      if (!normName) return undefined;
      return staff.find(
        (s) =>
          s.name.toLowerCase() === normName ||
          normName.includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(normName)
      );
    };

    const rawList =
      course.lecturers && course.lecturers.length > 0
        ? course.lecturers.map((l) => ({
            id: l.id,
            name: l.name,
            titles: l.titles,
            photo_url: l.photo_url,
          }))
        : [
            {
              id: course.coordinator_id || 'coordinator',
              name: course.coordinator,
              titles: 'Koordynator',
              photo_url: course.coordinator_photo,
            },
          ];

    return rawList.map((lec) => {
      const match = findStaffMatch(lec.id, lec.name);
      return {
        ...lec,
        photo_url: lec.photo_url || match?.photo_url,
        titles: lec.titles || match?.titles || 'Prowadzący',
        email: match?.email || '',
        room: match?.room || '',
        building: match?.building || '',
        office_hours: match?.office_hours || '',
      };
    });
  }, [course, staff]);

  const [section, setSection] = useState<'overview' | 'groups' | 'syllabus'>('overview');
  const [copiedEmailKey, setCopiedEmailKey] = useState<string | null>(null);

  const handleCopyEmail = async (email: string, key: string) => {
    try {
      await Clipboard.setStringAsync(email);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setCopiedEmailKey(key);
      setTimeout(() => {
        setCopiedEmailKey((curr) => (curr === key ? null : curr));
      }, 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  if (!course) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <SafeAreaView style={styles.root}>
          <View style={[styles.header, { borderBottomColor: theme.separator }]}>
            <Text style={[styles.title, { color: theme.text }]}>Szczegóły przedmiotu</Text>
            <GlassSurface radius={16} interactive onPress={() => router.back()} contentStyle={styles.closeBtn}>
              <Ionicons name="close" size={18} color={theme.text} />
            </GlassSurface>
          </View>
          <View style={styles.emptyBlock}>
            <Text style={{ color: theme.textSecondary }}>Nie znaleziono przedmiotu.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const rootTest = course.test_tree?.[0];

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <AmbientBackdrop variant="journal" />

      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.separator }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.metaPillsRow}>
              <ScrambleText
                text={`${course.term_id} · ${course.course_id}`}
                durationMs={260}
                style={[styles.codeMono, { color: theme.accent }]}
              />
              {course.ects > 0 && (
                <View style={[styles.ectsPill, { backgroundColor: theme.accentSoft }]}>
                  <Text style={[styles.ectsPillText, { color: theme.accent }]}>
                    {course.ects} ECTS
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.ectsPill,
                  {
                    backgroundColor:
                      course.passing_status === 'passed'
                        ? theme.successSoft
                        : theme.bgSecondary,
                  },
                ]}>
                <Text
                  style={[
                    styles.ectsPillText,
                    {
                      color:
                        course.passing_status === 'passed'
                          ? theme.success
                          : theme.textSecondary,
                    },
                  ]}>
                  {course.passing_status === 'passed' ? 'ZALICZONY' : 'W TRAKCIE'}
                </Text>
              </View>
            </View>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {course.course_name.pl}
            </Text>
          </View>

          <GlassSurface
            radius={16}
            interactive
            accessibilityLabel="Zamknij"
            onPress={() => router.back()}
            contentStyle={styles.closeBtn}>
            <Ionicons name="close" size={18} color={theme.text} />
          </GlassSurface>
        </View>

        <View style={styles.segmentWrap}>
          <SegmentedControl
            options={[
              { label: 'Przegląd', value: 'overview', badge: courseGrades.length },
              { label: 'Grupy', value: 'groups', badge: course.groups.length },
              { label: 'Sylabus', value: 'syllabus' },
            ]}
            value={section}
            onChange={setSection}
          />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {section === 'overview' && (
            <>
              {/* 1. Open Protocol Grades Section (Zero boxy card) */}
              <SectionHeader
                title={`Oceny w protokole (${courseGrades.length})`}
                rightText={course.final_grade ? `KOŃCOWA ${course.final_grade}` : undefined}
                accentColor={course.final_grade ? theme.success : undefined}
                style={styles.firstSection}
              />

              {courseGrades.length === 0 ? (
                <Text style={[styles.mutedHint, { color: theme.textSecondary }]}>
                  Brak wpisanych ocen w bieżącym protokole USOS.
                </Text>
              ) : (
                courseGrades.map((g, idx) => (
                  <View
                    key={g.id}
                    style={[
                      styles.gradeRow,
                      idx < courseGrades.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.separator,
                      },
                    ]}>
                    <GradeBadge symbol={g.value_symbol} size="md" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                        {g.class_type || 'Protokół'} · Termin {g.exam_session_number}
                      </Text>
                      <Text
                        style={[styles.rowSub, { color: theme.textSecondary }]}
                        numberOfLines={1}>
                        {g.author_name}
                        {g.date_modified ? ` · ${g.date_modified}` : ''}
                      </Text>
                      {g.comment ? (
                        <Text
                          style={[styles.commentInline, { color: theme.textMuted }]}
                          numberOfLines={2}>
                          „{g.comment}”
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}

              {rootTest && (
                <View style={[styles.testStrip, { borderTopColor: theme.separator }]}>
                  <Text style={[styles.rowTitle, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                    {rootTest.name.pl}
                  </Text>
                  {rootTest.points_max !== undefined && (
                    <Text style={[styles.monoAccent, { color: theme.success }]}>
                      {rootTest.points_earned ?? 0} / {rootTest.points_max} pkt
                    </Text>
                  )}
                </View>
              )}

              {/* 2. Upcoming Timetable Sessions */}
              <SectionHeader
                title="Najbliższe terminy w planie"
                rightText={
                  upcomingSessions.length > 0 ? `${upcomingSessions.length} term.` : undefined
                }
              />

              {upcomingSessions.length === 0 ? (
                <Text style={[styles.mutedHint, { color: theme.textSecondary }]}>
                  Brak zaplanowanych spotkań w nadchodzących tygodniach.
                </Text>
              ) : (
                upcomingSessions.map((ses, idx) => {
                  const barColor = getClassTypeColor(ses.class_type_id, theme);
                  return (
                    <View
                      key={ses.id}
                      style={[
                        styles.sessionRow,
                        idx < upcomingSessions.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.separator,
                        },
                      ]}>
                      <View style={[styles.sessionBar, { backgroundColor: barColor }]} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.rowTitle, { color: theme.text }]}>
                          {DAY_SHORT_PL[ses.day_of_week]}{' '}
                          {ses.date ? formatShortDatePl(ses.date) : ''} · {ses.start_time}–
                          {ses.end_time}
                        </Text>
                        <Text
                          style={[styles.rowSub, { color: theme.textSecondary }]}
                          numberOfLines={1}>
                          {ses.class_type.pl}
                          {ses.room_number ? ` · Sala ${ses.room_number}` : ''}
                          {ses.building_name?.pl ? ` · ${ses.building_name.pl}` : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}

              {/* 3. Lecturers with Email Copy & Office Hours */}
              <SectionHeader title="Prowadzący i konsultacje" />

              {enrichedLecturers.map((lec, idx) => {
                const hasEmail = Boolean(lec.email && lec.email.includes('@'));
                const copyKey = `${lec.id}-${idx}`;
                const isCopied = copiedEmailKey === copyKey;

                return (
                  <View
                    key={copyKey}
                    style={[
                      styles.lecturerRow,
                      idx < enrichedLecturers.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.separator,
                      },
                    ]}>
                    <Avatar name={lec.name} uri={lec.photo_url} size={42} />
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text
                        style={[styles.lecturerTitles, { color: theme.accent }]}
                        numberOfLines={1}>
                        {lec.titles.toUpperCase()}
                      </Text>
                      <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                        {lec.name}
                      </Text>

                      {lec.office_hours ? (
                        <View style={styles.inlineIconMeta}>
                          <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                          <Text
                            style={[styles.rowSub, { color: theme.textSecondary, flex: 1 }]}
                            numberOfLines={2}>
                            Konsultacje: {lec.office_hours}
                          </Text>
                        </View>
                      ) : null}

                      {lec.room ? (
                        <View style={styles.inlineIconMeta}>
                          <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                          <Text
                            style={[styles.rowSub, { color: theme.textSecondary, flex: 1 }]}
                            numberOfLines={1}>
                            Pokój {lec.room}
                            {lec.building ? ` · ${lec.building}` : ''}
                          </Text>
                        </View>
                      ) : null}

                      {hasEmail ? (
                        <Pressable
                          onPress={() => handleCopyEmail(lec.email, copyKey)}
                          style={({ pressed }) => [
                            styles.emailCopyPill,
                            {
                              backgroundColor: isCopied ? theme.successSoft : theme.bgSecondary,
                              borderColor: isCopied ? `${theme.success}45` : theme.separator,
                              opacity: pressed ? 0.7 : 1,
                            },
                          ]}>
                          <Ionicons
                            name={isCopied ? 'checkmark' : 'copy-outline'}
                            size={12}
                            color={isCopied ? theme.success : theme.accent}
                          />
                          <Text
                            style={[
                              styles.emailCopyText,
                              { color: isCopied ? theme.success : theme.text },
                            ]}
                            numberOfLines={1}>
                            {isCopied ? 'Skopiowano e-mail' : lec.email}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {section === 'groups' && (
            <>
              <SectionHeader
                title={`Twoje grupy (${course.groups.length})`}
                style={styles.firstSection}
              />
              {course.groups.length === 0 ? (
                <Text style={[styles.mutedHint, { color: theme.textSecondary }]}>
                  Brak przypisanych grup zajęciowych dla tego przedmiotu.
                </Text>
              ) : (
                course.groups.map((grp, idx) => {
                  const barColor = getClassTypeColor(grp.class_type_id, theme);
                  return (
                    <View
                      key={`${grp.class_type_id}-${grp.group_number}-${idx}`}
                      style={[
                        styles.groupRow,
                        idx < course.groups.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.separator,
                        },
                      ]}>
                      <View style={[styles.sessionBar, { backgroundColor: barColor }]} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={styles.groupTopLine}>
                          <Text style={[styles.monoLabel, { color: barColor }]}>
                            {grp.class_type_name.toUpperCase()} · GRUPA {grp.group_number}
                          </Text>
                          {grp.participants_count > 0 && (
                            <Text style={[styles.monoMuted, { color: theme.textMuted }]}>
                              {grp.participants_count} os.
                            </Text>
                          )}
                        </View>
                        <View style={styles.groupLecturerLine}>
                          <Avatar name={grp.lecturer} uri={grp.lecturer_photo} size={24} />
                          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                            {grp.lecturer}
                          </Text>
                        </View>
                        {grp.schedule_summary ? (
                          <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                            {grp.schedule_summary}
                            {grp.room ? ` · Sala ${grp.room}` : ''}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {section === 'syllabus' && (
            <>
              <SectionHeader title="Opis przedmiotu" style={styles.firstSection} />
              <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                {course.syllabus_description || 'Brak opisu przedmiotu w USOS.'}
              </Text>

              <SectionHeader title="Kryteria oceniania" />
              <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                {course.assessment_criteria || 'Brak kryteriów oceniania w USOS.'}
              </Text>

              {course.literature.length > 0 && (
                <>
                  <SectionHeader title="Literatura" />
                  {course.literature.map((lit, i) => (
                    <View
                      key={i}
                      style={[
                        styles.litRow,
                        i < course.literature.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.separator,
                        },
                      ]}>
                      <Ionicons name="book-outline" size={14} color={theme.accent} />
                      <Text style={[styles.bodyText, { color: theme.textSecondary, flex: 1 }]}>
                        {lit}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  metaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  codeMono: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '700',
  },
  ectsPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ectsPillText: {
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    fontWeight: '800',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 23,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  firstSection: {
    paddingTop: 10,
  },
  monoLabel: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  monoAccent: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
  },
  monoMuted: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '600',
  },
  mutedHint: {
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 4,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rowSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  commentInline: {
    fontSize: 11.5,
    fontStyle: 'italic',
    marginTop: 2,
  },
  testStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 4,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 10,
    gap: 10,
  },
  sessionBar: {
    width: 3,
    borderRadius: 2,
    marginVertical: 2,
  },
  lecturerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  lecturerTitles: {
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inlineIconMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  emailCopyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
  },
  emailCopyText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '600',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 12,
    gap: 10,
  },
  groupTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupLecturerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bodyText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  litRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
