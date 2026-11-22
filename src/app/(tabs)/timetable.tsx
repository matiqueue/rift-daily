import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UsosTimetableActivity } from '@/api/types';
import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { DateWheelCarousel, DateWheelItem } from '@/components/DateWheelCarousel';
import { GlassSurface } from '@/components/GlassSurface';
import { ScheduleGapRow, ScheduleTimelineRow } from '@/components/ScheduleTimelineRow';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';
import {
  DAY_NAMES_PL,
  DAY_SHORT_PL,
  formatDurationPl,
  formatShortDatePl,
  getGapMinutes,
  getWeekDaysForOffset,
  MONTHS_GENITIVE_PL,
  MONTHS_NOMINATIVE_PL,
  parseMinutes,
  toLocalIsoDate,
} from '@/utils/timetableUtils';

const DAYS_BACK = 21;
const DAYS_FORWARD = 28;

function getMondayTimestamp(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const jsDay = d.getDay();
  const diffToMon = jsDay === 0 ? -6 : 1 - jsDay;
  d.setDate(d.getDate() + diffToMon);
  return d.getTime();
}

export default function TimetableScreen() {
  const theme = useAppTheme();
  const timetable = useUsosStore((s) => s.timetable);
  const upcomingTimetable = useUsosStore((s) => s.upcomingTimetable);
  const timetableWeekOffset = useUsosStore((s) => s.timetableWeekOffset);
  const changeTimetableWeek = useUsosStore((s) => s.changeTimetableWeek);
  const isSyncing = useUsosStore((s) => s.isSyncing);

  const [now, setNow] = useState(() => new Date());
  const todayIso = useMemo(() => toLocalIsoDate(now), [now]);
  const [selectedDateIso, setSelectedDateIso] = useState<string>(() => toLocalIsoDate(new Date()));
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hapticTap = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  // Merge timetable (currently loaded week) + upcomingTimetable (14-day cache) by date without duplicates
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, UsosTimetableActivity[]>();
    const seen = new Set<string>();

    const addItem = (item: UsosTimetableActivity) => {
      if (!item.date) return;
      const key = `${item.date}|${item.start_time}|${item.course_id}|${item.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      const list = map.get(item.date) || [];
      list.push(item);
      map.set(item.date, list);
    };

    for (const item of timetable) addItem(item);
    for (const item of upcomingTimetable) addItem(item);

    for (const [, list] of map) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [timetable, upcomingTimetable]);

  // Continuous 50-day wheel range (-21 .. +28 around today)
  const wheelDays = useMemo<DateWheelItem[]>(() => {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentWeekMon = getMondayTimestamp(base);
    const items: DateWheelItem[] = [];

    for (let offset = -DAYS_BACK; offset <= DAYS_FORWARD; offset++) {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);
      const jsDay = d.getDay();
      const isoDay = jsDay === 0 ? 7 : jsDay;
      const dateIso = toLocalIsoDate(d);
      const thisWeekMon = getMondayTimestamp(d);
      const weekOffset = Math.round((thisWeekMon - currentWeekMon) / (7 * 86_400_000));
      const count = activitiesByDate.get(dateIso)?.length || 0;

      items.push({
        dateIso,
        dayOfWeek: isoDay,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        yearNum: d.getFullYear(),
        twoLetterPl: DAY_SHORT_PL[isoDay] || '',
        fullPl: DAY_NAMES_PL[isoDay] || '',
        isToday: dateIso === todayIso,
        weekOffset,
        classCount: count,
      });
    }
    return items;
  }, [now, todayIso, activitiesByDate]);

  const selectedDayItem = useMemo(
    () => wheelDays.find((d) => d.dateIso === selectedDateIso) || wheelDays[DAYS_BACK],
    [wheelDays, selectedDateIso]
  );

  const selectedIndex = useMemo(
    () => Math.max(0, wheelDays.findIndex((d) => d.dateIso === selectedDayItem.dateIso)),
    [wheelDays, selectedDayItem.dateIso]
  );

  const syncWeekIfNeeded = useCallback(
    (targetWeekOffset: number) => {
      if (targetWeekOffset === timetableWeekOffset) return;
      if (targetWeekOffset === 0) {
        changeTimetableWeek(0);
      } else {
        changeTimetableWeek(targetWeekOffset - timetableWeekOffset);
      }
    },
    [timetableWeekOffset, changeTimetableWeek]
  );

  const handleSelectWheelDay = useCallback(
    (item: DateWheelItem) => {
      setSelectedDateIso(item.dateIso);
      if (viewMode === 'week') setViewMode('day');
      syncWeekIfNeeded(item.weekOffset);
    },
    [viewMode, syncWeekIfNeeded]
  );

  const handleJumpToday = () => {
    hapticTap();
    setSelectedDateIso(todayIso);
    setViewMode('day');
    syncWeekIfNeeded(0);
  };

  const dayActivities = useMemo(
    () => activitiesByDate.get(selectedDayItem.dateIso) || [],
    [activitiesByDate, selectedDayItem.dateIso]
  );

  const dayMetaSummary = useMemo(() => {
    if (dayActivities.length === 0) return 'Wolne';
    const totalMin = dayActivities.reduce(
      (sum, act) => sum + Math.max(0, parseMinutes(act.end_time) - parseMinutes(act.start_time)),
      0
    );
    const span = `${dayActivities[0].start_time}–${dayActivities[dayActivities.length - 1].end_time}`;
    return `${span} · ${formatDurationPl(totalMin)}`;
  }, [dayActivities]);

  const weekDays = useMemo(
    () => getWeekDaysForOffset(selectedDayItem.weekOffset, now),
    [selectedDayItem.weekOffset, now]
  );

  const weekGroups = useMemo(() => {
    return weekDays
      .map((cell) => ({
        cell,
        items: activitiesByDate.get(cell.dateIso) || [],
      }))
      .filter((g) => g.items.length > 0);
  }, [weekDays, activitiesByDate]);

  const weekTotalCount = useMemo(
    () => weekGroups.reduce((sum, g) => sum + g.items.length, 0),
    [weekGroups]
  );

  const monthHeader = `${MONTHS_NOMINATIVE_PL[selectedDayItem.monthNum - 1].toUpperCase()} ${
    selectedDayItem.yearNum
  }`;

  const isOnToday = selectedDayItem.isToday;

  // Horizontal swipe gesture on the agenda body also steps the wheel carousel smoothly
  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          viewMode === 'day' &&
          Math.abs(gesture.dx) > 30 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.6,
        onPanResponderRelease: (_evt, gesture) => {
          if (viewMode !== 'day') return;
          if (gesture.dx < -45 && selectedIndex < wheelDays.length - 1) {
            if (Platform.OS === 'ios') Haptics.selectionAsync().catch(() => {});
            handleSelectWheelDay(wheelDays[selectedIndex + 1]);
          } else if (gesture.dx > 45 && selectedIndex > 0) {
            if (Platform.OS === 'ios') Haptics.selectionAsync().catch(() => {});
            handleSelectWheelDay(wheelDays[selectedIndex - 1]);
          }
        },
      }),
    [viewMode, selectedIndex, wheelDays, handleSelectWheelDay]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <AmbientBackdrop variant="plan" />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Clean Spacious Header with solo "DZIŚ" button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.monoOverline, { color: theme.textMuted }]}>{monthHeader}</Text>
            <Text style={[styles.title, { color: theme.text }]}>Plan</Text>
          </View>

          <Pressable
            onPress={handleJumpToday}
            accessibilityLabel="Przejdź do dzisiejszego dnia"
            style={({ pressed }) => [
              styles.todayPillBtn,
              isOnToday
                ? {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  }
                : {
                    backgroundColor: theme.primarySoft,
                    borderColor: theme.separator,
                  },
              pressed && { opacity: 0.72 },
            ]}>
            <View
              style={[
                styles.todayPillDot,
                {
                  backgroundColor: isOnToday ? theme.primaryContrast : theme.textMuted,
                },
              ]}
            />
            <Text
              style={[
                styles.todayPillText,
                {
                  color: isOnToday ? theme.primaryContrast : theme.textSecondary,
                },
              ]}>
              DZIŚ
            </Text>
          </Pressable>
        </View>

        {/* iPhone Timer / Wheel-style Horizontal Date Carousel */}
        <DateWheelCarousel
          days={wheelDays}
          selectedDateIso={selectedDayItem.dateIso}
          onSelectDay={handleSelectWheelDay}
        />

        {/* Mode Switcher */}
        <View style={styles.modeBar}>
          <SegmentedControl
            options={[
              { label: 'Dzień', value: 'day', badge: dayActivities.length },
              { label: 'Tydzień', value: 'week', badge: weekTotalCount },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
        </View>

        {isSyncing && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.text} />
            <Text style={[styles.syncText, { color: theme.textSecondary }]}>
              Synchronizacja rozkładu z USOS...
            </Text>
          </View>
        )}

        {/* Swipeable Continuous Agenda */}
        <ScrollView
          {...swipeResponder.panHandlers}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {viewMode === 'day' ? (
            <>
              <View style={[styles.daySummaryRow, { borderBottomColor: theme.separator }]}>
                <View style={styles.daySummaryLeft}>
                  <Text style={[styles.daySummaryTitle, { color: theme.text }]}>
                    {selectedDayItem.fullPl}, {selectedDayItem.dayNum}{' '}
                    {MONTHS_GENITIVE_PL[selectedDayItem.monthNum - 1]}
                  </Text>
                  {selectedDayItem.isToday && (
                    <View style={[styles.todayTag, { backgroundColor: theme.primarySoft }]}>
                      <Text style={[styles.todayTagText, { color: theme.text }]}>DZIŚ</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.daySummaryMeta, { color: theme.textMuted }]}>
                  {dayMetaSummary}
                </Text>
              </View>

              {dayActivities.length === 0 ? (
                <View style={styles.emptyBlock}>
                  <Ionicons name="calendar-clear-outline" size={28} color={theme.textMuted} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    Brak zajęć w tym dniu
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                    Przewiń karuzelę dat powyżej lub włącz podgląd całego tygodnia.
                  </Text>
                  <View style={styles.emptyActions}>
                    <GlassSurface
                      radius={999}
                      interactive
                      onPress={() => setViewMode('week')}
                      contentStyle={styles.emptyGlassBtn}>
                      <Text style={[styles.emptyBtnText, { color: theme.text }]}>
                        Cały tydzień
                      </Text>
                    </GlassSurface>
                    {!isOnToday && (
                      <GlassSurface
                        radius={999}
                        interactive
                        onPress={handleJumpToday}
                        contentStyle={styles.emptyGlassBtn}>
                        <Text style={[styles.emptyBtnText, { color: theme.text }]}>
                          Wróć do dziś
                        </Text>
                      </GlassSurface>
                    )}
                  </View>
                </View>
              ) : (
                <View>
                  {dayActivities.map((item, idx) => {
                    const prev = idx > 0 ? dayActivities[idx - 1] : null;
                    const gapMin = prev ? getGapMinutes(prev, item) : 0;
                    return (
                      <React.Fragment key={item.id}>
                        {gapMin >= 20 && <ScheduleGapRow minutes={gapMin} />}
                        <ScheduleTimelineRow
                          activity={item}
                          now={now}
                          showDivider={idx < dayActivities.length - 1}
                          onPress={() => router.push(`/modal/course/${item.course_id}`)}
                        />
                      </React.Fragment>
                    );
                  })}
                </View>
              )}
            </>
          ) : weekGroups.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Ionicons name="calendar-outline" size={28} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Brak zajęć w tym tygodniu
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Przewiń karuzelę dat na inny tydzień — dane aktualizują się automatycznie.
              </Text>
              {!isOnToday && (
                <GlassSurface
                  radius={999}
                  interactive
                  onPress={handleJumpToday}
                  contentStyle={styles.emptyGlassBtn}>
                  <Text style={[styles.emptyBtnText, { color: theme.text }]}>
                    Wróć do bieżącego tygodnia
                  </Text>
                </GlassSurface>
              )}
            </View>
          ) : (
            <View>
              {weekGroups.map(({ cell, items }) => (
                <View key={cell.dateIso} style={styles.weekGroup}>
                  <View style={[styles.weekGroupHeader, { borderBottomColor: theme.separator }]}>
                    <View style={styles.weekGroupHeaderLeft}>
                      <Text
                        style={[
                          styles.weekGroupTitle,
                          { color: cell.isToday ? theme.text : theme.textSecondary },
                        ]}>
                        {cell.fullPl.toUpperCase()}
                      </Text>
                      <Text style={[styles.weekGroupDate, { color: theme.textMuted }]}>
                        {formatShortDatePl(cell.dateIso)}
                      </Text>
                      {cell.isToday && (
                        <View style={[styles.todayTag, { backgroundColor: theme.primarySoft }]}>
                          <Text style={[styles.todayTagText, { color: theme.text }]}>DZIŚ</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.weekGroupCount, { color: theme.textMuted }]}>
                      {items.length} zaj.
                    </Text>
                  </View>

                  {items.map((item, idx) => {
                    const prev = idx > 0 ? items[idx - 1] : null;
                    const gapMin = prev ? getGapMinutes(prev, item) : 0;
                    return (
                      <React.Fragment key={item.id}>
                        {gapMin >= 20 && <ScheduleGapRow minutes={gapMin} />}
                        <ScheduleTimelineRow
                          activity={item}
                          now={now}
                          compact
                          showDivider={idx < items.length - 1}
                          onPress={() => router.push(`/modal/course/${item.course_id}`)}
                        />
                      </React.Fragment>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {dayActivities.length > 0 && viewMode === 'day' && (
            <Text style={[styles.swipeHint, { color: theme.textMuted }]}>
              Kręć karuzelą dat lub przesuwaj w bok · {DAY_NAMES_PL[selectedDayItem.dayOfWeek]}
            </Text>
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
    gap: 12,
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
  todayPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayPillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  todayPillText: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  modeBar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  syncText: {
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 112,
  },
  daySummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  daySummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  daySummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  daySummaryMeta: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '600',
    flexShrink: 0,
  },
  todayTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  todayTagText: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 54,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 270,
    lineHeight: 19,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  emptyGlassBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  emptyBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  weekGroup: {
    marginBottom: 12,
  },
  weekGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekGroupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  weekGroupTitle: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  weekGroupDate: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '600',
  },
  weekGroupCount: {
    fontFamily: MONO_FONT,
    fontSize: 10.5,
    fontWeight: '600',
  },
  swipeHint: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 22,
    opacity: 0.7,
  },
});
