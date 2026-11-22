import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { UsosTimetableActivity } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { LivePulseDot } from '@/components/KineticText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { MONO_FONT } from '@/theme/theme';
import {
  formatDurationPl,
  getClassTimingState,
  getClassTypeColor,
  getClassTypeShort,
} from '@/utils/timetableUtils';

interface ScheduleTimelineRowProps {
  activity: UsosTimetableActivity;
  now?: Date;
  compact?: boolean;
  showDivider?: boolean;
  onPress?: () => void;
}

export function ScheduleTimelineRow({
  activity,
  now,
  compact = false,
  showDivider = true,
  onPress,
}: ScheduleTimelineRowProps) {
  const theme = useAppTheme();
  const timing = getClassTimingState(activity, now);
  const typeTone = getClassTypeColor(activity.class_type_id, theme);
  const shortTag = getClassTypeShort(activity.class_type_id);
  const isOngoing = timing.status === 'ongoing';
  const isPast = timing.status === 'past';

  const barColor = isOngoing ? theme.success : isPast ? theme.separator : typeTone;

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS === 'ios') {
          Haptics.selectionAsync().catch(() => {});
        }
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.row,
        showDivider && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
        isPast && { opacity: 0.45 },
        pressed && { opacity: 0.7 },
      ]}>
      {/* Left Tabular Time Column */}
      <View style={styles.timeCol}>
        <Text
          style={[
            styles.startTime,
            { color: isOngoing ? theme.text : isPast ? theme.textMuted : theme.text },
          ]}>
          {activity.start_time}
        </Text>
        <Text style={[styles.endTime, { color: theme.textMuted }]}>{activity.end_time}</Text>
      </View>

      {/* Monochrome Tonal Bar */}
      <View style={[styles.accentBar, { backgroundColor: barColor }]} />

      {/* Main Content */}
      <View style={styles.contentCol}>
        <View style={styles.topMetaRow}>
          <View style={styles.leftBadges}>
            <View
              style={[
                styles.typeTagPill,
                {
                  backgroundColor:
                    activity.class_type_id === 'W' && !isPast
                      ? theme.primary
                      : theme.primarySoft,
                },
              ]}>
              <Text
                style={[
                  styles.typeTagText,
                  {
                    color:
                      activity.class_type_id === 'W' && !isPast
                        ? theme.primaryContrast
                        : theme.textSecondary,
                  },
                ]}>
                {shortTag}
              </Text>
            </View>
            {!compact && activity.group_number ? (
              <Text style={[styles.groupMono, { color: theme.textMuted }]}>
                gr. {activity.group_number}
              </Text>
            ) : null}
          </View>

          <View style={styles.rightMetaRow}>
            {isOngoing ? (
              <View style={[styles.livePill, { backgroundColor: theme.successSoft }]}>
                <LivePulseDot color={theme.success} size={5} active />
                <Text style={[styles.livePillText, { color: theme.success }]}>
                  TERAZ · {timing.remainingMin}m
                </Text>
              </View>
            ) : isPast ? (
              <Ionicons name="checkmark" size={14} color={theme.textMuted} />
            ) : null}

            {activity.room_number ? (
              <Text
                style={[
                  styles.roomMono,
                  { color: isPast ? theme.textMuted : theme.text },
                ]}
                numberOfLines={1}>
                s. {activity.room_number}
              </Text>
            ) : null}
          </View>
        </View>

        <Text
          style={[styles.courseTitle, { color: theme.text }]}
          numberOfLines={compact ? 1 : 2}>
          {activity.course_name.pl}
        </Text>

        {compact ? (
          <Text style={[styles.compactSub, { color: theme.textSecondary }]} numberOfLines={1}>
            {activity.lecturer_name}
            {activity.building_name?.pl ? ` · ${activity.building_name.pl}` : ''}
          </Text>
        ) : (
          <View style={styles.fullFooterRow}>
            <Avatar name={activity.lecturer_name} uri={activity.lecturer_photo} size={18} />
            <Text style={[styles.fullFooterText, { color: theme.textSecondary }]} numberOfLines={1}>
              {activity.lecturer_name}
              {activity.building_name?.pl ? ` · ${activity.building_name.pl}` : ''}
            </Text>
          </View>
        )}

        {isOngoing && (
          <View style={[styles.progressTrack, { backgroundColor: theme.bgSecondary }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${timing.progressPercent}%`,
                  backgroundColor: theme.success,
                },
              ]}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

interface ScheduleGapRowProps {
  minutes: number;
}

export function ScheduleGapRow({ minutes }: ScheduleGapRowProps) {
  const theme = useAppTheme();
  if (minutes < 20) return null;
  const label = minutes >= 30 ? 'Okienko' : 'Przerwa';

  return (
    <View style={styles.gapRow}>
      <View style={[styles.gapLine, { backgroundColor: theme.separator }]} />
      <Text style={[styles.gapText, { color: theme.textMuted }]}>
        {label} · {formatDurationPl(minutes)}
      </Text>
      <View style={[styles.gapLine, { backgroundColor: theme.separator }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 14,
    gap: 12,
  },
  timeCol: {
    width: 48,
    paddingTop: 1,
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 2,
  },
  startTime: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  endTime: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '500',
  },
  accentBar: {
    width: 2.5,
    borderRadius: 2,
    marginVertical: 2,
    flexShrink: 0,
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  leftBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeTagPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  typeTagText: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  groupMono: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '600',
  },
  rightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  livePillText: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '800',
  },
  roomMono: {
    fontFamily: MONO_FONT,
    fontSize: 11.5,
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.25,
    lineHeight: 20,
  },
  compactSub: {
    fontSize: 12.5,
  },
  fullFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
  },
  fullFooterText: {
    fontSize: 12.5,
    flex: 1,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  gapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  gapLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  gapText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
