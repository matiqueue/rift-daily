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
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });

  const jsDay = now.getDay();
  const currentIsoDay = jsDay === 0 ? 7 : jsDay; // 1 = Mon ... 7 = Sun
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let chosenIdx = -1;
  let isOngoing = false;
  let wrappedToNextWeek = false;

  // 1. Check today for ongoing or upcoming classes
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
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

  // 2. If all classes this week have already finished, wrap to the first class of the week
  if (chosenIdx === -1) {
    chosenIdx = 0;
    wrappedToNextWeek = true;
  }

  const activity = sorted[chosenIdx];
  const afterActivity = sorted[chosenIdx + 1] || null;
  const isToday = !wrappedToNextWeek && activity.day_of_week === currentIsoDay;
  const dayNamePl = DAY_NAMES_PL[activity.day_of_week] || 'Dzień zajęć';

  const startMin = parseMinutes(activity.start_time);
  const endMin = parseMinutes(activity.end_time);

  let statusBadge = '';
  let countdownLabel = '';

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
    const daysAhead = wrappedToNextWeek
      ? 7 - currentIsoDay + activity.day_of_week
      : activity.day_of_week - currentIsoDay;

    if (daysAhead === 1) {
      statusBadge = `JUTRO • ${activity.start_time}`;
      countdownLabel = `${dayNamePl}, ${activity.start_time}–${activity.end_time}`;
    } else {
      statusBadge = `${dayNamePl.toUpperCase()} • ${activity.start_time}`;
      countdownLabel = wrappedToNextWeek
        ? `Kolejny tydzień • ${dayNamePl}`
        : `Za ${daysAhead} dni • ${dayNamePl}`;
    }
  }

  const daySchedule = sorted.filter((t) => t.day_of_week === activity.day_of_week);

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
