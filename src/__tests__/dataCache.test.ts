import { describe, expect, it, vi } from 'vitest';

import { isValidCachedSnapshot } from '@/utils/dataCache';

vi.mock('expo-file-system', () => ({
  File: class {},
  Paths: { document: {} },
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('dataCache snapshot validation', () => {
  const baseSnapshot = {
    version: 1,
    installationId: 'uken',
    savedAt: 1_700_000_000_000,
    lastSyncedAt: '12:30',
    user: { id: '1', first_name: 'Jan', last_name: 'Kowalski' },
    timetable: [],
    upcomingTimetable: [],
    grades: [],
    courses: [],
    exams: [],
    payments: [],
    bankAccount: null,
    studentCard: null,
    surveys: [],
    staff: [],
    buildings: [],
    thesis: null,
  };

  it('accepts a fresh snapshot for the matching installation', () => {
    expect(isValidCachedSnapshot(baseSnapshot, 'uken', 1_700_000_060_000)).toBe(true);
  });

  it('rejects a snapshot from a different university installation', () => {
    expect(isValidCachedSnapshot(baseSnapshot, 'agh', 1_700_000_060_000)).toBe(false);
  });

  it('rejects a snapshot older than 14 days', () => {
    const fifteenDaysLater = baseSnapshot.savedAt + 15 * 24 * 60 * 60 * 1000;
    expect(isValidCachedSnapshot(baseSnapshot, 'uken', fifteenDaysLater)).toBe(false);
  });

  it('rejects corrupted or wrong-version snapshots', () => {
    expect(
      isValidCachedSnapshot({ ...baseSnapshot, version: 99 }, 'uken', baseSnapshot.savedAt)
    ).toBe(false);
    expect(isValidCachedSnapshot(null, 'uken', baseSnapshot.savedAt)).toBe(false);
    expect(
      isValidCachedSnapshot({ version: 1, installationId: 'uken' }, 'uken', baseSnapshot.savedAt)
    ).toBe(false);
  });
});
