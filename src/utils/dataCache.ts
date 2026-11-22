import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  UsosBankAccount,
  UsosBuilding,
  UsosCourseEdition,
  UsosExamItem,
  UsosGradeItem,
  UsosPaymentItem,
  UsosStaffMember,
  UsosStudentCard,
  UsosSurveyItem,
  UsosThesisInfo,
  UsosTimetableActivity,
  UsosUserProfile,
} from '@/api/types';

const CACHE_FILE_NAME = 'rift_daily_snapshot_v1.json';
const WEB_CACHE_KEY = 'rift_daily_snapshot_v1';
const CACHE_SCHEMA_VERSION = 1;
const MAX_CACHE_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface CachedUsosSnapshot {
  version: number;
  installationId: string;
  savedAt: number;
  lastSyncedAt: string;
  user: UsosUserProfile;
  timetable: UsosTimetableActivity[];
  upcomingTimetable: UsosTimetableActivity[];
  grades: UsosGradeItem[];
  courses: UsosCourseEdition[];
  exams: UsosExamItem[];
  payments: UsosPaymentItem[];
  bankAccount: UsosBankAccount | null;
  studentCard: UsosStudentCard | null;
  surveys: UsosSurveyItem[];
  staff: UsosStaffMember[];
  buildings: UsosBuilding[];
  thesis: UsosThesisInfo | null;
}

function getNativeCacheFile(): File {
  return new File(Paths.document, CACHE_FILE_NAME);
}

export function isValidCachedSnapshot(
  raw: unknown,
  expectedInstallationId: string,
  nowMs = Date.now()
): raw is CachedUsosSnapshot {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Partial<CachedUsosSnapshot>;
  if (obj.version !== CACHE_SCHEMA_VERSION) return false;
  if (obj.installationId !== expectedInstallationId) return false;
  if (typeof obj.savedAt !== 'number' || nowMs - obj.savedAt > MAX_CACHE_AGE_MS) return false;
  if (!obj.user || typeof obj.user !== 'object' || !Array.isArray(obj.timetable)) return false;
  if (!Array.isArray(obj.grades) || !Array.isArray(obj.courses)) return false;
  return true;
}

export async function loadCachedSnapshot(
  expectedInstallationId: string
): Promise<CachedUsosSnapshot | null> {
  try {
    let rawText: string | null = null;
    if (Platform.OS === 'web') {
      rawText = typeof localStorage !== 'undefined' ? localStorage.getItem(WEB_CACHE_KEY) : null;
    } else {
      const file = getNativeCacheFile();
      if (!file.exists) return null;
      rawText = await file.text();
    }
    if (!rawText) return null;
    const parsed = JSON.parse(rawText);
    if (!isValidCachedSnapshot(parsed, expectedInstallationId)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedSnapshot(
  snapshot: Omit<CachedUsosSnapshot, 'version' | 'savedAt'>
): Promise<void> {
  const payload: CachedUsosSnapshot = {
    ...snapshot,
    version: CACHE_SCHEMA_VERSION,
    savedAt: Date.now(),
  };
  const serialized = JSON.stringify(payload);
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(WEB_CACHE_KEY, serialized);
      }
      return;
    }
    const file = getNativeCacheFile();
    await file.write(serialized);
  } catch {
    // Non-critical cache write failure — never break live sync
  }
}

export async function clearCachedSnapshot(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(WEB_CACHE_KEY);
      }
      return;
    }
    const file = getNativeCacheFile();
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Ignore cleanup errors
  }
}
