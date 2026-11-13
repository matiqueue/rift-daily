import { UsosTimetableActivity } from '@/api/types';

export const DAY_NAMES_PL: Record<number, string> = {
  1: 'Poniedziałek',
  2: 'Wtorek',
  3: 'Środa',
  4: 'Czwartek',
  5: 'Piątek',
  6: 'Sobota',
  7: 'Niedziela',
};

export const DAY_SHORT_PL: Record<number, string> = {
  1: 'Pon',
  2: 'Wt',
  3: 'Śr',
  4: 'Czw',
  5: 'Pt',
  6: 'Sob',
  7: 'Ndz',
};

function parseMinutes(hhmm: string): number {
  const [h, m] = (hhmm || '00:00').split(':').map((v) => parseInt(v, 10));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function parseLocalDate(dateStr?: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
  const [y, m, d] = dateStr.slice(0, 10).split('-').map((v) => parseInt(v, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function parseLocalDateTime(dateStr: string | undefined, hhmm: string): Date | null {
  const base = parseLocalDate(dateStr);
  if (!base) return null;
  const [h, m] = (hhmm || '00:00').split(':').map((v) => parseInt(v, 10));
  base.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return base;
}

export function toLocalIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatShortDatePl(dateStr?: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

export interface NextClassHighlight {
  activity: UsosTimetableActivity;
  afterActivity: UsosTimetableActivity | null;
  isOngoing: boolean;
  isToday: boolean;
  statusBadge: string;
  countdownLabel: string;
  dayNamePl: string;
  daySchedule: UsosTimetableActivity[];
}

export function getNextClassHighlight(
  timetable: UsosTimetableActivity[],
  now: Date = new Date()
): NextClassHighlight | null {
  if (!timetable || timetable.length === 0) return null;

  const sorted = [...timetable].sort((a, b) => {
    const dateCmp = (a.date || '').localeCompare(b.date || '');
    if (dateCmp !== 0) return dateCmp;
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });

  const jsDay = now.getDay();
  const currentIsoDay = jsDay === 0 ? 7 : jsDay; // 1 = Mon ... 7 = Sun
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nowMs = now.getTime();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  let chosenIdx = -1;
  let isOngoing = false;
  let wrappedWithoutDates = false;

  // 1. Find the first ongoing or upcoming class using real calendar dates when available
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const startDt = parseLocalDateTime(item.date, item.start_time);
    const endDt = parseLocalDateTime(item.date, item.end_time);

    if (startDt && endDt) {
      if (endDt.getTime() > nowMs) {
        chosenIdx = i;
        isOngoing = nowMs >= startDt.getTime();
        break;
      }
      continue;
    }

    // Fallback when item.date is unavailable
    if (item.day_of_week < currentIsoDay) continue;
    const startMin = parseMinutes(item.start_time);
    const endMin = parseMinutes(item.end_time);

    if (item.day_of_week === currentIsoDay) {
      if (currentMinutes >= startMin && currentMinutes < endMin) {
        chosenIdx = i;
        isOngoing = true;
        break;
      }
      if (startMin > currentMinutes) {
        chosenIdx = i;
        break;
      }
    } else if (item.day_of_week > currentIsoDay) {
      chosenIdx = i;
      break;
    }
  }

  // 2. Fallback if all known classes are in the past
  if (chosenIdx === -1) {
    chosenIdx = 0;
    if (!parseLocalDate(sorted[0].date)) {
      wrappedWithoutDates = true;
    }
  }

  const activity = sorted[chosenIdx];
  const daySchedule = activity.date
    ? sorted.filter((t) => t.date === activity.date)
    : sorted.filter((t) => t.day_of_week === activity.day_of_week);
  const idxInDay = daySchedule.indexOf(activity);
  const afterActivity = idxInDay >= 0 ? daySchedule[idxInDay + 1] || null : null;

  const actMidnight = parseLocalDate(activity.date);
  const startDt = parseLocalDateTime(activity.date, activity.start_time);
  const endDt = parseLocalDateTime(activity.date, activity.end_time);
  const dayNamePl = DAY_NAMES_PL[activity.day_of_week] || 'Dzień zajęć';
  const shortDate = formatShortDatePl(activity.date);

  let isToday = false;
  let statusBadge = '';
  let countdownLabel = '';

  if (actMidnight && startDt && endDt) {
    const daysAhead = Math.round((actMidnight.getTime() - todayMidnight.getTime()) / 86400000);
    isToday = daysAhead === 0 && endDt.getTime() > nowMs;

    if (isOngoing) {
      const remainingMin = Math.max(1, Math.round((endDt.getTime() - nowMs) / 60000));
      statusBadge = `TRWA TERAZ • DO ${activity.end_time}`;
      countdownLabel = `Koniec za ${remainingMin} min`;
    } else if (daysAhead === 0 && startDt.getTime() > nowMs) {
      const diffMin = Math.max(1, Math.round((startDt.getTime() - nowMs) / 60000));
      if (diffMin < 60) {
        statusBadge = `ZA ${diffMin} MIN • ${activity.start_time}`;
        countdownLabel = `Rozpoczęcie dziś o ${activity.start_time}`;
      } else {
        const hrs = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        statusBadge = `DZIŚ • ${activity.start_time}`;
        countdownLabel = mins > 0 ? `Start za ${hrs} godz. ${mins} min` : `Start za ${hrs} godz.`;
      }
    } else if (daysAhead === 1) {
      statusBadge = `JUTRO • ${activity.start_time}`;
      countdownLabel = `${dayNamePl}, ${activity.start_time}–${activity.end_time}`;
    } else if (daysAhead > 1) {
      statusBadge = `${dayNamePl.toUpperCase()} ${shortDate} • ${activity.start_time}`;
      countdownLabel = `Za ${daysAhead} dni • ${dayNamePl} (${shortDate})`;
    } else {
      statusBadge = `${dayNamePl.toUpperCase()} ${shortDate} • ${activity.start_time}`;
      countdownLabel = `${dayNamePl} (${shortDate})`;
    }
  } else {
    isToday = !wrappedWithoutDates && activity.day_of_week === currentIsoDay;
    const startMin = parseMinutes(activity.start_time);
    const endMin = parseMinutes(activity.end_time);

    if (isOngoing) {
      const remainingMin = Math.max(1, endMin - currentMinutes);
      statusBadge = `TRWA TERAZ • DO ${activity.end_time}`;
      countdownLabel = `Koniec za ${remainingMin} min`;
    } else if (isToday) {
      const diffMin = Math.max(1, startMin - currentMinutes);
      if (diffMin < 60) {
        statusBadge = `ZA ${diffMin} MIN • ${activity.start_time}`;
        countdownLabel = `Rozpoczęcie dziś o ${activity.start_time}`;
      } else {
        const hrs = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        statusBadge = `DZIŚ • ${activity.start_time}`;
        countdownLabel = mins > 0 ? `Start za ${hrs} godz. ${mins} min` : `Start za ${hrs} godz.`;
      }
    } else {
      const daysAhead = wrappedWithoutDates
        ? 7 - currentIsoDay + activity.day_of_week
        : activity.day_of_week - currentIsoDay;

      if (daysAhead === 1) {
        statusBadge = `JUTRO • ${activity.start_time}`;
        countdownLabel = `${dayNamePl}, ${activity.start_time}–${activity.end_time}`;
      } else {
        statusBadge = `${dayNamePl.toUpperCase()} • ${activity.start_time}`;
        countdownLabel = wrappedWithoutDates
          ? `Kolejny tydzień • ${dayNamePl}`
          : `Za ${daysAhead} dni • ${dayNamePl}`;
      }
    }
  }

  return {
    activity,
    afterActivity,
    isOngoing,
    isToday,
    statusBadge,
    countdownLabel,
    dayNamePl,
    daySchedule,
  };
}
