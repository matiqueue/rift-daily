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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/GlassCard';
import { GradeBadge } from '@/components/GradeBadge';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';

export default function CoursesScreen() {
  const theme = useAppTheme();
  const courses = useUsosStore((s) => s.courses);
  const isSyncing = useUsosStore((s) => s.isSyncing);
  const syncFromLiveApi = useUsosStore((s) => s.syncFromLiveApi);

  const [query, setQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<string>('ALL');

  const terms = useMemo(() => {
    const unique = Array.from(new Set(courses.map((c) => c.term_id))).sort().reverse();
    return ['ALL', ...unique];
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (selectedTerm !== 'ALL' && c.term_id !== selectedTerm) return false;
      if (!q) return true;
      return (
        c.course_name.pl.toLowerCase().includes(q) ||
        c.course_id.toLowerCase().includes(q) ||
        c.coordinator.toLowerCase().includes(q)
      );
    });
  }, [courses, query, selectedTerm]);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.monoOverline, { color: theme.textSecondary }]}>
              SERVICES/COURSES/USER • {filtered.length} POZYCJI
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>Przedmioty</Text>
          </View>
          <Pressable
            onPress={syncFromLiveApi}
            style={[
              styles.refreshBtn,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}>
            <Ionicons name="refresh" size={18} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Szukaj przedmiotu, kodu lub prowadzącego..."
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </Pressable>
            )}
          </View>

          {terms.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.termsScroll}>
              {terms.map((t) => {
                const active = selectedTerm === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Haptics.selectionAsync().catch(() => {});
                      }
                      setSelectedTerm(t);
                    }}
                    style={[
                      styles.termChip,
                      {
                        backgroundColor: active ? theme.primary : theme.card,
                        borderColor: active ? theme.primary : theme.cardBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.termChipText,
                        {
                          color: active ? theme.primaryContrast : theme.textSecondary,
                        },
                      ]}>
                      {t === 'ALL' ? `WSZYSTKIE (${courses.length})` : `SEMESTR ${t}`}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={syncFromLiveApi}
              tintColor={theme.text}
            />
          }>
          {filtered.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="book-outline" size={34} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Brak przedmiotów do wyświetlenia
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Pociągnij w dół, aby pobrać swoje przedmioty z USOS API (`services/courses/user`).
              </Text>
            </GlassCard>
          ) : (
            filtered.map((course) => (
              <GlassCard
                key={`${course.term_id}_${course.course_id}`}
                onPress={() => router.push(`/modal/course/${course.course_id}`)}
                style={styles.courseCard}>
                <View style={styles.topRow}>
                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.codeBadge,
                        {
                          backgroundColor: theme.bgSecondary,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Text style={[styles.codeText, { color: theme.textSecondary }]}>
                        {course.term_id} // {course.course_id}
                      </Text>
                    </View>
                    {course.ects > 0 && (
                      <View
                        style={[
                          styles.ectsBadge,
                          {
                            backgroundColor: theme.primarySoft,
                            borderColor: theme.cardBorder,
                          },
                        ]}>
                        <Text style={[styles.ectsText, { color: theme.text }]}>
                          {course.ects} ECTS
                        </Text>
                      </View>
                    )}
                  </View>

                  {course.final_grade ? (
                    <GradeBadge symbol={course.final_grade} size="sm" />
                  ) : (
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            course.passing_status === 'passed'
                              ? theme.successSoft
                              : theme.bgSecondary,
                          borderColor:
                            course.passing_status === 'passed'
                              ? `${theme.success}40`
                              : theme.cardBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.statusPillText,
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
                  )}
                </View>

                <Text style={[styles.courseTitle, { color: theme.text }]}>
                  {course.course_name.pl}
                </Text>

                {/* Coordinator / Lecturer Row with Photo */}
                <View
                  style={[
                    styles.teacherRow,
                    { backgroundColor: theme.bgSecondary, borderColor: theme.cardBorder },
                  ]}>
                  <Avatar
                    name={course.coordinator}
                    uri={course.coordinator_photo}
                    size={36}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.teacherLabel, { color: theme.textMuted }]}>
                      PROWADZĄCY / KOORDYNATOR
                    </Text>
                    <Text
                      style={[styles.teacherName, { color: theme.text }]}
                      numberOfLines={1}>
                      {course.coordinator}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </View>

                {/* Groups chips */}
                {course.groups.length > 0 && (
                  <View style={styles.groupsWrap}>
                    {course.groups.map((g, i) => (
                      <View
                        key={`${g.class_type_id}-${i}`}
                        style={[
                          styles.groupChip,
                          {
                            backgroundColor: theme.bgSecondary,
                            borderColor: theme.cardBorder,
                          },
                        ]}>
                        <Text style={[styles.groupChipText, { color: theme.textSecondary }]}>
                          <Text style={{ fontWeight: '800', color: theme.text }}>
                            {g.class_type_name}
                          </Text>{' '}
                          • GR. {g.group_number}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </GlassCard>
            ))
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 13,
    gap: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  termsScroll: {
    gap: 8,
  },
  termChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 13,
    borderWidth: 1,
  },
  termChipText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 118,
    gap: 11,
  },
  courseCard: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
  },
  codeText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  ectsBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
  },
  ectsText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  teacherLabel: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teacherName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  groupsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
    borderWidth: 1,
  },
  groupChipText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
