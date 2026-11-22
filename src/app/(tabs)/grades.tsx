import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UsosCourseEdition, UsosGradeItem } from '@/api/types';
import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { GlassSurface } from '@/components/GlassSurface';
import { GradeBadge } from '@/components/GradeBadge';
import {
  AnimatedNumberText,
  EditorialFade,
  HairlineDraw,
  ScrambleText,
  TypewriterText,
} from '@/components/KineticText';
import { ListRow } from '@/components/ListRow';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';
import { getClassTypeShort } from '@/utils/timetableUtils';

type AcademicTab = 'courses' | 'grades' | 'simulator';
type GradeSymbolBucket = '5' | '4,5' | '4' | '3,5' | '3';

function parseTabParam(raw?: string): AcademicTab {
  if (raw === 'grades' || raw === 'simulator' || raw === 'courses') return raw;
  return 'courses';
}

function normalizeGradeBucket(symbol: string): GradeSymbolBucket | null {
  const norm = symbol.replace('.0', '').replace('.', ',').trim();
  if (norm === '5' || norm === '4,5' || norm === '4' || norm === '3,5' || norm === '3') {
    return norm;
  }
  return null;
}

function computeGpaForGrades(list: UsosGradeItem[]): {
  weighted: number;
  simple: number;
  ectsSum: number;
  countNumeric: number;
} {
  let weightedSum = 0;
  let ectsSum = 0;
  let simpleSum = 0;
  let countNumeric = 0;

  for (const g of list) {
    if (g.value_numeric !== null) {
      simpleSum += g.value_numeric;
      countNumeric++;
      const weight = g.ects > 0 ? g.ects : 1;
      weightedSum += g.value_numeric * weight;
      ectsSum += weight;
    }
  }

  return {
    weighted: ectsSum > 0 ? weightedSum / ectsSum : 0,
    simple: countNumeric > 0 ? simpleSum / countNumeric : 0,
    ectsSum,
    countNumeric,
  };
}

function gpaToPercent(gpa: number): number {
  if (gpa <= 2.0) return 0;
  return Math.min(100, Math.max(0, Math.round(((gpa - 2.0) / 3.0) * 100)));
}

function getStandingBadge(gpa: number, count: number): string {
  if (count === 0) return 'BRAK OCEN';
  if (gpa >= 4.5) return 'WYRÓŻNIENIE';
  if (gpa >= 4.0) return 'BARDZO DOBRY';
  if (gpa >= 3.5) return 'DOBRY WYNIK';
  return 'W TOKU';
}

export default function AcademicJournalScreen() {
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const theme = useAppTheme();

  const user = useUsosStore((s) => s.user);
  const courses = useUsosStore((s) => s.courses);
  const grades = useUsosStore((s) => s.grades);
  const simulatedGrades = useUsosStore((s) => s.simulatedGrades);
  const addSimulatedGrade = useUsosStore((s) => s.addSimulatedGrade);
  const removeSimulatedGrade = useUsosStore((s) => s.removeSimulatedGrade);

  const [tabOverride, setTabOverride] = useState<{
    forParam: string | undefined;
    tab: AcademicTab;
  } | null>(null);

  const activeTab: AcademicTab =
    tabOverride && tabOverride.forParam === tabParam
      ? tabOverride.tab
      : parseTabParam(tabParam);

  const setActiveTab = (next: AcademicTab) => {
    setTabOverride({ forParam: tabParam, tab: next });
  };

  const [courseQuery, setCourseQuery] = useState('');
  const [selectedCourseTerm, setSelectedCourseTerm] = useState<string>('ALL');
  const [selectedGradeTerm, setSelectedGradeTerm] = useState<string>('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<GradeSymbolBucket | null>(null);

  const [simName, setSimName] = useState('');
  const [simEcts, setSimEcts] = useState<number>(5);
  const [simGrade, setSimGrade] = useState<number>(5.0);

  const hapticTap = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const courseTerms = useMemo(() => {
    const unique = Array.from(new Set(courses.map((c) => c.term_id))).sort().reverse();
    return ['ALL', ...unique];
  }, [courses]);

  const gradeTerms = useMemo(() => {
    const unique = Array.from(new Set(grades.map((g) => g.term_id))).sort().reverse();
    return ['ALL', ...unique];
  }, [grades]);

  const termScopedGrades = useMemo(() => {
    if (selectedGradeTerm === 'ALL') return grades;
    return grades.filter((g) => g.term_id === selectedGradeTerm);
  }, [grades, selectedGradeTerm]);

  const displayedGrades = useMemo(() => {
    if (!selectedGradeFilter) return termScopedGrades;
    return termScopedGrades.filter(
      (g) => normalizeGradeBucket(g.value_symbol) === selectedGradeFilter
    );
  }, [termScopedGrades, selectedGradeFilter]);

  const stats = useMemo(() => {
    const base = computeGpaForGrades(termScopedGrades);
    const dist: Record<GradeSymbolBucket, number> = {
      '5': 0,
      '4,5': 0,
      '4': 0,
      '3,5': 0,
      '3': 0,
    };

    for (const g of termScopedGrades) {
      const b = normalizeGradeBucket(g.value_symbol);
      if (b) dist[b]++;
    }

    const totalDistCount = Object.values(dist).reduce((a, b) => a + b, 0);

    const allBase = computeGpaForGrades(grades);
    let simWeightedSum = allBase.weighted * allBase.ectsSum;
    let simEctsSum = allBase.ectsSum;
    for (const sg of simulatedGrades) {
      simWeightedSum += sg.grade * sg.ects;
      simEctsSum += sg.ects;
    }
    const simulatedGpa = simEctsSum > 0 ? simWeightedSum / simEctsSum : allBase.weighted;

    return {
      ...base,
      allWeighted: allBase.weighted,
      allCountNumeric: allBase.countNumeric,
      dist,
      totalDistCount,
      simulatedGpa,
      diff: simulatedGpa - allBase.weighted,
    };
  }, [termScopedGrades, grades, simulatedGrades]);

  const totalCourseEcts = useMemo(() => {
    const sum = courses.reduce((acc, c) => acc + (c.ects || 0), 0);
    return sum > 0 ? sum : stats.ectsSum;
  }, [courses, stats.ectsSum]);

  const courseSections = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    const filtered = courses.filter((c) => {
      if (selectedCourseTerm !== 'ALL' && c.term_id !== selectedCourseTerm) return false;
      if (!q) return true;
      return (
        c.course_name.pl.toLowerCase().includes(q) ||
        c.course_id.toLowerCase().includes(q) ||
        c.coordinator.toLowerCase().includes(q)
      );
    });

    const byTerm = new Map<string, UsosCourseEdition[]>();
    for (const c of filtered) {
      const bucket = byTerm.get(c.term_id) || [];
      bucket.push(c);
      byTerm.set(c.term_id, bucket);
    }

    return Array.from(byTerm.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([termId, data]) => {
        const termEcts = data.reduce((sum, item) => sum + (item.ects || 0), 0);
        return {
          title: termId,
          rightMeta: `${data.length} przedm.${termEcts > 0 ? ` · ${termEcts} ECTS` : ''}`,
          data,
        };
      });
  }, [courses, courseQuery, selectedCourseTerm]);

  const gradeSections = useMemo(() => {
    const byTerm = new Map<string, UsosGradeItem[]>();
    for (const g of displayedGrades) {
      const bucket = byTerm.get(g.term_id) || [];
      bucket.push(g);
      byTerm.set(g.term_id, bucket);
    }

    return Array.from(byTerm.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([termId, data]) => {
        const termStats = computeGpaForGrades(data);
        const termEcts = data.reduce((sum, item) => sum + (item.ects || 0), 0);
        return {
          title: termId,
          rightMeta: `${
            termStats.countNumeric > 0
              ? `Śr. ${termStats.weighted.toFixed(2)}`
              : `${data.length} wp.`
          }${termEcts > 0 ? ` · ${termEcts} ECTS` : ''}`,
          data,
        };
      });
  }, [displayedGrades]);

  const distSegments = useMemo(
    () =>
      theme.isDark
        ? [
            { sym: '5' as const, color: '#FAFAFA' },
            { sym: '4,5' as const, color: '#A1A1AA' },
            { sym: '4' as const, color: '#71717A' },
            { sym: '3,5' as const, color: '#52525B' },
            { sym: '3' as const, color: '#3F3F46' },
          ]
        : [
            { sym: '5' as const, color: '#09090B' },
            { sym: '4,5' as const, color: '#52525B' },
            { sym: '4' as const, color: '#71717A' },
            { sym: '3,5' as const, color: '#A1A1AA' },
            { sym: '3' as const, color: '#D4D4D8' },
          ],
    [theme.isDark]
  );

  const gpaBarFill = gpaToPercent(stats.weighted);
  const simBaseFill = gpaToPercent(stats.allWeighted);
  const simProjFill = gpaToPercent(stats.simulatedGpa);
  const standingLabel = getStandingBadge(stats.weighted, stats.countNumeric);

  const renderSectionHeader = (title: string, rightMeta: string) => (
    <View
      style={[
        styles.stickyWrap,
        { backgroundColor: theme.bg, borderBottomColor: theme.separator },
      ]}>
      <Text style={[styles.stickyTitle, { color: theme.textMuted }]}>SEMESTR {title}</Text>
      <Text style={[styles.stickyMeta, { color: theme.text }]}>{rightMeta}</Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <AmbientBackdrop variant="journal" />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Clean Editorial Header (matching Dziś & Plan) */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TypewriterText
              text={`SEMESTR ${user.current_term_id} · INDEKS AKADEMICKI`}
              speedMs={18}
              startDelayMs={30}
              style={[styles.monoOverline, { color: theme.textMuted }]}
              numberOfLines={1}
            />
            <Text style={[styles.title, { color: theme.text }]}>Dziennik</Text>
          </View>
        </View>

        {/* Open Flighty-style Academic Hero (NO boxy cards — pure typography + hairlines) */}
        <EditorialFade delayMs={25}>
          <View style={styles.heroWrap}>
            <HairlineDraw color={theme.separator} delayMs={20} />

            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={[styles.heroEyebrow, { color: theme.textMuted }]}>
                    ŚREDNIA WAŻONA
                  </Text>
                  <AnimatedNumberText
                    value={stats.countNumeric > 0 ? stats.weighted.toFixed(2) : '—'}
                    durationMs={400}
                    style={[styles.heroGpaNumber, { color: theme.text }]}
                  />
                </View>

                <View style={styles.heroRightMeta}>
                  <View style={[styles.standingPill, { backgroundColor: theme.primary }]}>
                    <ScrambleText
                      text={standingLabel}
                      durationMs={340}
                      style={[styles.standingPillText, { color: theme.primaryContrast }]}
                    />
                  </View>
                  <View style={styles.gpaScaleWrap}>
                    <View style={[styles.gpaTrack, { backgroundColor: theme.primarySoft }]}>
                      <View
                        style={[
                          styles.gpaFill,
                          { width: `${gpaBarFill}%`, backgroundColor: theme.primary },
                        ]}
                      />
                    </View>
                    <View style={styles.gpaTicksRow}>
                      <Text style={[styles.gpaTick, { color: theme.textMuted }]}>2.0</Text>
                      <Text style={[styles.gpaTick, { color: theme.textMuted }]}>5.0</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 3-Column Open Telemetry Row (identical rhythm to Dziś: GODZINA | SALA | FORMA) */}
              <View style={styles.telemetryGrid}>
                <View style={styles.telemetryCell}>
                  <Text style={[styles.telemetryLabel, { color: theme.textMuted }]}>
                    ARYTMETYCZNA
                  </Text>
                  <Text style={[styles.telemetryValue, { color: theme.text }]}>
                    {stats.countNumeric > 0 ? stats.simple.toFixed(2) : '—'}
                  </Text>
                </View>

                <View style={[styles.telemetryDivider, { backgroundColor: theme.separator }]} />

                <View style={styles.telemetryCell}>
                  <Text style={[styles.telemetryLabel, { color: theme.textMuted }]}>ECTS</Text>
                  <Text style={[styles.telemetryValue, { color: theme.text }]}>
                    {activeTab === 'courses' ? totalCourseEcts : stats.ectsSum}
                  </Text>
                </View>

                <View style={[styles.telemetryDivider, { backgroundColor: theme.separator }]} />

                <View style={styles.telemetryCell}>
                  <Text style={[styles.telemetryLabel, { color: theme.textMuted }]}>WPISY</Text>
                  <Text style={[styles.telemetryValue, { color: theme.textSecondary }]}>
                    {grades.length} / {courses.length}
                  </Text>
                </View>
              </View>
            </View>

            <HairlineDraw color={theme.separator} delayMs={80} />
          </View>
        </EditorialFade>

        {/* 3-Way Switcher */}
        <View style={styles.segmentWrap}>
          <SegmentedControl<AcademicTab>
            options={[
              { label: 'Przedmioty', value: 'courses', badge: courses.length },
              { label: 'Oceny', value: 'grades', badge: grades.length },
              { label: 'Symulator', value: 'simulator' },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </View>

        {/* TAB 1: PRZEDMIOTY (timeline accent bar style matching Plan) */}
        {activeTab === 'courses' && (
          <SectionList
            sections={courseSections}
            keyExtractor={(item) => `${item.term_id}_${item.course_id}`}
            stickySectionHeadersEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.filterHeader}>
                <View
                  style={[
                    styles.searchBar,
                    {
                      backgroundColor: theme.bgSecondary,
                      borderColor: theme.separator,
                    },
                  ]}>
                  <Ionicons name="search" size={15} color={theme.textMuted} />
                  <TextInput
                    value={courseQuery}
                    onChangeText={setCourseQuery}
                    placeholder="Szukaj przedmiotu, kodu lub prowadzącego..."
                    placeholderTextColor={theme.textMuted}
                    style={[styles.searchInput, { color: theme.text }]}
                  />
                  {courseQuery.length > 0 && (
                    <Pressable onPress={() => setCourseQuery('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={15} color={theme.textMuted} />
                    </Pressable>
                  )}
                </View>

                {courseTerms.length > 2 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.termsRow}>
                    {courseTerms.map((t) => {
                      const active = selectedCourseTerm === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => {
                            hapticTap();
                            setSelectedCourseTerm(t);
                          }}
                          style={[
                            styles.termChip,
                            {
                              backgroundColor: active ? theme.primary : theme.primarySoft,
                              borderColor: active ? theme.primary : theme.separator,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.termChipText,
                              { color: active ? theme.primaryContrast : theme.textSecondary },
                            ]}>
                            {t === 'ALL' ? 'Wszystkie' : t}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            }
            renderSectionHeader={({ section }) =>
              renderSectionHeader(section.title, section.rightMeta)
            }
            renderItem={({ item, index, section }) => {
              const shortTypes = Array.from(
                new Set(item.groups.map((g) => getClassTypeShort(g.class_type_id)))
              );
              const barColor =
                item.passing_status === 'failed'
                  ? theme.danger
                  : item.passing_status === 'passed'
                  ? theme.text
                  : theme.textMuted;

              return (
                <Pressable
                  onPress={() => {
                    hapticTap();
                    router.push(`/modal/course/${item.course_id}`);
                  }}
                  style={({ pressed }) => [
                    styles.courseRow,
                    index < section.data.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.separator,
                    },
                    pressed && { opacity: 0.7 },
                  ]}>
                  {/* Vertical monochrome bar (consistent with Plan timeline rows) */}
                  <View style={[styles.courseAccentBar, { backgroundColor: barColor }]} />

                  <View style={styles.courseMainCol}>
                    <View style={styles.courseMetaTopRow}>
                      <Text style={[styles.courseCodeMono, { color: theme.textMuted }]}>
                        {item.course_id}
                      </Text>
                      {shortTypes.length > 0 && (
                        <View style={styles.typeChipsInline}>
                          {shortTypes.slice(0, 3).map((st) => (
                            <View
                              key={st}
                              style={[styles.microTag, { backgroundColor: theme.primarySoft }]}>
                              <Text style={[styles.microTagText, { color: theme.textSecondary }]}>
                                {st}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <Text style={[styles.gradeCourseName, { color: theme.text }]} numberOfLines={2}>
                      {item.course_name.pl}
                    </Text>

                    <Text
                      style={[styles.gradeSubMeta, { color: theme.textSecondary }]}
                      numberOfLines={1}>
                      {item.coordinator || 'Koordynator USOS'}
                    </Text>
                  </View>

                  <View style={styles.courseRightCol}>
                    {item.final_grade ? (
                      <GradeBadge symbol={item.final_grade} size="xs" />
                    ) : null}
                    {item.ects > 0 && (
                      <Text style={[styles.ectsInlineMono, { color: theme.textMuted }]}>
                        {item.ects} ECTS
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBlock}>
                <Ionicons name="book-outline" size={28} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Brak przedmiotów</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  {courseQuery
                    ? `Nie znaleziono przedmiotów dla „${courseQuery}”.`
                    : 'Lista przedmiotów aktualizuje się automatycznie z USOS.'}
                </Text>
              </View>
            }
          />
        )}

        {/* TAB 2: OCENY WITH INTERACTIVE SPECTRUM FILTER */}
        {activeTab === 'grades' && (
          <SectionList
            sections={gradeSections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.filterHeader}>
                {gradeTerms.length > 2 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.termsRow}>
                    {gradeTerms.map((t) => {
                      const active = selectedGradeTerm === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => {
                            hapticTap();
                            setSelectedGradeTerm(t);
                          }}
                          style={[
                            styles.termChip,
                            {
                              backgroundColor: active ? theme.primary : theme.primarySoft,
                              borderColor: active ? theme.primary : theme.separator,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.termChipText,
                              { color: active ? theme.primaryContrast : theme.textSecondary },
                            ]}>
                            {t === 'ALL' ? 'Wszystkie' : t}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                {stats.totalDistCount > 0 && (
                  <View style={[styles.distStrip, { borderBottomColor: theme.separator }]}>
                    <View style={[styles.distTrack, { backgroundColor: theme.bgSecondary }]}>
                      {distSegments.map(({ sym, color }) => {
                        const count = stats.dist[sym];
                        if (count === 0) return null;
                        const dimmed = selectedGradeFilter !== null && selectedGradeFilter !== sym;
                        return (
                          <View
                            key={sym}
                            style={{
                              flex: count,
                              height: '100%',
                              backgroundColor: color,
                              opacity: dimmed ? 0.2 : 1,
                              borderRadius: 3,
                            }}
                          />
                        );
                      })}
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.distLegendRow}>
                      {distSegments.map(({ sym, color }) => {
                        const count = stats.dist[sym];
                        if (count === 0) return null;
                        const active = selectedGradeFilter === sym;
                        return (
                          <Pressable
                            key={sym}
                            onPress={() => {
                              hapticTap();
                              setSelectedGradeFilter((prev) => (prev === sym ? null : sym));
                            }}
                            style={[
                              styles.distFilterPill,
                              {
                                backgroundColor: active ? theme.primary : theme.primarySoft,
                                borderColor: active ? theme.primary : theme.separator,
                              },
                            ]}>
                            <View
                              style={[
                                styles.distDot,
                                { backgroundColor: active ? theme.primaryContrast : color },
                              ]}
                            />
                            <Text
                              style={[
                                styles.distLegendText,
                                { color: active ? theme.primaryContrast : theme.text },
                              ]}>
                              {sym} · ×{count}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            }
            renderSectionHeader={({ section }) =>
              renderSectionHeader(section.title, section.rightMeta)
            }
            renderItem={({ item, index, section }) => {
              const subtitleLine = [
                item.class_type || 'Protokół',
                `T${item.exam_session_number}`,
                item.author_name,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <Pressable
                  onPress={() => {
                    hapticTap();
                    router.push(`/modal/course/${item.course_id}`);
                  }}
                  style={({ pressed }) => [
                    styles.gradeRow,
                    index < section.data.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.separator,
                    },
                    pressed && { opacity: 0.7 },
                  ]}>
                  <GradeBadge symbol={item.value_symbol} size="sm" />

                  <View style={styles.gradeTextCol}>
                    <Text style={[styles.gradeCourseName, { color: theme.text }]} numberOfLines={2}>
                      {item.course_name.pl}
                    </Text>
                    <Text
                      style={[styles.gradeSubMeta, { color: theme.textSecondary }]}
                      numberOfLines={1}>
                      {subtitleLine}
                    </Text>
                    {item.comment ? (
                      <Text
                        style={[styles.gradeComment, { color: theme.textMuted }]}
                        numberOfLines={1}>
                        „{item.comment}”
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.gradeRightCol}>
                    {item.ects > 0 && (
                      <Text style={[styles.gradeEctsMono, { color: theme.text }]}>
                        {item.ects} ECTS
                      </Text>
                    )}
                    {item.date_modified ? (
                      <Text style={[styles.gradeDateMono, { color: theme.textMuted }]}>
                        {item.date_modified.slice(0, 10)}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBlock}>
                <Ionicons name="ribbon-outline" size={28} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Brak wpisanych ocen</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  {selectedGradeFilter
                    ? `Brak ocen „${selectedGradeFilter}” w wybranym okresie.`
                    : 'W wybranym okresie nie ma jeszcze opublikowanych ocen w protokołach USOS.'}
                </Text>
              </View>
            }
          />
        )}

        {/* TAB 3: SYMULATOR GPA (Open Editorial Gauge + 1-Tap Presets) */}
        {activeTab === 'simulator' && (
          <ScrollView
            contentContainerStyle={styles.simScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={[styles.simHeroBlock, { borderBottomColor: theme.separator }]}>
              <View style={styles.simTopRow}>
                <View>
                  <Text style={[styles.simOverline, { color: theme.textMuted }]}>
                    PROGNOZOWANA ŚREDNIA
                  </Text>
                  <AnimatedNumberText
                    value={stats.simulatedGpa > 0 ? stats.simulatedGpa.toFixed(2) : '—'}
                    durationMs={320}
                    style={[styles.simBigValue, { color: theme.text }]}
                  />
                </View>

                <View
                  style={[
                    styles.diffPill,
                    {
                      backgroundColor:
                        stats.diff > 0
                          ? theme.successSoft
                          : stats.diff < 0
                          ? theme.dangerSoft
                          : theme.primarySoft,
                    },
                  ]}>
                  <Ionicons
                    name={
                      stats.diff > 0
                        ? 'trending-up'
                        : stats.diff < 0
                        ? 'trending-down'
                        : 'remove'
                    }
                    size={14}
                    color={
                      stats.diff > 0
                        ? theme.success
                        : stats.diff < 0
                        ? theme.danger
                        : theme.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.diffPillText,
                      {
                        color:
                          stats.diff > 0
                            ? theme.success
                            : stats.diff < 0
                            ? theme.danger
                            : theme.textSecondary,
                      },
                    ]}>
                    {stats.diff >= 0 ? '+' : ''}
                    {stats.diff.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.gaugeWrap}>
                <View style={[styles.gaugeTrack, { backgroundColor: theme.primarySoft }]}>
                  <View
                    style={[
                      styles.gaugeFill,
                      {
                        width: `${simProjFill}%`,
                        backgroundColor:
                          stats.diff > 0
                            ? theme.success
                            : stats.diff < 0
                            ? theme.danger
                            : theme.primary,
                      },
                    ]}
                  />
                  {stats.allCountNumeric > 0 && (
                    <View
                      style={[
                        styles.baselineMarker,
                        {
                          left: `${simBaseFill}%`,
                          backgroundColor: theme.text,
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.gaugeLabels}>
                  <Text style={[styles.gaugeTick, { color: theme.textMuted }]}>2.0</Text>
                  <Text style={[styles.gaugeTick, { color: theme.textSecondary }]}>
                    Bazowa {stats.allCountNumeric > 0 ? stats.allWeighted.toFixed(2) : '—'}
                  </Text>
                  <Text style={[styles.gaugeTick, { color: theme.textMuted }]}>5.0</Text>
                </View>
              </View>
            </View>

            <SectionHeader title="Szybkie scenariusze" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsRow}
              style={styles.presetsScroll}>
              {[
                { label: '+ 5.0 (5 ECTS)', grade: 5.0, ects: 5 },
                { label: '+ 4.5 (5 ECTS)', grade: 4.5, ects: 5 },
                { label: '+ 4.0 (4 ECTS)', grade: 4.0, ects: 4 },
                { label: '+ 3.0 (3 ECTS)', grade: 3.0, ects: 3 },
              ].map((preset) => (
                <GlassSurface
                  key={preset.label}
                  radius={999}
                  interactive
                  onPress={() =>
                    addSimulatedGrade(
                      `Scenariusz ${preset.grade.toFixed(1)}`,
                      preset.ects,
                      preset.grade
                    )
                  }
                  contentStyle={styles.presetPill}>
                  <Text style={[styles.presetPillText, { color: theme.text }]}>{preset.label}</Text>
                </GlassSurface>
              ))}
            </ScrollView>

            <SectionHeader title="Własna pozycja" />

            <View style={styles.simForm}>
              <View
                style={[
                  styles.simInputWrap,
                  { backgroundColor: theme.bgSecondary, borderColor: theme.separator },
                ]}>
                <TextInput
                  value={simName}
                  onChangeText={setSimName}
                  placeholder="Nazwa przedmiotu (opcjonalnie)"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.simInput, { color: theme.text }]}
                />
              </View>

              <View style={styles.choiceGroup}>
                <Text style={[styles.choiceLabel, { color: theme.textMuted }]}>OCENA</Text>
                <View style={styles.choiceRow}>
                  {[3.0, 3.5, 4.0, 4.5, 5.0].map((val) => {
                    const active = simGrade === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => {
                          hapticTap();
                          setSimGrade(val);
                        }}
                        style={[
                          styles.choicePill,
                          {
                            backgroundColor: active ? theme.primary : theme.primarySoft,
                            borderColor: active ? theme.primary : theme.separator,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.choicePillText,
                            { color: active ? theme.primaryContrast : theme.text },
                          ]}>
                          {val.toFixed(1)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.choiceGroup}>
                <Text style={[styles.choiceLabel, { color: theme.textMuted }]}>WAGA ECTS</Text>
                <View style={styles.choiceRow}>
                  {[2, 3, 4, 5, 6, 8].map((ectsVal) => {
                    const active = simEcts === ectsVal;
                    return (
                      <Pressable
                        key={ectsVal}
                        onPress={() => {
                          hapticTap();
                          setSimEcts(ectsVal);
                        }}
                        style={[
                          styles.choicePill,
                          {
                            backgroundColor: active ? theme.primary : theme.primarySoft,
                            borderColor: active ? theme.primary : theme.separator,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.choicePillText,
                            { color: active ? theme.primaryContrast : theme.text },
                          ]}>
                          {ectsVal}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }
                  addSimulatedGrade(simName, simEcts, simGrade);
                  setSimName('');
                }}
                style={({ pressed }) => [
                  styles.addSimBtn,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                ]}>
                <Ionicons name="add" size={18} color={theme.primaryContrast} />
                <Text style={[styles.addSimBtnText, { color: theme.primaryContrast }]}>
                  Dodaj do symulacji
                </Text>
              </Pressable>
            </View>

            {simulatedGrades.length > 0 && (
              <>
                <SectionHeader title={`Prognozowane pozycje (${simulatedGrades.length})`} />
                {simulatedGrades.map((sg, idx) => (
                  <ListRow
                    key={sg.id}
                    dense
                    title={sg.name}
                    subtitle={`Waga: ${sg.ects} ECTS · Ocena ${sg.grade.toFixed(1)}`}
                    left={
                      <GradeBadge symbol={sg.grade.toFixed(1).replace('.0', '')} size="xs" />
                    }
                    right={
                      <Pressable
                        onPress={() => {
                          hapticTap();
                          removeSimulatedGrade(sg.id);
                        }}
                        hitSlop={10}
                        style={[styles.trashBtn, { backgroundColor: theme.dangerSoft }]}>
                        <Ionicons name="trash-outline" size={15} color={theme.danger} />
                      </Pressable>
                    }
                    showDivider={idx < simulatedGrades.length - 1}
                  />
                ))}
              </>
            )}
          </ScrollView>
        )}
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
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
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
  refreshBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  heroInner: {
    paddingVertical: 14,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroEyebrow: {
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  heroGpaNumber: {
    fontFamily: MONO_FONT,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.4,
    lineHeight: 44,
    marginTop: 1,
  },
  heroRightMeta: {
    alignItems: 'flex-end',
    gap: 9,
    flex: 1,
    maxWidth: 165,
  },
  standingPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  standingPillText: {
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  gpaScaleWrap: {
    width: '100%',
    gap: 3,
  },
  gpaTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  gpaFill: {
    height: '100%',
    borderRadius: 2,
  },
  gpaTicksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gpaTick: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '600',
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
  segmentWrap: {
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 112,
  },
  filterHeader: {
    gap: 10,
    paddingTop: 4,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
  },
  termsRow: {
    gap: 7,
  },
  termChip: {
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  termChipText: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '700',
  },
  stickyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyTitle: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stickyMeta: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '700',
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 14,
    gap: 11,
  },
  courseAccentBar: {
    width: 2.5,
    borderRadius: 2,
    marginVertical: 2,
    flexShrink: 0,
  },
  courseMainCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  courseMetaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  courseCodeMono: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '600',
  },
  typeChipsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  microTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  microTagText: {
    fontFamily: MONO_FONT,
    fontSize: 8.5,
    fontWeight: '700',
  },
  courseRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
  },
  ectsInlineMono: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
  },
  distStrip: {
    gap: 9,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  distTrack: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    gap: 2.5,
  },
  distLegendRow: {
    gap: 7,
  },
  distFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  distDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  distLegendText: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '700',
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  gradeTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2.5,
  },
  gradeCourseName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.25,
    lineHeight: 20,
  },
  gradeSubMeta: {
    fontSize: 12.5,
  },
  gradeComment: {
    fontSize: 11.5,
    fontStyle: 'italic',
    marginTop: 2,
  },
  gradeRightCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 2,
  },
  gradeEctsMono: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '700',
  },
  gradeDateMono: {
    fontFamily: MONO_FONT,
    fontSize: 10,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 7,
  },
  emptyTitle: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 270,
    lineHeight: 19,
  },
  simScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 112,
  },
  simHeroBlock: {
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  simTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  simOverline: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  simBigValue: {
    fontFamily: MONO_FONT,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.3,
    marginTop: 2,
  },
  diffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  diffPillText: {
    fontFamily: MONO_FONT,
    fontSize: 12.5,
    fontWeight: '800',
  },
  gaugeWrap: {
    gap: 6,
  },
  gaugeTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'visible',
    justifyContent: 'center',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 3,
  },
  baselineMarker: {
    position: 'absolute',
    width: 2,
    height: 12,
    borderRadius: 1,
    top: -3,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeTick: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '600',
  },
  presetsScroll: {
    marginHorizontal: -18,
  },
  presetsRow: {
    paddingHorizontal: 18,
    gap: 8,
    paddingVertical: 2,
  },
  presetPill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  presetPillText: {
    fontFamily: MONO_FONT,
    fontSize: 11.5,
    fontWeight: '700',
  },
  simForm: {
    gap: 14,
    marginTop: 2,
  },
  simInputWrap: {
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  simInput: {
    fontSize: 14,
  },
  choiceGroup: {
    gap: 7,
  },
  choiceLabel: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 7,
  },
  choicePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  choicePillText: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    fontWeight: '700',
  },
  addSimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    marginTop: 2,
  },
  addSimBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
