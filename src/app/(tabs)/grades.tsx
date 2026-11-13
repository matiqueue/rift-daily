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
import { SegmentedControl } from '@/components/SegmentedControl';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';

export default function GradesScreen() {
  const theme = useAppTheme();
  const grades = useUsosStore((s) => s.grades);
  const isSyncing = useUsosStore((s) => s.isSyncing);
  const syncFromLiveApi = useUsosStore((s) => s.syncFromLiveApi);
  const simulatedGrades = useUsosStore((s) => s.simulatedGrades);
  const addSimulatedGrade = useUsosStore((s) => s.addSimulatedGrade);
  const removeSimulatedGrade = useUsosStore((s) => s.removeSimulatedGrade);

  const [tab, setTab] = useState<'list' | 'simulator'>('list');
  const [selectedTerm, setSelectedTerm] = useState<string>('ALL');

  const [simName, setSimName] = useState('');
  const [simEcts, setSimEcts] = useState<number>(5);
  const [simGrade, setSimGrade] = useState<number>(5.0);

  const terms = useMemo(() => {
    const unique = Array.from(new Set(grades.map((g) => g.term_id))).sort().reverse();
    return ['ALL', ...unique];
  }, [grades]);

  const filteredGrades = useMemo(() => {
    if (selectedTerm === 'ALL') return grades;
    return grades.filter((g) => g.term_id === selectedTerm);
  }, [grades, selectedTerm]);

  const stats = useMemo(() => {
    let weightedSum = 0;
    let ectsSum = 0;
    let simpleSum = 0;
    let countNumeric = 0;

    const dist: Record<string, number> = {
      '5': 0,
      '4,5': 0,
      '4': 0,
      '3,5': 0,
      '3': 0,
    };

    for (const g of filteredGrades) {
      if (g.value_numeric !== null) {
        simpleSum += g.value_numeric;
        countNumeric++;
        const weight = g.ects > 0 ? g.ects : 1;
        weightedSum += g.value_numeric * weight;
        ectsSum += weight;
      }
      const normSym = g.value_symbol.replace('.0', '').replace('.', ',');
      if (dist[normSym] !== undefined) {
        dist[normSym]++;
      }
    }

    const weightedGpa = ectsSum > 0 ? weightedSum / ectsSum : 0;
    const simpleGpa = countNumeric > 0 ? simpleSum / countNumeric : 0;

    let simWeightedSum = weightedSum;
    let simEctsSum = ectsSum;
    for (const sg of simulatedGrades) {
      simWeightedSum += sg.grade * sg.ects;
      simEctsSum += sg.ects;
    }
    const simulatedGpa = simEctsSum > 0 ? simWeightedSum / simEctsSum : weightedGpa;

    return {
      weightedGpa,
      simpleGpa,
      ectsSum,
      countNumeric,
      dist,
      simulatedGpa,
      diff: simulatedGpa - weightedGpa,
    };
  }, [filteredGrades, simulatedGrades]);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.monoOverline, { color: theme.textSecondary }]}>
              PROTOKOŁY OCEN • {grades.length} WPISÓW
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>Oceny i średnia</Text>
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

        <View style={styles.topControl}>
          <SegmentedControl
            options={[
              { label: 'Wykaz ocen', value: 'list', badge: grades.length },
              { label: 'Symulator ECTS', value: 'simulator' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>

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
          {/* Bento Summary Row */}
          <View style={styles.bentoRow}>
            <GlassCard elevated style={styles.bentoMainCard} padding={18}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                ŚREDNIA WAŻONA (GPA)
              </Text>
              <Text style={[styles.summaryBigValue, { color: theme.text }]}>
                {stats.countNumeric > 0 ? stats.weightedGpa.toFixed(2) : '—'}
              </Text>
              <Text style={[styles.summarySub, { color: theme.textSecondary }]}>
                Arytmetyczna: {stats.countNumeric > 0 ? stats.simpleGpa.toFixed(2) : '—'}
              </Text>
            </GlassCard>

            <View style={styles.bentoRightStack}>
              <GlassCard style={styles.bentoMini} padding={13}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>WPISY</Text>
                <Text style={[styles.bentoMiniNum, { color: theme.text }]}>{grades.length}</Text>
              </GlassCard>
              <GlassCard style={styles.bentoMini} padding={13}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>ECTS</Text>
                <Text style={[styles.bentoMiniNum, { color: theme.text }]}>{stats.ectsSum}</Text>
              </GlassCard>
            </View>
          </View>

          {tab === 'list' ? (
            <>
              {/* Semester Filter */}
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
                          {t === 'ALL' ? 'WSZYSTKIE SEMESTRY' : `SEMESTR ${t}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Grade Distribution Chart */}
              {stats.countNumeric > 0 && (
                <GlassCard style={styles.distCard}>
                  <Text style={[styles.cardSectionTitle, { color: theme.textSecondary }]}>
                    ROZKŁAD TWOICH OCEN
                  </Text>
                  <View style={styles.barsContainer}>
                    {(['5', '4,5', '4', '3,5', '3'] as const).map((sym) => {
                      const count = stats.dist[sym] || 0;
                      const maxCount = Math.max(1, ...Object.values(stats.dist));
                      const ratio = Math.round((count / maxCount) * 100);
                      return (
                        <View key={sym} style={styles.barRow}>
                          <Text style={[styles.barSymbol, { color: theme.text }]}>{sym}</Text>
                          <View
                            style={[
                              styles.barTrack,
                              { backgroundColor: theme.bgSecondary },
                            ]}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  width: `${Math.max(ratio, count > 0 ? 12 : 0)}%`,
                                  backgroundColor:
                                    sym === '5'
                                      ? theme.success
                                      : sym === '4,5' || sym === '4'
                                      ? theme.text
                                      : theme.warning,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.barCount, { color: theme.textSecondary }]}>
                            {count}x
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </GlassCard>
              )}

              {/* Grades List */}
              {filteredGrades.length === 0 ? (
                <GlassCard style={styles.emptyCard}>
                  <Ionicons name="ribbon-outline" size={34} color={theme.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    Brak wpisanych ocen
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                    W wybranym okresie nie ma jeszcze opublikowanych ocen w protokołach USOS.
                    Pociągnij ekran w dół, aby odświeżyć dane.
                  </Text>
                </GlassCard>
              ) : (
                <View style={styles.listWrap}>
                  {filteredGrades.map((grade) => (
                    <GlassCard
                      key={grade.id}
                      padding={15}
                      onPress={() => router.push(`/modal/course/${grade.course_id}`)}>
                      <View style={styles.gradeItemRow}>
                        <GradeBadge symbol={grade.value_symbol} size="lg" />
                        <View style={{ flex: 1 }}>
                          <View style={styles.gradeTopMeta}>
                            <Text style={[styles.termTag, { color: theme.textSecondary }]}>
                              SEM {grade.term_id}
                              {grade.ects > 0 ? ` • ${grade.ects} ECTS` : ''}
                            </Text>
                            <Text style={[styles.dateTag, { color: theme.textMuted }]}>
                              {grade.date_modified}
                            </Text>
                          </View>

                          <Text style={[styles.courseTitle, { color: theme.text }]}>
                            {grade.course_name.pl}
                          </Text>

                          {/* Teacher Row with Avatar */}
                          <View style={styles.authorRow}>
                            <Avatar
                              name={grade.author_name}
                              uri={grade.author_photo}
                              size={24}
                            />
                            <Text
                              style={[styles.authorText, { color: theme.textSecondary }]}
                              numberOfLines={1}>
                              {grade.author_name} • Termin {grade.exam_session_number}
                            </Text>
                          </View>

                          {grade.comment && (
                            <View
                              style={[
                                styles.commentPill,
                                { backgroundColor: theme.bgSecondary },
                              ]}>
                              <Ionicons
                                name="information-circle"
                                size={13}
                                color={theme.textSecondary}
                              />
                              <Text
                                style={[styles.commentText, { color: theme.textSecondary }]}
                                numberOfLines={2}>
                                {grade.comment}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}
            </>
          ) : (
            /* What-If ECTS GPA Simulator */
            <View style={styles.simContainer}>
              <GlassCard elevated style={styles.simResultCard}>
                <View style={styles.simResultRow}>
                  <View>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                      SYMULOWANA ŚREDNIA OCEN
                    </Text>
                    <Text style={[styles.simBigGpa, { color: theme.text }]}>
                      {stats.simulatedGpa.toFixed(2)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.diffBadge,
                      {
                        backgroundColor:
                          stats.diff >= 0 ? theme.successSoft : theme.dangerSoft,
                      },
                    ]}>
                    <Ionicons
                      name={stats.diff >= 0 ? 'trending-up' : 'trending-down'}
                      size={18}
                      color={stats.diff >= 0 ? theme.success : theme.danger}
                    />
                    <Text
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: 14,
                        fontWeight: '800',
                        color: stats.diff >= 0 ? theme.success : theme.danger,
                      }}>
                      {stats.diff >= 0 ? '+' : ''}
                      {stats.diff.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.simHint, { color: theme.textSecondary }]}>
                  Dodaj prognozowane oceny z trwającego semestru, aby sprawdzić jak wpłyną na Twoją
                  średnią.
                </Text>
              </GlassCard>

              <GlassCard style={styles.simFormCard}>
                <Text style={[styles.cardSectionTitle, { color: theme.textSecondary }]}>
                  DODAJ PROGNOZOWANĄ OCENĘ
                </Text>
                <TextInput
                  value={simName}
                  onChangeText={setSimName}
                  placeholder="Nazwa przedmiotu"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.simInput,
                    {
                      backgroundColor: theme.bgSecondary,
                      color: theme.text,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                />

                <Text style={[styles.simFieldLabel, { color: theme.textSecondary }]}>
                  Wybierz ocenę końcową:
                </Text>
                <View style={styles.pillChoicesRow}>
                  {[3.0, 3.5, 4.0, 4.5, 5.0].map((val) => {
                    const active = simGrade === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setSimGrade(val)}
                        style={[
                          styles.choicePill,
                          {
                            backgroundColor: active ? theme.primary : theme.bgSecondary,
                            borderColor: active ? theme.primary : theme.cardBorder,
                          },
                        ]}>
                        <Text
                          style={{
                            fontFamily: MONO_FONT,
                            color: active ? theme.primaryContrast : theme.text,
                            fontWeight: '800',
                            fontSize: 13,
                          }}>
                          {val.toFixed(1)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.simFieldLabel, { color: theme.textSecondary }]}>
                  Waga punktów ECTS:
                </Text>
                <View style={styles.pillChoicesRow}>
                  {[2, 3, 4, 5, 6, 8].map((ectsVal) => {
                    const active = simEcts === ectsVal;
                    return (
                      <Pressable
                        key={ectsVal}
                        onPress={() => setSimEcts(ectsVal)}
                        style={[
                          styles.choicePill,
                          {
                            backgroundColor: active ? theme.primary : theme.bgSecondary,
                            borderColor: active ? theme.primary : theme.cardBorder,
                          },
                        ]}>
                        <Text
                          style={{
                            fontFamily: MONO_FONT,
                            color: active ? theme.primaryContrast : theme.text,
                            fontWeight: '700',
                            fontSize: 12,
                          }}>
                          {ectsVal} ECTS
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    }
                    addSimulatedGrade(simName, simEcts, simGrade);
                    setSimName('');
                  }}
                  style={[styles.addSimBtn, { backgroundColor: theme.primary }]}>
                  <Ionicons name="add-circle" size={18} color={theme.primaryContrast} />
                  <Text style={[styles.addSimBtnText, { color: theme.primaryContrast }]}>
                    Dodaj do symulacji
                  </Text>
                </Pressable>
              </GlassCard>

              {simulatedGrades.map((sg) => (
                <GlassCard key={sg.id} padding={14}>
                  <View style={styles.simItemRow}>
                    <GradeBadge symbol={sg.grade.toFixed(1).replace('.0', '')} size="sm" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.courseTitle, { color: theme.text }]}>
                        {sg.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                        Waga: {sg.ects} ECTS • Ocena symulowana: {sg.grade.toFixed(1)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeSimulatedGrade(sg.id)}
                      style={[styles.trashBtn, { backgroundColor: theme.dangerSoft }]}>
                      <Ionicons name="trash-outline" size={16} color={theme.danger} />
                    </Pressable>
                  </View>
                </GlassCard>
              ))}
            </View>
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
    paddingBottom: 12,
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
  topControl: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 118,
    gap: 12,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoMainCard: {
    flex: 1.35,
    justifyContent: 'space-between',
  },
  bentoRightStack: {
    flex: 0.85,
    gap: 10,
  },
  bentoMini: {
    flex: 1,
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  summaryBigValue: {
    fontFamily: MONO_FONT,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginVertical: 4,
  },
  summarySub: {
    fontSize: 12,
    fontWeight: '600',
  },
  bentoMiniNum: {
    fontFamily: MONO_FONT,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
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
  distCard: {
    gap: 10,
  },
  cardSectionTitle: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  barsContainer: {
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barSymbol: {
    fontFamily: MONO_FONT,
    width: 30,
    fontSize: 12,
    fontWeight: '800',
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barCount: {
    fontFamily: MONO_FONT,
    width: 30,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  listWrap: {
    gap: 10,
  },
  gradeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gradeTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  termTag: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateTag: {
    fontFamily: MONO_FONT,
    fontSize: 10,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 5,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  commentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  commentText: {
    flex: 1,
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
  simContainer: {
    gap: 12,
  },
  simResultCard: {
    gap: 8,
  },
  simResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simBigGpa: {
    fontFamily: MONO_FONT,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 2,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  simHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  simFormCard: {
    gap: 10,
  },
  simInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
  },
  simFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  pillChoicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    flex: 1,
    minWidth: 52,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  addSimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 15,
    marginTop: 4,
  },
  addSimBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  simItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trashBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
