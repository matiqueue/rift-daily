import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  UsosCourseEdition,
  UsosExamItem,
  UsosGradeItem,
  UsosPaymentItem,
  UsosSurveyItem,
  UsosTimetableActivity,
} from '@/api/types';

export interface NotificationPreferences {
  enabled: boolean;
  classChanges: boolean;
  classReminders: boolean;
  reminderMinutesBefore: 15 | 30 | 60;
  newGrades: boolean;
  tasksAndExams: boolean;
  paymentsAndInstallments: boolean;
  surveys: boolean;
  quietHoursEnabled: boolean;
}

export type NotificationCategory =
  | 'class_change'
  | 'class_reminder'
  | 'grade'
  | 'task_exam'
  | 'payment'
  | 'survey';

export interface AppNotificationEvent {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  classChanges: true,
  classReminders: true,
  reminderMinutesBefore: 15,
  newGrades: true,
  tasksAndExams: true,
  paymentsAndInstallments: true,
  surveys: false,
  quietHoursEnabled: false,
};

let handlerConfigured = false;

export const ANDROID_CHANNEL_ID = 'rift-daily-usos';

export function configureNotificationsHandler() {
  if (handlerConfigured || Platform.OS === 'web') return;
  handlerConfigured = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Rift Daily — Alerty USOS',
        description: 'Zmiany godzin lekcji, nowe oceny, zadania i terminy rat',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 220, 140, 220],
        lightColor: '#818CF8',
        sound: 'default',
      }).catch(() => {});
    }
  } catch {
    // Ignore on unsupported environments
  }
}

export async function requestNotificationPermissions(): Promise<{
  granted: boolean;
  status: string;
}> {
  if (Platform.OS === 'web') {
    return { granted: false, status: 'unsupported' };
  }
  try {
    configureNotificationsHandler();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return { granted: true, status: 'granted' };
    }
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    const isGranted =
      requested.granted ||
      requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    return { granted: Boolean(isGranted), status: String(requested.status || 'undetermined') };
  } catch {
    return { granted: false, status: 'error' };
  }
}

export async function getNotificationPermissionStatus(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    return Boolean(
      settings.granted ||
        settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

function isWithinQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursEnabled) return false;
  const hour = new Date().getHours();
  return hour >= 22 || hour < 7;
}

function formatTimeHHMM(isoOrTime: string): string {
  if (!isoOrTime) return '';
  if (isoOrTime.includes('T')) {
    return isoOrTime.split('T')[1]?.slice(0, 5) || isoOrTime;
  }
  if (isoOrTime.includes(' ')) {
    return isoOrTime.split(' ')[1]?.slice(0, 5) || isoOrTime;
  }
  return isoOrTime.slice(0, 5);
}

function formatNowTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getDate())}.${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(
    now.getMinutes()
  )}`;
}

export async function fireImmediateLocalNotification(
  title: string,
  body: string,
  category: NotificationCategory,
  prefs: NotificationPreferences
): Promise<AppNotificationEvent> {
  const event: AppNotificationEvent = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    title,
    body,
    createdAt: formatNowTimestamp(),
    read: false,
  };

  if (Platform.OS !== 'web' && prefs.enabled && !isWithinQuietHours(prefs)) {
    try {
      configureNotificationsHandler();
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: { category, eventId: event.id },
        },
        trigger: null,
      });
    } catch {
      // Ignore scheduling errors if permissions not yet granted
    }
  }

  return event;
}

export async function detectChangesAndScheduleNotifications(params: {
  isFirstSync: boolean;
  prefs: NotificationPreferences;
  prevTimetable: UsosTimetableActivity[];
  nextTimetable: UsosTimetableActivity[];
  prevGrades: UsosGradeItem[];
  nextGrades: UsosGradeItem[];
  prevCourses: UsosCourseEdition[];
  nextCourses: UsosCourseEdition[];
  prevExams: UsosExamItem[];
  nextExams: UsosExamItem[];
  prevPayments: UsosPaymentItem[];
  nextPayments: UsosPaymentItem[];
  prevSurveys: UsosSurveyItem[];
  nextSurveys: UsosSurveyItem[];
}): Promise<AppNotificationEvent[]> {
  const {
    isFirstSync,
    prefs,
    prevTimetable,
    nextTimetable,
    prevGrades,
    nextGrades,
    prevCourses,
    nextCourses,
    prevExams,
    nextExams,
    nextPayments,
    prevSurveys,
    nextSurveys,
  } = params;

  const generatedEvents: AppNotificationEvent[] = [];

  if (!isFirstSync) {
    // 1. Detect timetable time & room changes
    if (prevTimetable.length > 0 && nextTimetable.length > 0) {
      const prevById = new Map<string, UsosTimetableActivity>();
      for (const item of prevTimetable) {
        prevById.set(item.id, item);
      }

      for (const nextItem of nextTimetable) {
        const prevItem = prevById.get(nextItem.id);
        if (!prevItem) continue;

        const prevStart = formatTimeHHMM(prevItem.start_time);
        const prevEnd = formatTimeHHMM(prevItem.end_time);
        const nextStart = formatTimeHHMM(nextItem.start_time);
        const nextEnd = formatTimeHHMM(nextItem.end_time);

        if (prevStart !== nextStart || prevEnd !== nextEnd) {
          const title = `Zmiana godzin lekcji • ${nextItem.course_name.pl}`;
          const body = `Nowe godziny zajęć: ${nextStart}–${nextEnd} (wcześniej ${prevStart}–${prevEnd}), sala ${nextItem.room_number}.`;
          if (prefs.classChanges) {
            const ev = await fireImmediateLocalNotification(title, body, 'class_change', prefs);
            generatedEvents.push(ev);
          }
        } else if (prevItem.room_number !== nextItem.room_number) {
          const title = `Zmiana sali zajęć • ${nextItem.course_name.pl}`;
          const body = `Zajęcia (${nextStart}–${nextEnd}) przeniesiono z sali ${prevItem.room_number} do sali ${nextItem.room_number}.`;
          if (prefs.classChanges) {
            const ev = await fireImmediateLocalNotification(title, body, 'class_change', prefs);
            generatedEvents.push(ev);
          }
        }
      }
    }

    // 2. Detect new or updated grades
    if (nextGrades.length > 0) {
      const prevGradesById = new Map<string, UsosGradeItem>();
      for (const g of prevGrades) {
        prevGradesById.set(g.id, g);
      }

      for (const g of nextGrades) {
        const prevG = prevGradesById.get(g.id);
        if (!prevG || prevG.value_symbol !== g.value_symbol) {
          if (prefs.newGrades) {
            const title = `Nowa ocena w USOS: ${g.value_symbol}`;
            const body = `${g.course_name.pl} (${g.class_type || 'Protokół'}) — wystawił(a): ${g.author_name || 'Wykładowca'}.`;
            const ev = await fireImmediateLocalNotification(title, body, 'grade', prefs);
            generatedEvents.push(ev);
          }
        }
      }
    }

    // 3. Detect new tasks / test points (crstests) & exams
    if (nextCourses.length > 0 && prevCourses.length > 0) {
      const prevTaskPoints = new Map<string, string>();
      for (const c of prevCourses) {
        for (const node of c.test_tree || []) {
          const val =
            node.points_earned !== undefined
              ? `${node.points_earned}/${node.points_max || ''}`
              : node.grade_symbol || '';
          prevTaskPoints.set(`${c.course_id}:${node.id}`, val);
        }
      }
      for (const c of nextCourses) {
        for (const node of c.test_tree || []) {
          const key = `${c.course_id}:${node.id}`;
          const prevPts = prevTaskPoints.get(key);
          const nextPts =
            node.points_earned !== undefined
              ? `${node.points_earned}/${node.points_max || ''}`
              : node.grade_symbol || '';
          if (prevPts !== undefined && prevPts !== nextPts && nextPts) {
            if (prefs.tasksAndExams) {
              const title = `Zadanie / Kolokwium • ${c.course_name.pl}`;
              const body = `Zaktualizowano wynik w "${node.name.pl}": ${nextPts}.`;
              const ev = await fireImmediateLocalNotification(title, body, 'task_exam', prefs);
              generatedEvents.push(ev);
            }
          }
        }
      }
    }

    if (nextExams.length > prevExams.length && prefs.tasksAndExams) {
      const prevExamIds = new Set(prevExams.map((e) => e.id));
      for (const ex of nextExams) {
        if (!prevExamIds.has(ex.id)) {
          const title = `Nowy termin egzaminu • ${ex.course_name}`;
          const body = `${ex.type} dnia ${ex.date} o godz. ${ex.time} (${ex.room}).`;
          const ev = await fireImmediateLocalNotification(title, body, 'task_exam', prefs);
          generatedEvents.push(ev);
        }
      }
    }

    // 4. Detect new surveys
    if (nextSurveys.length > prevSurveys.length && prefs.surveys) {
      const prevSurveyIds = new Set(prevSurveys.map((s) => s.id));
      for (const s of nextSurveys) {
        if (!prevSurveyIds.has(s.id) && !s.filled_out) {
          const title = `Nowa ankieta studencka`;
          const body = `${s.course_name} — ${s.lecturer_name}`;
          const ev = await fireImmediateLocalNotification(title, body, 'survey', prefs);
          generatedEvents.push(ev);
        }
      }
    }
  }

  // Schedule future reminders for upcoming classes, tasks/exams, and payments
  await scheduleUpcomingReminders({
    prefs,
    timetable: nextTimetable,
    exams: nextExams,
    payments: nextPayments,
  });

  return generatedEvents;
}

export async function scheduleUpcomingReminders(params: {
  prefs: NotificationPreferences;
  timetable: UsosTimetableActivity[];
  exams: UsosExamItem[];
  payments: UsosPaymentItem[];
}): Promise<void> {
  if (Platform.OS === 'web') return;
  const { prefs, timetable, exams, payments } = params;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    return;
  }

  if (!prefs.enabled) return;

  const nowMs = Date.now();
  let scheduledCount = 0;
  const MAX_SCHEDULED = 24;

  // 1. Schedule reminders before upcoming classes
  if (prefs.classReminders) {
    const leadMs = prefs.reminderMinutesBefore * 60 * 1000;
    for (const item of timetable) {
      if (scheduledCount >= MAX_SCHEDULED) break;
      const startIso = item.date
        ? `${item.date}T${formatTimeHHMM(item.start_time)}:00`
        : item.start_time.replace(' ', 'T');
      const startDate = new Date(startIso);
      if (Number.isNaN(startDate.getTime())) continue;

      const triggerMs = startDate.getTime() - leadMs;
      if (triggerMs > nowMs + 15_000) {
        const startHHMM = formatTimeHHMM(item.start_time);
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Za ${prefs.reminderMinutesBefore} min: ${item.course_name.pl}`,
              body: `${item.class_type.pl} • godz. ${startHHMM} • Sala ${item.room_number} (${item.building_name.pl})`,
              sound: 'default',
              data: { category: 'class_reminder', activityId: item.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(triggerMs),
            },
          });
          scheduledCount++;
        } catch {}
      }
    }
  }

  // 2. Schedule reminders for upcoming exams/tasks (24h before at 09:00)
  if (prefs.tasksAndExams) {
    for (const exam of exams) {
      if (scheduledCount >= MAX_SCHEDULED) break;
      const examDate = new Date(`${exam.date}T${exam.time || '09:00'}:00`);
      if (Number.isNaN(examDate.getTime())) continue;

      const triggerMs = examDate.getTime() - 24 * 60 * 60 * 1000;
      if (triggerMs > nowMs + 30_000) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Jutro: ${exam.type} • ${exam.course_name}`,
              body: `Termin: ${exam.date} o godz. ${exam.time}, sala ${exam.room}.`,
              sound: 'default',
              data: { category: 'task_exam', examId: exam.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(triggerMs),
            },
          });
          scheduledCount++;
        } catch {}
      }
    }
  }

  // 3. Schedule reminders for unpaid installments (2 days before deadline at 10:00)
  if (prefs.paymentsAndInstallments) {
    for (const pay of payments) {
      if (scheduledCount >= MAX_SCHEDULED) break;
      if (pay.status !== 'unpaid' || !pay.due_date) continue;
      const deadlineDate = new Date(`${pay.due_date}T10:00:00`);
      if (Number.isNaN(deadlineDate.getTime())) continue;

      const triggerMs = deadlineDate.getTime() - 2 * 24 * 60 * 60 * 1000;
      if (triggerMs > nowMs + 30_000) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Termin płatności: ${pay.title}`,
              body: `Do zapłaty ${pay.amount.toFixed(2)} ${pay.currency} do dnia ${pay.due_date}.`,
              sound: 'default',
              data: { category: 'payment', paymentId: pay.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(triggerMs),
            },
          });
          scheduledCount++;
        } catch {}
      }
    }
  }
}

export async function sendTestUsosNotification(
  category: NotificationCategory,
  prefs: NotificationPreferences
): Promise<AppNotificationEvent> {
  await requestNotificationPermissions();

  const samples: Record<NotificationCategory, { title: string; body: string }> = {
    class_change: {
      title: 'Zmiana godzin zajęć • Inżynieria Oprogramowania',
      body: 'Zajęcia zostały przesunięte na 11:30–13:00 (wcześniej 09:45–11:15), sala 204N.',
    },
    class_reminder: {
      title: `Za ${prefs.reminderMinutesBefore} min: Algorytmy i Struktury Danych`,
      body: 'Wykład • godz. 10:00–11:30 • Sala A1 (Budynek Główny).',
    },
    grade: {
      title: 'Nowa ocena w USOS: 5.0 ( bardzo dobry )',
      body: 'Programowanie Obiektowe (Wykład, I termin) — wpisano nową ocenę do protokołu.',
    },
    task_exam: {
      title: 'Nowe zadanie / Kolokwium • Bazy Danych',
      body: 'Opublikowano harmonogram zadania projektowego i kolokwium zaliczeniowego w USOS.',
    },
    payment: {
      title: 'Przypomnienie o racie czesnego',
      body: 'Zbliża się termin płatności raty (1900.00 PLN). Kliknij, aby skopiować numer konta IBAN.',
    },
    survey: {
      title: 'Nowa ankieta oceny zajęć w USOS',
      body: 'Wypełnij anonimową ankietę studencką dla prowadzących z bieżącego semestru.',
    },
  };

  const sample = samples[category];
  return fireImmediateLocalNotification(sample.title, sample.body, category, {
    ...prefs,
    enabled: true,
    quietHoursEnabled: false,
  });
}
