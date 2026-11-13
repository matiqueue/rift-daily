import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/GlassCard';
import { GradeBadge } from '@/components/GradeBadge';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';

export default function CourseDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const courses = useUsosStore((s) => s.courses);
  const grades = useUsosStore((s) => s.grades);

  const course = courses.find((c) => c.course_id === id) || courses[0];
  const courseGrades = grades.filter((g) => g.course_id === course?.course_id);
  const [section, setSection] = useState<'overview' | 'groups' | 'syllabus'>('overview');

  if (!course) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Szczegóły przedmiotu</Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.closeBtn, { backgroundColor: theme.cardElevated }]}>
            <Ionicons name="close" size={20} color={theme.text} />
          </Pressable>
        </View>
        <View style={{ padding: 18 }}>
          <GlassCard style={styles.emptyCard}>
            <Text style={{ color: theme.textSecondary }}>Nie znaleziono przedmiotu.</Text>
          </GlassCard>
        </View>
      </SafeAreaView>
    );
  }

  const rootTest = course.test_tree?.[0];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      {/* Modal Header */}
      <View style={[styles.header, { borderBottomColor: theme.separator }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.codeLabel, { color: theme.primary }]}>
            {course.course_id} • SEMESTR {course.term_id}
            {course.ects > 0 ? ` • ${course.ects} ECTS` : ''}
          </Text>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {course.course_name.pl}
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.cardElevated }]}>
          <Ionicons name="close" size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.segmentWrap}>
        <SegmentedControl
          options={[
            { label: 'Oceny i Kadra', value: 'overview', badge: courseGrades.length },
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
            {/* Protocol Grades for this Course */}
            <GlassCard elevated style={{ gap: 12 }}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                Oceny w protokole USOS ({courseGrades.length})
              </Text>
              {courseGrades.length === 0 ? (
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  Brak wpisanych ocen końcowych dla tego przedmiotu w bieżącym protokole.
                </Text>
              ) : (
                courseGrades.map((g) => (
                  <View key={g.id} style={styles.gradeRow}>
                    <GradeBadge symbol={g.value_symbol} size="lg" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>
                        {g.class_type} (Termin {g.exam_session_number})
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                        Wystawił(a): {g.author_name} • {g.date_modified}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </GlassCard>

            {/* Course Lecturers & Coordinators with Photos */}
            <GlassCard style={{ gap: 12 }}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                Prowadzący i koordynatorzy przedmiotu
              </Text>

              {course.lecturers && course.lecturers.length > 0 ? (
                course.lecturers.map((lec) => (
                  <View
                    key={lec.id}
                    style={[
                      styles.teacherItem,
                      { backgroundColor: theme.bgSecondary, borderColor: theme.cardBorder },
                    ]}>
                    <Avatar name={lec.name} uri={lec.photo_url} size={46} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary }}>
                        {lec.titles.toUpperCase()}
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>
                        {lec.name}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View
                  style={[
                    styles.teacherItem,
                    { backgroundColor: theme.bgSecondary, borderColor: theme.cardBorder },
                  ]}>
                  <Avatar
                    name={course.coordinator}
                    uri={course.coordinator_photo}
                    size={46}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary }}>
                      KOORDYNATOR PRZEDMIOTU
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>
                      {course.coordinator}
                    </Text>
                  </View>
                </View>
              )}
            </GlassCard>

            {/* Optional crstests tree if published */}
            {rootTest && (
              <GlassCard style={styles.rootTestCard}>
                <View style={styles.rootTestTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.smallTag, { color: theme.success }]}>
                      DRZEWO SPRAWDZIANÓW I ZALICZEŃ
                    </Text>
                    <Text style={[styles.rootTestTitle, { color: theme.text }]}>
                      {rootTest.name.pl}
                    </Text>
                  </View>
                  {rootTest.points_max !== undefined && (
                    <View style={[styles.totalScorePill, { backgroundColor: theme.successSoft }]}>
                      <Text style={[styles.totalScoreText, { color: theme.success }]}>
                        {rootTest.points_earned ?? 0} / {rootTest.points_max} pkt
                      </Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            )}
          </>
        )}

        {section === 'groups' && (
          <View style={{ gap: 12 }}>
            {course.groups.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  Brak przypisanych grup zajęciowych dla tego przedmiotu.
                </Text>
              </GlassCard>
            ) : (
              course.groups.map((grp, idx) => (
                <GlassCard key={idx} style={{ gap: 10 }}>
                  <View style={styles.groupHeaderRow}>
                    <View style={[styles.grpBadge, { backgroundColor: theme.primarySoft }]}>
                      <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 12 }}>
                        {grp.class_type_name.toUpperCase()} • GRUPA {grp.group_number}
                      </Text>
                    </View>
                    {grp.participants_count > 0 && (
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                        {grp.participants_count} os.
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.teacherItem,
                      { backgroundColor: theme.bgSecondary, borderColor: theme.cardBorder },
                    ]}>
                    <Avatar name={grp.lecturer} uri={grp.lecturer_photo} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: theme.textMuted }}>
                        PROWADZĄCY GRUPĘ
                      </Text>
                      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>
                        {grp.lecturer}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))
            )}
          </View>
        )}

        {section === 'syllabus' && (
          <View style={{ gap: 12 }}>
            <GlassCard style={{ gap: 8 }}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                Opis przedmiotu
              </Text>
              <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                {course.syllabus_description}
              </Text>
            </GlassCard>

            <GlassCard style={{ gap: 8 }}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                Kryteria oceniania i warunki zaliczenia
              </Text>
              <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                {course.assessment_criteria}
              </Text>
            </GlassCard>

            <GlassCard style={{ gap: 8 }}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                Literatura przedmiotu
              </Text>
              {course.literature.map((lit, i) => (
                <View key={i} style={styles.litRow}>
                  <Ionicons name="book-outline" size={15} color={theme.primary} />
                  <Text style={[styles.bodyText, { color: theme.textSecondary, flex: 1 }]}>
                    {lit}
                  </Text>
                </View>
              ))}
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 40,
  },
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  rootTestCard: {
    gap: 14,
  },
  rootTestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  smallTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rootTestTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  totalScorePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalScoreText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grpBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  litRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
});
