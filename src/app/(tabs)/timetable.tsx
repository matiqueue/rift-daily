import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';
import { getNextClassHighlight } from '@/utils/timetableUtils';

const WEEKDAYS = [
  { day: 1, short: 'Pon', full: 'Poniedziałek' },
  { day: 2, short: 'Wt', full: 'Wtorek' },
  { day: 3, short: 'Śr', full: 'Środa' },
  { day: 4, short: 'Czw', full: 'Czwartek' },
  { day: 5, short: 'Pt', full: 'Piątek' },
  { day: 6, short: 'Sob', full: 'Sobota' },
  { day: 7, short: 'Ndz', full: 'Niedziela' },
];

export default function TimetableScreen() {
  const theme = useAppTheme();
  const timetable = useUsosStore((s) => s.timetable);
  const timetableWeekOffset = useUsosStore((s) => s.timetableWeekOffset);
  const changeTimetableWeek = useUsosStore((s) => s.changeTimetableWeek);
  const syncFromLiveApi = useUsosStore((s) => s.syncFromLiveApi);
  const isSyncing = useUsosStore((s) => s.isSyncing);

  const nextClassInfo = useMemo(() => getNextClassHighlight(timetable), [timetable]);

  const initialDay = useMemo(() => {
    if (nextClassInfo) return nextClassInfo.activity.day_of_week;
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 1 : jsDay > 5 ? 1 : jsDay;
  }, [nextClassInfo]);

  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  useEffect(() => {
    if (nextClassInfo) {
      const currentDayHasClasses = timetable.some((t) => t.day_of_week === selectedDay);
      if (!currentDayHasClasses) {
        setSelectedDay(nextClassInfo.activity.day_of_week);
      }
    }
  }, [nextClassInfo, timetable]);

  const visibleDays = useMemo(() => {
    const hasWeekend = timetable.some((t) => t.day_of_week >= 6);
    return hasWeekend ? WEEKDAYS : WEEKDAYS.slice(0, 5);
  }, [timetable]);

  const filteredActivities = useMemo(() => {
    return timetable
      .filter((item) => (viewMode === 'day' ? item.day_of_week === selectedDay : true))
      .sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.start_time.localeCompare(b.start_time);
      });
  }, [timetable, selectedDay, viewMode]);

  const weekLabel = useMemo(() => {
    if (timetableWeekOffset === 0) return 'BIEŻĄCY TYDZIEŃ';
    if (timetableWeekOffset === 1) return 'NASTĘPNY TYDZIEŃ (+1)';
    if (timetableWeekOffset === -1) return 'POPRZEDNI TYDZIEŃ (-1)';
    return `TYDZIEŃ (${timetableWeekOffset > 0 ? `+${timetableWeekOffset}` : timetableWeekOffset})`;
  }, [timetableWeekOffset]);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header with Week Switcher */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.monoOverline, { color: theme.textSecondary }]}>
              {weekLabel} • {timetable.length} ZAJĘĆ
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>Plan zajęć</Text>
          </View>

          <View style={styles.weekControls}>
            <Pressable
              onPress={() => changeTimetableWeek(-1)}
              style={[
                styles.weekBtn,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}>
              <Ionicons name="chevron-back" size={17} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={() => changeTimetableWeek(0)}
              style={[
                styles.weekBtn,
                { backgroundColor: theme.primarySoft, borderColor: theme.cardBorder },
              ]}>
              <Text style={[styles.todayBtnText, { color: theme.text }]}>DZIŚ</Text>
            </Pressable>
            <Pressable
              onPress={() => changeTimetableWeek(1)}
              style={[
                styles.weekBtn,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}>
              <Ionicons name="chevron-forward" size={17} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.controlsWrap}>
          <SegmentedControl
            options={[
              { label: 'Widok dnia', value: 'day' },
              { label: 'Cały tydzień', value: 'week', badge: timetable.length },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />

          {viewMode === 'day' && (
            <View style={styles.daysRow}>
              {visibleDays.map((d) => {
                const isSelected = d.day === selectedDay;
                const count = timetable.filter((t) => t.day_of_week === d.day).length;
                return (
                  <Pressable
                    key={d.day}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Haptics.selectionAsync().catch(() => {});
                      }
                      setSelectedDay(d.day);
                    }}
                    style={[
                      styles.dayPill,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.card,
                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.dayShort,
                        { color: isSelected ? theme.primaryContrast : theme.text },
                      ]}>
                      {d.short}
                    </Text>
                    <Text
                      style={[
                        styles.dayCount,
                        {
                          color: isSelected ? theme.primaryContrast : theme.textMuted,
                        },
                      ]}>
                      {count > 0 ? `${count}` : '—'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {isSyncing && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.text} />
            <Text style={[styles.syncText, { color: theme.textSecondary }]}>
              Synchronizacja planu z USOS API...
            </Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.timelineList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={syncFromLiveApi}
              tintColor={theme.text}
            />
          }>
          {nextClassInfo && (
            <GlassCard
              elevated
              padding={14}
              onPress={() => {
                setSelectedDay(nextClassInfo.activity.day_of_week);
                router.push(`/modal/course/${nextClassInfo.activity.course_id}`);
              }}
              style={styles.nextBannerCard}>
              <View style={styles.nextBannerTop}>
                <View style={styles.nextBannerLeft}>
                  <View
                    style={[
                      styles.nextBannerDot,
                      {
                        backgroundColor: nextClassInfo.isOngoing
                          ? theme.success
                          : theme.accent,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.nextBannerMono,
                      {
                        color: nextClassInfo.isOngoing ? theme.success : theme.accent,
                      },
                    ]}>
                    {nextClassInfo.isOngoing ? 'TRWA TERAZ' : 'NAJBLIŻSZE ZAJĘCIA'}
                  </Text>
                </View>
                <Text style={[styles.nextBannerTime, { color: theme.text }]}>
                  {nextClassInfo.statusBadge}
                </Text>
              </View>
              <Text style={[styles.nextBannerTitle, { color: theme.text }]} numberOfLines={1}>
                {nextClassInfo.activity.course_name.pl}
              </Text>
              <Text
                style={[styles.nextBannerSub, { color: theme.textSecondary }]}
                numberOfLines={1}>
                {nextClassInfo.activity.class_type.pl} • Sala {nextClassInfo.activity.room_number} •{' '}
                {nextClassInfo.activity.lecturer_name}
              </Text>
            </GlassCard>
          )}

          {filteredActivities.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="calendar-clear-outline" size={34} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Brak zaplanowanych zajęć
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                W wybranym dniu nie ma wpisanych zajęć w rozkładzie USOS. Możesz przełączyć tydzień
                strzałkami na górze lub włączyć widok całego tygodnia.
              </Text>
            </GlassCard>
          ) : (
            filteredActivities.map((item, index) => {
              const dayMeta = WEEKDAYS.find((d) => d.day === item.day_of_week);
              const showDayBanner =
                viewMode === 'week' &&
                (index === 0 ||
                  filteredActivities[index - 1].day_of_week !== item.day_of_week);

              return (
                <View key={item.id}>
                  {showDayBanner && dayMeta && (
                    <Text style={[styles.weekDayTitle, { color: theme.textSecondary }]}>
                      {dayMeta.full.toUpperCase()} // {item.date}
                    </Text>
                  )}

                  <GlassCard
                    onPress={() => router.push(`/modal/course/${item.course_id}`)}
                    style={styles.activityCard}>
                    {/* Time + Room + Class Type Row (Concept B Tabular Header) */}
                    <View style={styles.cardTopRow}>
                      <View
                        style={[
                          styles.timePill,
                          {
                            backgroundColor: theme.bgSecondary,
                            borderColor: theme.cardBorder,
                          },
                        ]}>
                        <Text style={[styles.timeBadge, { color: theme.text }]}>
                          {item.start_time} - {item.end_time}
                        </Text>
                      </View>

                      <View style={styles.rightPills}>
                        {item.room_number ? (
                          <View
                            style={[
                              styles.roomBadge,
                              {
                                backgroundColor: theme.primarySoft,
                                borderColor: theme.cardBorder,
                              },
                            ]}>
                            <Text style={[styles.roomBadgeText, { color: theme.text }]}>
                              S. {item.room_number}
                            </Text>
                          </View>
                        ) : null}

                        <View
                          style={[
                            styles.typePill,
                            {
                              backgroundColor: theme.bgSecondary,
                              borderColor: theme.cardBorder,
                            },
                          ]}>
                          <Text style={[styles.typeLabel, { color: theme.textSecondary }]}>
                            {item.class_type.pl} • GR. {item.group_number}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Subject Title */}
                    <Text style={[styles.courseTitle, { color: theme.text }]}>
                      {item.course_name.pl}
                    </Text>

                    {/* Building Address */}
                    <View style={styles.metaLine}>
                      <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                      <Text
                        style={[styles.metaValue, { color: theme.textSecondary }]}
                        numberOfLines={1}>
                        {item.building_name.pl}
                      </Text>
                    </View>

                    {/* Lecturer Row with Photo Avatar */}
                    <View
                      style={[
                        styles.teacherRow,
                        {
                          backgroundColor: theme.bgSecondary,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      <Avatar name={item.lecturer_name} uri={item.lecturer_photo} size={32} />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.teacherName, { color: theme.text }]}
                          numberOfLines={1}>
                          {item.lecturer_name}
                        </Text>
                        <Text
                          style={[styles.teacherSub, { color: theme.textSecondary }]}
                          numberOfLines={1}>
                          Prowadzący • Karta przedmiotu i oceny
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={15} color={theme.textMuted} />
                    </View>
                  </GlassCard>
                </View>
              );
            })
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
  weekControls: {
    flexDirection: 'row',
    gap: 6,
  },
  weekBtn: {
    height: 36,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtnText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
  },
  controlsWrap: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
  },
  dayShort: {
    fontSize: 13,
    fontWeight: '800',
  },
  dayCount: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  syncText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '600',
  },
  timelineList: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 118,
    gap: 10,
  },
  weekDayTitle: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 8,
    marginBottom: 6,
  },
  activityCard: {
    gap: 9,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  timeBadge: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    fontWeight: '800',
  },
  rightPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
  },
  roomBadgeText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
  },
  typeLabel: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaValue: {
    fontSize: 12,
    flex: 1,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },
  teacherName: {
    fontSize: 13,
    fontWeight: '700',
  },
  teacherSub: {
    fontSize: 11,
    marginTop: 1,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
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
  nextBannerCard: {
    gap: 4,
  },
  nextBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nextBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextBannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextBannerMono: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nextBannerTime: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  nextBannerTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  nextBannerSub: {
    fontSize: 12,
    fontWeight: '600',
  },
});
