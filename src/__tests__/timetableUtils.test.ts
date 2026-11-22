import { describe, expect, it } from 'vitest';

import {
  formatDurationPl,
  getGapMinutes,
  getNextClassHighlight,
  toLocalIsoDate,
} from '../utils/timetableUtils';

describe('timetableUtils', () => {
  it('formats Polish durations cleanly', () => {
    expect(formatDurationPl(45)).toBe('45 min');
    expect(formatDurationPl(60)).toBe('1h');
    expect(formatDurationPl(95)).toBe('1h 35m');
  });

  it('computes gaps between consecutive classes', () => {
    const a = { start_time: '08:00', end_time: '09:30' } as any;
    const b = { start_time: '10:15', end_time: '11:45' } as any;
    expect(getGapMinutes(a, b)).toBe(45);
  });

  it('formats local ISO dates as YYYY-MM-DD', () => {
    expect(toLocalIsoDate(new Date(2026, 10, 22))).toBe('2026-11-22');
  });

  it('highlights the next upcoming class accurately by date and time', () => {
    const now = new Date(2026, 10, 23, 9, 0, 0);
    const acts = [
      {
        id: '1',
        date: '2026-11-23',
        day_of_week: 1,
        start_time: '08:00',
        end_time: '09:30',
        course_id: 'C1',
        course_name: { pl: 'Algorytmy', en: 'Algorithms' },
        class_type_id: 'W',
        room_number: '101',
        lecturer_name: 'dr Kowalski',
      },
      {
        id: '2',
        date: '2026-11-23',
        day_of_week: 1,
        start_time: '10:00',
        end_time: '11:30',
        course_id: 'C2',
        course_name: { pl: 'Bazy Danych', en: 'Databases' },
        class_type_id: 'LAB',
        room_number: '202',
        lecturer_name: 'mgr Nowak',
      },
    ] as any[];

    const res = getNextClassHighlight(acts, now);
    expect(res?.isOngoing).toBe(true);
    expect(res?.activity.id).toBe('1');
    expect(res?.afterActivity?.id).toBe('2');
  });
});
