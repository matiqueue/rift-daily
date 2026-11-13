import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { create } from 'zustand';

const staffSearchCache = new Map<string, UsosStaffMember[]>();

import {
  DEFAULT_USOS_INSTALLATIONS,
  fetchAllUsosInstallations,
  UsosInstallation,
} from '@/api/installations';
import { parseQueryString } from '@/api/oauth1';
import {
  UsosBankAccount,
  UsosBuilding,
  UsosClearanceSlip,
  UsosCourseEdition,
  UsosDormInfo,
  UsosExamItem,
  UsosGradeItem,
  UsosPaymentItem,
  UsosRegistrationRound,
  UsosStaffMember,
  UsosStudentCard,
  UsosSurveyItem,
  UsosThesisInfo,
  UsosTimetableActivity,
  UsosUserProfile,
} from '@/api/types';
import { UsosApiClient } from '@/api/usosClient';
import {
  AppNotificationEvent,
  configureNotificationsHandler,
  DEFAULT_NOTIFICATION_PREFERENCES,
  detectChangesAndScheduleNotifications,
  NotificationCategory,
  NotificationPreferences,
  requestNotificationPermissions,
  scheduleUpcomingReminders,
  sendTestUsosNotification,
} from '@/services/notifications';
import { ThemeMode } from '@/theme/theme';

export interface SimulatedGrade {
  id: string;
  name: string;
  ects: number;
  grade: number;
}

interface UsosState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
  themeMode: ThemeMode;

  securityConfigured: boolean;
  securityEnabled: boolean;
  securityPin: string;
  biometricsEnabled: boolean;
  isLocked: boolean;

  notificationPrefs: NotificationPreferences;
  notificationHistory: AppNotificationEvent[];

  installations: UsosInstallation[];
  selectedInstallation: UsosInstallation;
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;

  pendingRequestToken: string;
  pendingRequestSecret: string;

  user: UsosUserProfile;
  timetable: UsosTimetableActivity[];
  upcomingTimetable: UsosTimetableActivity[];
  timetableWeekOffset: number;
  grades: UsosGradeItem[];
  courses: UsosCourseEdition[];
  exams: UsosExamItem[];
  payments: UsosPaymentItem[];
  bankAccount: UsosBankAccount | null;
  studentCard: UsosStudentCard | null;
  registrations: UsosRegistrationRound[];
  surveys: UsosSurveyItem[];
  staff: UsosStaffMember[];
  buildings: UsosBuilding[];
  thesis: UsosThesisInfo | null;
  dorm: UsosDormInfo | null;
  slips: UsosClearanceSlip[];
  simulatedGrades: SimulatedGrade[];

  hydrate: () => Promise<void>;
  loadInstallations: () => Promise<void>;
  setSelectedInstallation: (inst: UsosInstallation) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  configureSecurity: (opts: {
    enabled: boolean;
    pin: string;
    biometrics: boolean;
  }) => Promise<void>;
  unlockSession: () => void;
  lockSession: () => void;
  updateNotificationPreferences: (patch: Partial<NotificationPreferences>) => Promise<void>;
  triggerTestNotification: (category: NotificationCategory) => Promise<void>;
  clearNotificationHistory: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  saveOAuthConsumerCredentials: (key: string, secret: string) => Promise<void>;
  loginWithOAuth: () => Promise<{ ok: boolean; error?: string; needsPin?: boolean }>;
  startPinOAuth: () => Promise<{ ok: boolean; error?: string }>;
  completePinOAuth: (pinCode: string) => Promise<{ ok: boolean; error?: string }>;
  syncFromLiveApi: () => Promise<void>;
  changeTimetableWeek: (offsetDelta: number) => Promise<void>;
  logout: () => Promise<void>;

  toggleExamRegistration: (examId: string) => void;
  toggleCourseRegistration: (roundId: string, courseId: string, group?: string) => void;
  submitSurvey: (surveyId: string, rating: number, comment: string) => void;
  addSimulatedGrade: (name: string, ects: number, grade: number) => void;
  removeSimulatedGrade: (id: string) => void;
  searchStaffLive: (query: string) => Promise<UsosStaffMember[]>;
}

const STORAGE_KEYS = {
  INST_ID: 'indeks_plus_inst_id_v1',
  CONSUMER_KEY: 'indeks_plus_consumer_key_v1',
  CONSUMER_SECRET: 'indeks_plus_consumer_secret_v1',
  ACCESS_TOKEN: 'indeks_plus_access_token_v1',
  ACCESS_SECRET: 'indeks_plus_access_secret_v1',
  THEME_MODE: 'indeks_plus_theme_mode_v1',
  SEC_CONFIGURED: 'rift_daily_sec_configured_v1',
  SEC_ENABLED: 'rift_daily_sec_enabled_v1',
  SEC_PIN: 'rift_daily_sec_pin_v1',
  SEC_BIO: 'rift_daily_sec_bio_v1',
  NOTIF_PREFS: 'rift_daily_notif_prefs_v1',
  NOTIF_HISTORY: 'rift_daily_notif_history_v1',
};

function getMondayForWeekOffset(offsetWeeks = 0): string {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? 1 : 1 - day) + offsetWeeks * 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
}

function getEmptyLiveState(inst: UsosInstallation) {
  return {
    user: {
      id: '',
      first_name: 'Student',
      last_name: inst.shortName,
      student_number: '—',
      email: '',
      student_status: 2,
      programmes: [
        {
          id: 'LIVE-PROG',
          programme_id: inst.shortName,
          name: { pl: inst.namePl, en: inst.nameEn },
          faculty: { pl: 'Studia wyższe', en: 'Higher Education' },
          stage: 'Konto USOS',
          status: 'ACTIVE' as const,
          admission_date: '',
          is_primary: true,
        },
      ],
      ects_collected: 0,
      ects_Target: 180,
      current_term_id: 'Bieżący',
    },
    timetable: [] as UsosTimetableActivity[],
    upcomingTimetable: [] as UsosTimetableActivity[],
    timetableWeekOffset: 0,
    grades: [] as UsosGradeItem[],
    courses: [] as UsosCourseEdition[],
    exams: [] as UsosExamItem[],
    payments: [] as UsosPaymentItem[],
    bankAccount: null as UsosBankAccount | null,
    studentCard: null as UsosStudentCard | null,
    registrations: [] as UsosRegistrationRound[],
    surveys: [] as UsosSurveyItem[],
    staff: [] as UsosStaffMember[],
    buildings: [] as UsosBuilding[],
    thesis: null as UsosThesisInfo | null,
    dorm: null as UsosDormInfo | null,
    slips: [] as UsosClearanceSlip[],
    simulatedGrades: [] as SimulatedGrade[],
  };
}

async function safeGetItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {}
}

async function safeDeleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch {}
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
}

const ukenDefault = DEFAULT_USOS_INSTALLATIONS[0];

export const useUsosStore = create<UsosState>((set, get) => ({
  isHydrated: false,
  isAuthenticated: false,
  isSyncing: false,
  lastSyncedAt: null,
  syncError: null,
  themeMode: 'dark',

  securityConfigured: false,
  securityEnabled: false,
  securityPin: '',
  biometricsEnabled: true,
  isLocked: false,

  notificationPrefs: DEFAULT_NOTIFICATION_PREFERENCES,
  notificationHistory: [],

  installations: DEFAULT_USOS_INSTALLATIONS,
  selectedInstallation: ukenDefault,
  consumerKey: ukenDefault.defaultConsumerKey || '',
  consumerSecret: ukenDefault.defaultConsumerSecret || '',
  accessToken: '',
  accessTokenSecret: '',

  pendingRequestToken: '',
  pendingRequestSecret: '',

  ...getEmptyLiveState(ukenDefault),

  hydrate: async () => {
    try {
      configureNotificationsHandler();
      const [
        instId,
        cKey,
        cSecret,
        aToken,
        aSecret,
        savedTheme,
        secConf,
        secEn,
        secPin,
        secBio,
        notifPrefsRaw,
        notifHistoryRaw,
      ] = await Promise.all([
        safeGetItem(STORAGE_KEYS.INST_ID),
        safeGetItem(STORAGE_KEYS.CONSUMER_KEY),
        safeGetItem(STORAGE_KEYS.CONSUMER_SECRET),
        safeGetItem(STORAGE_KEYS.ACCESS_TOKEN),
        safeGetItem(STORAGE_KEYS.ACCESS_SECRET),
        safeGetItem(STORAGE_KEYS.THEME_MODE),
        safeGetItem(STORAGE_KEYS.SEC_CONFIGURED),
        safeGetItem(STORAGE_KEYS.SEC_ENABLED),
        safeGetItem(STORAGE_KEYS.SEC_PIN),
        safeGetItem(STORAGE_KEYS.SEC_BIO),
        safeGetItem(STORAGE_KEYS.NOTIF_PREFS),
        safeGetItem(STORAGE_KEYS.NOTIF_HISTORY),
      ]);

      const foundInst =
        DEFAULT_USOS_INSTALLATIONS.find((i) => i.id === instId) || DEFAULT_USOS_INSTALLATIONS[0];

      const effectiveKey = cKey || foundInst.defaultConsumerKey || '';
      const effectiveSecret = cSecret || foundInst.defaultConsumerSecret || '';
      const hasValidOAuth = Boolean(aToken && aSecret && effectiveKey && effectiveSecret);
      const isSecEnabled = secEn === '1' && Boolean(secPin);

      let parsedPrefs: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
      if (notifPrefsRaw) {
        try {
          parsedPrefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(notifPrefsRaw) };
        } catch {}
      }

      let parsedHistory: AppNotificationEvent[] = [];
      if (notifHistoryRaw) {
        try {
          parsedHistory = JSON.parse(notifHistoryRaw);
        } catch {}
      }

      set({
        ...getEmptyLiveState(foundInst),
        selectedInstallation: foundInst,
        consumerKey: effectiveKey,
        consumerSecret: effectiveSecret,
        accessToken: aToken || '',
        accessTokenSecret: aSecret || '',
        themeMode: (savedTheme as ThemeMode) || 'dark',
        securityConfigured: secConf === '1',
        securityEnabled: isSecEnabled,
        securityPin: secPin || '',
        biometricsEnabled: secBio !== '0',
        isLocked: hasValidOAuth && isSecEnabled,
        notificationPrefs: parsedPrefs,
        notificationHistory: parsedHistory,
        isAuthenticated: hasValidOAuth,
        isHydrated: true,
      });

      get().loadInstallations();

      if (hasValidOAuth) {
        if (parsedPrefs.enabled) {
          requestNotificationPermissions().catch(() => {});
        }
        get().syncFromLiveApi();
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  loadInstallations: async () => {
    const list = await fetchAllUsosInstallations();
    const currentId = get().selectedInstallation.id;
    const updatedSelected = list.find((i) => i.id === currentId) || get().selectedInstallation;
    set({ installations: list, selectedInstallation: updatedSelected });
  },

  setSelectedInstallation: async (inst) => {
    const currentId = get().selectedInstallation.id;
    const nextKey = inst.defaultConsumerKey || '';
    const nextSecret = inst.defaultConsumerSecret || '';
    const isSameInst = currentId === inst.id;

    set({
      selectedInstallation: inst,
      consumerKey: nextKey,
      consumerSecret: nextSecret,
      pendingRequestToken: '',
      pendingRequestSecret: '',
      ...(isSameInst ? {} : { accessToken: '', accessTokenSecret: '', isAuthenticated: false }),
    });
    await safeSetItem(STORAGE_KEYS.INST_ID, inst.id);
    await safeSetItem(STORAGE_KEYS.CONSUMER_KEY, nextKey);
    await safeSetItem(STORAGE_KEYS.CONSUMER_SECRET, nextSecret);
  },

  setThemeMode: async (mode) => {
    set({ themeMode: mode });
    await safeSetItem(STORAGE_KEYS.THEME_MODE, mode);
  },

  configureSecurity: async ({ enabled, pin, biometrics }) => {
    set({
      securityConfigured: true,
      securityEnabled: enabled && Boolean(pin),
      securityPin: pin,
      biometricsEnabled: biometrics,
      isLocked: false,
    });
    await Promise.all([
      safeSetItem(STORAGE_KEYS.SEC_CONFIGURED, '1'),
      safeSetItem(STORAGE_KEYS.SEC_ENABLED, enabled && Boolean(pin) ? '1' : '0'),
      safeSetItem(STORAGE_KEYS.SEC_PIN, pin),
      safeSetItem(STORAGE_KEYS.SEC_BIO, biometrics ? '1' : '0'),
    ]);
  },

  unlockSession: () => {
    set({ isLocked: false });
  },

  lockSession: () => {
    if (get().securityEnabled && get().securityPin) {
      set({ isLocked: true });
    }
  },

  updateNotificationPreferences: async (patch) => {
    const nextPrefs: NotificationPreferences = {
      ...get().notificationPrefs,
      ...patch,
    };
    set({ notificationPrefs: nextPrefs });
    await safeSetItem(STORAGE_KEYS.NOTIF_PREFS, JSON.stringify(nextPrefs));

    if (nextPrefs.enabled) {
      await requestNotificationPermissions();
    }
    const { timetable, exams, payments } = get();
    await scheduleUpcomingReminders({
      prefs: nextPrefs,
      timetable,
      exams,
      payments,
    });
  },

  triggerTestNotification: async (category) => {
    const ev = await sendTestUsosNotification(category, get().notificationPrefs);
    const nextHistory = [ev, ...get().notificationHistory].slice(0, 30);
    set({ notificationHistory: nextHistory });
    await safeSetItem(STORAGE_KEYS.NOTIF_HISTORY, JSON.stringify(nextHistory));
  },

  clearNotificationHistory: async () => {
    set({ notificationHistory: [] });
    await safeDeleteItem(STORAGE_KEYS.NOTIF_HISTORY);
  },

  markAllNotificationsRead: async () => {
    const nextHistory = get().notificationHistory.map((item) => ({ ...item, read: true }));
    set({ notificationHistory: nextHistory });
    await safeSetItem(STORAGE_KEYS.NOTIF_HISTORY, JSON.stringify(nextHistory));
  },

  saveOAuthConsumerCredentials: async (key, secret) => {
    const trimmedKey = key.trim();
    const trimmedSecret = secret.trim();
    set({ consumerKey: trimmedKey, consumerSecret: trimmedSecret });
    await safeSetItem(STORAGE_KEYS.CONSUMER_KEY, trimmedKey);
    await safeSetItem(STORAGE_KEYS.CONSUMER_SECRET, trimmedSecret);
  },

  loginWithOAuth: async () => {
    let { selectedInstallation, consumerKey, consumerSecret } = get();
    set({ isSyncing: true, syncError: null });

    if (!consumerKey || !consumerSecret) {
      if (
        selectedInstallation.defaultConsumerKey &&
        selectedInstallation.defaultConsumerSecret
      ) {
        consumerKey = selectedInstallation.defaultConsumerKey;
        consumerSecret = selectedInstallation.defaultConsumerSecret;
      } else {
        const provisioned = await UsosApiClient.autoProvisionConsumerKey(
          selectedInstallation.baseUrl
        );
        if (provisioned) {
          consumerKey = provisioned.consumerKey;
          consumerSecret = provisioned.consumerSecret;
        }
      }

      if (consumerKey && consumerSecret) {
        await get().saveOAuthConsumerCredentials(consumerKey, consumerSecret);
      } else {
        set({ isSyncing: false });
        return {
          ok: false,
          error:
            'Ta uczelnia wymaga ręcznego wygenerowania klucza OAuth 1.0a na stronie USOS API.',
        };
      }
    }

    try {
      const callbackUrl = 'riftdaily://oauth-callback';
      const client = new UsosApiClient(selectedInstallation.baseUrl, {
        consumerKey,
        consumerSecret,
      });

      const reqToken = await client.getRequestToken(callbackUrl);
      const authResult = await WebBrowser.openAuthSessionAsync(
        reqToken.authorizeUrl,
        callbackUrl
      );

      if (authResult.type !== 'success' || !authResult.url) {
        set({ isSyncing: false });
        return {
          ok: false,
          error: 'Logowanie zostało przerwane przed powrotem do aplikacji.',
        };
      }

      const queryPart = authResult.url.split('?')[1] || '';
      const params = parseQueryString(queryPart);
      const verifier = params.oauth_verifier;
      if (!verifier) {
        set({ isSyncing: false });
        return {
          ok: false,
          error: 'Brak kodu autoryzacyjnego (oauth_verifier) z serwera USOS.',
        };
      }

      const access = await client.getAccessToken(
        reqToken.oauthToken,
        reqToken.oauthTokenSecret,
        verifier
      );

      await safeSetItem(STORAGE_KEYS.ACCESS_TOKEN, access.accessToken);
      await safeSetItem(STORAGE_KEYS.ACCESS_SECRET, access.accessTokenSecret);

      set({
        ...getEmptyLiveState(selectedInstallation),
        accessToken: access.accessToken,
        accessTokenSecret: access.accessTokenSecret,
        isAuthenticated: true,
      });

      await get().syncFromLiveApi();
      return { ok: true };
    } catch (err: any) {
      const msg = err?.message || 'Błąd komunikacji z serwerem OAuth 1.0a USOS API.';
      set({ isSyncing: false, syncError: msg });
      return { ok: false, error: msg };
    }
  },

  startPinOAuth: async () => {
    let { selectedInstallation, consumerKey, consumerSecret } = get();
    if (!consumerKey || !consumerSecret) {
      consumerKey = selectedInstallation.defaultConsumerKey || '';
      consumerSecret = selectedInstallation.defaultConsumerSecret || '';
    }
    if (!consumerKey || !consumerSecret) {
      return { ok: false, error: 'Brak klucza Consumer Key dla tej uczelni.' };
    }

    set({ isSyncing: true, syncError: null });
    try {
      const client = new UsosApiClient(selectedInstallation.baseUrl, {
        consumerKey,
        consumerSecret,
      });
      const reqToken = await client.getRequestToken('oob');
      set({
        pendingRequestToken: reqToken.oauthToken,
        pendingRequestSecret: reqToken.oauthTokenSecret,
        isSyncing: false,
      });
      await WebBrowser.openBrowserAsync(reqToken.authorizeUrl);
      return { ok: true };
    } catch (err: any) {
      set({ isSyncing: false });
      return { ok: false, error: err?.message || 'Nie udało się rozpocząć autoryzacji PIN.' };
    }
  },

  completePinOAuth: async (pinCode) => {
    const {
      selectedInstallation,
      consumerKey,
      consumerSecret,
      pendingRequestToken,
      pendingRequestSecret,
    } = get();
    if (!pendingRequestToken || !pendingRequestSecret || !pinCode.trim()) {
      return { ok: false, error: 'Wpisz kod PIN wyświetlony na stronie USOSweb.' };
    }

    set({ isSyncing: true, syncError: null });
    try {
      const client = new UsosApiClient(selectedInstallation.baseUrl, {
        consumerKey,
        consumerSecret,
      });
      const access = await client.getAccessToken(
        pendingRequestToken,
        pendingRequestSecret,
        pinCode.trim()
      );

      await safeSetItem(STORAGE_KEYS.ACCESS_TOKEN, access.accessToken);
      await safeSetItem(STORAGE_KEYS.ACCESS_SECRET, access.accessTokenSecret);

      set({
        ...getEmptyLiveState(selectedInstallation),
        accessToken: access.accessToken,
        accessTokenSecret: access.accessTokenSecret,
        pendingRequestToken: '',
        pendingRequestSecret: '',
        isAuthenticated: true,
      });

      await get().syncFromLiveApi();
      return { ok: true };
    } catch (err: any) {
      set({ isSyncing: false });
      return { ok: false, error: err?.message || 'Nieprawidłowy kod PIN.' };
    }
  },

  syncFromLiveApi: async () => {
    const {
      selectedInstallation,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret,
      timetableWeekOffset,
    } = get();

    if (!consumerKey || !accessToken) {
      set({ isSyncing: false });
      return;
    }

    set({ isSyncing: true, syncError: null });

    try {
      const client = new UsosApiClient(selectedInstallation.baseUrl, {
        consumerKey,
        consumerSecret,
        token: accessToken,
        tokenSecret: accessTokenSecret,
      });

      const weekMondayIso = getMondayForWeekOffset(timetableWeekOffset);
      const emptyBase = getEmptyLiveState(selectedInstallation);

      let ectsByCourse: Record<string, number> = {};
      let liveUser: UsosUserProfile = emptyBase.user;

      try {
        const { profile, ectsByCourse: ectsMap } = await client.fetchUserProfile();
        ectsByCourse = ectsMap;
        liveUser = {
          ...emptyBase.user,
          ...profile,
          programmes:
            profile.programmes && profile.programmes.length > 0
              ? profile.programmes
              : emptyBase.user.programmes,
        };
      } catch (e: any) {
        set({ syncError: e?.message });
      }

      let timetableActivities: UsosTimetableActivity[] = [];
      let upcomingActivities: UsosTimetableActivity[] = [];
      let effectiveWeekOffset = timetableWeekOffset;
      let knownLecturersMap: Record<string, UsosStaffMember> = {};

      const addDaysIso = (isoDate: string, days: number): string => {
        const [y, m, d] = isoDate.split('-').map((v) => parseInt(v, 10));
        const dt = new Date(y, m - 1, d + days, 0, 0, 0, 0);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
      };

      try {
        const currentMondayIso = getMondayForWeekOffset(0);
        const upcomingResult = await client.fetchTimetable(currentMondayIso, 21);
        upcomingActivities = upcomingResult.activities;
        knownLecturersMap = upcomingResult.lecturersMap;

        if (effectiveWeekOffset >= 0 && effectiveWeekOffset <= 2) {
          const targetMondayIso = getMondayForWeekOffset(effectiveWeekOffset);
          const targetSundayIso = addDaysIso(targetMondayIso, 6);
          timetableActivities = upcomingActivities.filter(
            (a) => a.date >= targetMondayIso && a.date <= targetSundayIso
          );

          if (effectiveWeekOffset === 0 && timetableActivities.length === 0 && upcomingActivities.length > 0) {
            for (const candidateOffset of [1, 2]) {
              const candMonday = getMondayForWeekOffset(candidateOffset);
              const candSunday = addDaysIso(candMonday, 6);
              const candActivities = upcomingActivities.filter(
                (a) => a.date >= candMonday && a.date <= candSunday
              );
              if (candActivities.length > 0) {
                effectiveWeekOffset = candidateOffset;
                timetableActivities = candActivities;
                break;
              }
            }
          }
        } else {
          const ttResult = await client.fetchTimetable(weekMondayIso, 7, knownLecturersMap);
          timetableActivities = ttResult.activities;
          knownLecturersMap = ttResult.lecturersMap;
        }
      } catch {
        timetableActivities = [];
        upcomingActivities = [];
      }

      const [cgRes, payRes, cardRes, exRes, srvRes, bldRes, thRes] = await Promise.allSettled([
        client.fetchCoursesAndGrades(ectsByCourse, knownLecturersMap),
        client.fetchPaymentsAndAccount(),
        client.fetchStudentCard(),
        client.fetchExams(),
        client.fetchSurveys(knownLecturersMap),
        client.fetchBuildings(),
        client.fetchThesis(knownLecturersMap),
      ]);

      let liveCourses: UsosCourseEdition[] = [];
      let liveGrades: UsosGradeItem[] = [];
      let liveStaff: UsosStaffMember[] = Object.values(knownLecturersMap);

      if (cgRes.status === 'fulfilled') {
        liveCourses = cgRes.value.courses;
        liveGrades = cgRes.value.grades;
        liveStaff = cgRes.value.myLecturers;
        liveUser = {
          ...liveUser,
          current_term_id: cgRes.value.currentTermId,
        };
      }

      if (!liveUser.ects_collected && liveCourses.length > 0) {
        const passedEcts = liveCourses
          .filter((c) => c.passing_status === 'passed')
          .reduce((sum, c) => sum + (c.ects || 0), 0);
        if (passedEcts > 0) {
          liveUser = { ...liveUser, ects_collected: passedEcts };
        }
      }

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');

      const prevState = get();
      const nextPayments = payRes.status === 'fulfilled' ? payRes.value.payments : [];
      const nextExams = exRes.status === 'fulfilled' ? exRes.value : [];
      const nextSurveys = srvRes.status === 'fulfilled' ? srvRes.value : [];

      let nextNotificationHistory = prevState.notificationHistory;
      try {
        const detectedEvents = await detectChangesAndScheduleNotifications({
          isFirstSync: prevState.lastSyncedAt === null,
          prefs: prevState.notificationPrefs,
          prevTimetable: prevState.timetable,
          nextTimetable: timetableActivities,
          prevGrades: prevState.grades,
          nextGrades: liveGrades,
          prevCourses: prevState.courses,
          nextCourses: liveCourses,
          prevExams: prevState.exams,
          nextExams,
          prevPayments: prevState.payments,
          nextPayments,
          prevSurveys: prevState.surveys,
          nextSurveys,
        });
        if (detectedEvents.length > 0) {
          nextNotificationHistory = [...detectedEvents, ...prevState.notificationHistory].slice(
            0,
            30
          );
          await safeSetItem(
            STORAGE_KEYS.NOTIF_HISTORY,
            JSON.stringify(nextNotificationHistory)
          );
        }
      } catch {
        // Ignore notification errors during sync
      }

      const sortedLiveStaff = [...liveStaff].sort((a, b) => {
        const photoDiff = Number(Boolean(b.photo_url)) - Number(Boolean(a.photo_url));
        if (photoDiff !== 0) return photoDiff;
        return a.name.localeCompare(b.name, 'pl');
      });

      set({
        user: liveUser,
        timetable: timetableActivities,
        upcomingTimetable: upcomingActivities,
        timetableWeekOffset: effectiveWeekOffset,
        courses: liveCourses,
        grades: liveGrades,
        staff: sortedLiveStaff,
        payments: nextPayments,
        bankAccount: payRes.status === 'fulfilled' ? payRes.value.bankAccount : null,
        studentCard: cardRes.status === 'fulfilled' ? cardRes.value : null,
        exams: nextExams,
        surveys: nextSurveys,
        buildings: bldRes.status === 'fulfilled' ? bldRes.value : [],
        thesis: thRes.status === 'fulfilled' ? thRes.value : null,
        registrations: [],
        dorm: null,
        slips: [],
        notificationHistory: nextNotificationHistory,
        isSyncing: false,
        lastSyncedAt: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      });
    } catch (err: any) {
      set({
        isSyncing: false,
        syncError: err?.message || 'Błąd synchronizacji z USOS API',
      });
    }
  },

  changeTimetableWeek: async (offsetDelta) => {
    const nextOffset = offsetDelta === 0 ? 0 : get().timetableWeekOffset + offsetDelta;
    set({ timetableWeekOffset: nextOffset });

    const {
      selectedInstallation,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret,
      staff,
    } = get();

    if (consumerKey && accessToken) {
      set({ isSyncing: true });
      try {
        const client = new UsosApiClient(selectedInstallation.baseUrl, {
          consumerKey,
          consumerSecret,
          token: accessToken,
          tokenSecret: accessTokenSecret,
        });
        const knownMap: Record<string, UsosStaffMember> = {};
        for (const s of staff) knownMap[s.id] = s;
        const weekMondayIso = getMondayForWeekOffset(nextOffset);
        const tt = await client.fetchTimetable(weekMondayIso, 7, knownMap);
        set({
          timetable: tt.activities,
          staff: Object.values(tt.lecturersMap).sort((a, b) => {
            const photoDiff = Number(Boolean(b.photo_url)) - Number(Boolean(a.photo_url));
            if (photoDiff !== 0) return photoDiff;
            return a.name.localeCompare(b.name, 'pl');
          }),
          isSyncing: false,
        });
      } catch {
        set({ isSyncing: false });
      }
    }
  },

  logout: async () => {
    const { selectedInstallation } = get();
    await Promise.all([
      safeDeleteItem(STORAGE_KEYS.ACCESS_TOKEN),
      safeDeleteItem(STORAGE_KEYS.ACCESS_SECRET),
    ]);
    set({
      ...getEmptyLiveState(selectedInstallation),
      isAuthenticated: false,
      isLocked: false,
      accessToken: '',
      accessTokenSecret: '',
      pendingRequestToken: '',
      pendingRequestSecret: '',
    });
  },

  toggleExamRegistration: (examId) => {
    set((state) => ({
      exams: state.exams.map((ex) => {
        if (ex.id !== examId) return ex;
        const nextReg = !ex.is_registered;
        return {
          ...ex,
          is_registered: nextReg,
          seats_taken: nextReg ? ex.seats_taken + 1 : Math.max(0, ex.seats_taken - 1),
        };
      }),
    }));
  },

  toggleCourseRegistration: (roundId, courseId, group) => {
    set((state) => ({
      registrations: state.registrations.map((round) => {
        if (round.id !== roundId) return round;
        return {
          ...round,
          courses: round.courses.map((c) => {
            if (c.course_id !== courseId) return c;
            const nextReg = !c.is_registered;
            return {
              ...c,
              is_registered: nextReg,
              selected_group: nextReg ? group || c.group_options[0] : undefined,
              seats_free: nextReg ? Math.max(0, c.seats_free - 1) : c.seats_free + 1,
            };
          }),
        };
      }),
    }));
  },

  submitSurvey: (surveyId, rating, comment) => {
    set((state) => ({
      surveys: state.surveys.map((s) =>
        s.id === surveyId ? { ...s, filled_out: true, rating, comment } : s
      ),
    }));
  },

  addSimulatedGrade: (name, ects, grade) => {
    set((state) => ({
      simulatedGrades: [
        ...state.simulatedGrades,
        {
          id: `sim-${Date.now()}`,
          name: name.trim() || 'Przedmiot symulowany',
          ects,
          grade,
        },
      ],
    }));
  },

  removeSimulatedGrade: (id) => {
    set((state) => ({
      simulatedGrades: state.simulatedGrades.filter((g) => g.id !== id),
    }));
  },

  searchStaffLive: async (query) => {
    const q = query.trim().toLowerCase();
    const currentStaff = get().staff;
    const sortPhotoFirst = (arr: UsosStaffMember[]) =>
      [...arr].sort((a, b) => {
        const photoDiff = Number(Boolean(b.photo_url)) - Number(Boolean(a.photo_url));
        if (photoDiff !== 0) return photoDiff;
        return a.name.localeCompare(b.name, 'pl');
      });

    if (!q) return sortPhotoFirst(currentStaff);

    const localFiltered = sortPhotoFirst(
      currentStaff.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.titles.toLowerCase().includes(q) ||
          s.faculty.toLowerCase().includes(q) ||
          s.building.toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.courses_taught || []).some((c) => c.toLowerCase().includes(q)) ||
          (s.interests || '').toLowerCase().includes(q)
      )
    );

    const { selectedInstallation, consumerKey, consumerSecret, accessToken, accessTokenSecret } =
      get();

    const effectiveKey = consumerKey || selectedInstallation.defaultConsumerKey || '';
    const effectiveSecret = consumerSecret || selectedInstallation.defaultConsumerSecret || '';
    const cacheKey = `${selectedInstallation.id}:${q}`;

    if (effectiveKey && q.length >= 2) {
      if (staffSearchCache.has(cacheKey)) {
        const cached = staffSearchCache.get(cacheKey)!;
        const seen = new Set(localFiltered.map((s) => s.id));
        return sortPhotoFirst([...localFiltered, ...cached.filter((r) => !seen.has(r.id))]);
      }

      try {
        const client = new UsosApiClient(selectedInstallation.baseUrl, {
          consumerKey: effectiveKey,
          consumerSecret: effectiveSecret,
          token: accessToken || undefined,
          tokenSecret: accessTokenSecret || undefined,
        });
        const remote = await client.searchStaff(query);
        staffSearchCache.set(cacheKey, remote);
        if (remote.length > 0) {
          const seen = new Set(localFiltered.map((s) => s.id));
          return sortPhotoFirst([...localFiltered, ...remote.filter((r) => !seen.has(r.id))]);
        }
      } catch {
        // Fallback to local
      }
    }
    return localFiltered;
  },
}));

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  (window as any).__USOS_STORE__ = useUsosStore;
}
