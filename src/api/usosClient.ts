import { buildSignedOAuthUrl, OAuthCredentials, parseQueryString } from './oauth1';
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
  UsosTestNode,
  UsosThesisInfo,
  UsosTimetableActivity,
  UsosUserProfile,
} from './types';

export const USOS_DEFAULT_SCOPES = [
  'studies',
  'grades',
  'crstests',
  'email',
  'personal',
  'photo',
  'payments',
  'student_exams',
  'surveys_filling',
  'cards',
  'slips',
  'adm_documents',
  'offline_access',
].join('|');

function getCurrentWeekMondayIso(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = day === 0 ? 1 : 1 - day; // If Sunday, show upcoming week starting tomorrow
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
}

function normalizeClassTypeId(rawId?: string): 'W' | 'CW' | 'LAB' | 'PROJ' | 'SEM' | 'LEK' {
  const upper = (rawId || '').toUpperCase();
  if (upper.startsWith('W')) return 'W';
  if (upper.includes('LB') || upper.includes('LAB')) return 'LAB';
  if (upper.includes('PR') || upper === 'P') return 'PROJ';
  if (upper.includes('SEM') || upper === 'S') return 'SEM';
  if (upper.includes('LEK') || upper === 'JO') return 'LEK';
  if (upper.includes('KON')) return 'CW';
  return 'CW';
}

function stripHtmlTags(raw?: string | null): string {
  if (!raw) return '';
  return String(raw)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractPhotoUrl(photoUrls?: Record<string, any> | null): string | undefined {
  if (!photoUrls || typeof photoUrls !== 'object') return undefined;
  const candidate =
    photoUrls['original'] ||
    photoUrls['400x500'] ||
    photoUrls['400x400'] ||
    photoUrls['200x250'] ||
    photoUrls['200x200'] ||
    photoUrls['100x125'] ||
    photoUrls['100x100'] ||
    photoUrls['50x50'] ||
    Object.values(photoUrls)[0];
  return typeof candidate === 'string' && candidate.startsWith('http') ? candidate : undefined;
}

function formatUserFullName(u?: any): { fullWithTitles: string; fullName: string; titles: string } {
  if (!u) {
    return { fullWithTitles: '', fullName: '', titles: '' };
  }
  const before = u.titles?.before ? String(u.titles.before).trim() : '';
  const after = u.titles?.after ? String(u.titles.after).trim() : '';
  const first = u.first_name ? String(u.first_name).trim() : '';
  const last = u.last_name ? String(u.last_name).trim() : '';
  const fullName = `${first} ${last}`.trim();
  const titles = [before, after].filter(Boolean).join(', ');
  const fullWithTitles = [before, fullName, after ? `, ${after}` : '']
    .filter(Boolean)
    .join(' ')
    .replace(/\s+,/g, ',')
    .trim();
  return {
    fullWithTitles: fullWithTitles || fullName,
    fullName,
    titles,
  };
}

function extractGradesFromExamContainer(container: any): any[] {
  const out: any[] = [];
  if (!container) return out;

  if (Array.isArray(container)) {
    for (const item of container) {
      out.push(...extractGradesFromExamContainer(item));
    }
    return out;
  }

  if (typeof container === 'object') {
    if ('value_symbol' in container && container.value_symbol) {
      out.push(container);
      return out;
    }
    for (const val of Object.values(container)) {
      if (val && typeof val === 'object') {
        out.push(...extractGradesFromExamContainer(val));
      }
    }
  }
  return out;
}

function parseNumericGrade(symbol: string): number | null {
  const cleaned = String(symbol || '')
    .trim()
    .replace(',', '.');
  const num = parseFloat(cleaned);
  if (!Number.isNaN(num) && num >= 2.0 && num <= 5.5) {
    return num;
  }
  return null;
}

export class UsosApiClient {
  private baseUrl: string;
  private credentials: OAuthCredentials;

  constructor(baseUrl: string, credentials: OAuthCredentials) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.credentials = credentials;
  }

  private endpoint(path: string): string {
    return `${this.baseUrl}${path.replace(/^\/+/, '')}`;
  }

  /**
   * Automatically provisions an official non-administrative OAuth 1.0a Consumer Key & Secret
   * from `${baseUrl}developers/submit` if the installation supports self-service developer keys.
   */
  static async autoProvisionConsumerKey(
    baseUrl: string
  ): Promise<{ consumerKey: string; consumerSecret: string } | null> {
    try {
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const devUrl = `${normalizedBase}developers/`;
      const getRes = await fetch(devUrl);
      const html = await getRes.text();
      const match = html.match(/name=["']csrfmiddlewaretoken["']\s+value=["']([^"']+)["']/);
      const csrf = match ? match[1] : '';

      const formBody = [
        `appname=${encodeURIComponent('Better USOS iOS')}`,
        `appurl=${encodeURIComponent('https://betterusos.app')}`,
        `email=${encodeURIComponent('kontakt@betterusos.pl')}`,
        csrf ? `csrfmiddlewaretoken=${encodeURIComponent(csrf)}` : '',
      ]
        .filter(Boolean)
        .join('&');

      const postRes = await fetch(`${normalizedBase}developers/submit`, {
        method: 'POST',
        headers: {
          Referer: devUrl,
          'X-CSRFToken': csrf,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: formBody,
      });

      const json = await postRes.json();
      if (json?.status === 'success' && json.consumer_key && json.consumer_secret) {
        return {
          consumerKey: String(json.consumer_key),
          consumerSecret: String(json.consumer_secret),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Step 1 of OAuth 1.0a: Obtain an unauthorized Request Token (`services/oauth/request_token`)
   */
  async getRequestToken(
    callbackUrl = 'betterusos://oauth-callback',
    scopes = USOS_DEFAULT_SCOPES
  ): Promise<{
    oauthToken: string;
    oauthTokenSecret: string;
    authorizeUrl: string;
  }> {
    const url = buildSignedOAuthUrl(
      'GET',
      this.endpoint('services/oauth/request_token'),
      {
        oauth_callback: callbackUrl,
        scopes,
      },
      {
        consumerKey: this.credentials.consumerKey,
        consumerSecret: this.credentials.consumerSecret,
      }
    );

    const response = await fetch(url);
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`USOS OAuth request_token (${response.status}): ${text}`);
    }

    const parsed = parseQueryString(text);
    if (!parsed.oauth_token || !parsed.oauth_token_secret) {
      throw new Error('Nieprawidłowa odpowiedź z services/oauth/request_token');
    }

    const authorizeUrl = `${this.endpoint(
      'services/oauth/authorize'
    )}?oauth_token=${encodeURIComponent(parsed.oauth_token)}&interactivity=confirm_user`;

    return {
      oauthToken: parsed.oauth_token,
      oauthTokenSecret: parsed.oauth_token_secret,
      authorizeUrl,
    };
  }

  /**
   * Step 3 of OAuth 1.0a: Exchange authorized Request Token + Verifier for Access Token (`services/oauth/access_token`)
   */
  async getAccessToken(
    requestToken: string,
    requestTokenSecret: string,
    oauthVerifier: string
  ): Promise<{ accessToken: string; accessTokenSecret: string }> {
    const url = buildSignedOAuthUrl(
      'GET',
      this.endpoint('services/oauth/access_token'),
      {
        oauth_verifier: oauthVerifier.trim(),
      },
      {
        consumerKey: this.credentials.consumerKey,
        consumerSecret: this.credentials.consumerSecret,
        token: requestToken,
        tokenSecret: requestTokenSecret,
      }
    );

    const response = await fetch(url);
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`USOS OAuth access_token (${response.status}): ${text}`);
    }

    const parsed = parseQueryString(text);
    if (!parsed.oauth_token || !parsed.oauth_token_secret) {
      throw new Error('Nieprawidłowa odpowiedź z services/oauth/access_token');
    }

    return {
      accessToken: parsed.oauth_token,
      accessTokenSecret: parsed.oauth_token_secret,
    };
  }

  /**
   * Perform a signed OAuth 1.0a GET request to any USOS API method
   */
  async callMethod<T>(
    methodPath: string,
    params: Record<string, string | number | boolean | undefined> = {}
  ): Promise<T> {
    const url = buildSignedOAuthUrl(
      'GET',
      this.endpoint(methodPath),
      params,
      this.credentials
    );
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`USOS API ${methodPath} (${response.status}): ${errText}`);
    }
    return (await response.json()) as T;
  }

  /**
   * Public health check on target USOS API installation (`services/apisrv/installation`)
   */
  async checkInstallationInfo(): Promise<{
    version: string;
    institution_name: { pl: string; en: string };
    usos_schema_version?: string;
  }> {
    const res = await fetch(
      `${this.endpoint('services/apisrv/installation')}?fields=version|institution_name|usos_schema_version`
    );
    if (!res.ok) {
      throw new Error(`Serwer USOS API nie odpowiada (${res.status})`);
    }
    return await res.json();
  }

  /**
   * Batch-fetch user profiles (lecturers, coordinators, grade authors) via `services/users/users`
   */
  async fetchUsersDetailsMap(userIds: string[]): Promise<Record<string, UsosStaffMember>> {
    const uniqueIds = Array.from(
      new Set(userIds.map((id) => String(id || '').trim()).filter(Boolean))
    );
    const result: Record<string, UsosStaffMember> = {};
    if (uniqueIds.length === 0) return result;

    // Fetch in chunks of 30 IDs
    for (let i = 0; i < uniqueIds.length; i += 30) {
      const chunk = uniqueIds.slice(i, i + 30);
      const idsParam = chunk.join('|');
      let rawDict: Record<string, any> = {};

      try {
        rawDict = await this.callMethod<Record<string, any>>('services/users/users', {
          user_ids: idsParam,
          fields:
            'id|first_name|last_name|titles|email|office_hours|room|photo_urls[original|400x500|200x250|200x200|100x125]|employment_positions|interests|phone_numbers',
        });
      } catch {
        try {
          rawDict = await this.callMethod<Record<string, any>>('services/users/users', {
            user_ids: idsParam,
            fields: 'id|first_name|last_name|titles|photo_urls|email|office_hours|room',
          });
        } catch {
          try {
            rawDict = await this.callMethod<Record<string, any>>('services/users/users', {
              user_ids: idsParam,
            });
          } catch {
            continue;
          }
        }
      }

      for (const [uid, u] of Object.entries(rawDict || {})) {
        if (!u) continue;
        const { fullName, titles } = formatUserFullName(u);
        const facultyName =
          u.employment_positions?.[0]?.faculty?.name?.pl ||
          u.employment_positions?.[0]?.position?.name?.pl ||
          'Kadra dydaktyczna uczelni';
        const roomNumber = u.room?.number ? `Pokój ${u.room.number}` : 'Wg planu zajęć';
        const buildingName = u.room?.building_name?.pl || 'Kampus uczelni';
        const officeHours =
          stripHtmlTags(u.office_hours?.pl || u.office_hours?.en) ||
          'Terminy konsultacji w USOSweb';

        result[String(uid)] = {
          id: String(u.id || uid),
          name: fullName || `Wykładowca #${uid}`,
          titles: titles || 'Nauczyciel akademicki',
          faculty: facultyName,
          email: u.email || 'Kontakt przez USOSweb / pocztę uczelnianą',
          room: roomNumber,
          building: buildingName,
          office_hours: officeHours,
          photo_url: extractPhotoUrl(u.photo_urls),
          phone: Array.isArray(u.phone_numbers) ? u.phone_numbers[0] : undefined,
          interests: stripHtmlTags(u.interests?.pl || u.interests?.en) || undefined,
          courses_taught: [],
          is_my_lecturer: true,
        };
      }
    }

    return result;
  }

  /**
   * Fetch authenticated student profile (`services/users/user`, `services/progs/student`, `services/courses/user_ects_points`)
   */
  async fetchUserProfile(): Promise<{
    profile: Partial<UsosUserProfile>;
    ectsByCourse: Record<string, number>;
  }> {
    let user: any = {};
    try {
      user = await this.callMethod<any>('services/users/user', {
        fields:
          'id|first_name|last_name|student_number|email|sex|student_status|photo_urls[original|400x500|400x400|200x250|200x200|100x125]|postal_addresses|library_card_id',
      });
    } catch {
      try {
        user = await this.callMethod<any>('services/users/user', {
          fields:
            'id|first_name|last_name|student_number|email|sex|student_status|photo_urls[200x250|200x200|100x125]',
        });
      } catch {
        user = await this.callMethod<any>('services/users/user', {
          fields: 'id|first_name|last_name|student_number|email|sex|student_status|photo_urls',
        });
      }
    }

    let ectsTotal = 0;
    const ectsByCourse: Record<string, number> = {};
    try {
      const ectsMap = await this.callMethod<Record<string, any>>(
        'services/courses/user_ects_points'
      );
      for (const val of Object.values(ectsMap || {})) {
        if (typeof val === 'number') {
          ectsTotal += val;
        } else if (val && typeof val === 'object') {
          for (const [crsId, ptsRaw] of Object.entries(val)) {
            if (ptsRaw !== null && ptsRaw !== undefined) {
              const num = parseFloat(String(ptsRaw));
              if (!Number.isNaN(num) && num > 0) {
                ectsByCourse[crsId] = num;
                ectsTotal += num;
              }
            }
          }
        }
      }
    } catch {
      // Optional scope
    }

    let programmes: UsosUserProfile['programmes'] = [];
    try {
      let rawProgs: any[] = [];
      try {
        rawProgs = await this.callMethod<any[]>('services/progs/student', {
          fields: 'id|programme[id|description|mode_of_studies|level_of_studies]|status|admission_date|is_primary',
        });
      } catch {
        rawProgs = await this.callMethod<any[]>('services/progs/student');
      }

      programmes = (rawProgs || []).map((p, idx) => {
        const progDesc =
          p.programme?.description ||
          p.programme?.name || { pl: 'Kierunek studiów', en: 'Study Programme' };
        const levelPl = p.programme?.level_of_studies?.pl || '';
        const modePl = p.programme?.mode_of_studies?.pl || '';
        const facultyLabel = [levelPl, modePl].filter(Boolean).join(' • ') || 'Studia wyższe';

        return {
          id: String(p.id || idx),
          programme_id: p.programme?.id || 'PROG',
          name: progDesc,
          faculty: {
            pl: facultyLabel,
            en: 'Higher Education',
          },
          stage: p.status === 'ACTIVE' ? 'Aktywny student' : String(p.status || 'Studia'),
          status: p.status === 'ACTIVE' ? 'ACTIVE' : 'GRADUATED',
          admission_date: p.admission_date || '',
          is_primary: Boolean(p.is_primary ?? idx === 0),
        };
      });
    } catch {
      // Optional scope
    }

    return {
      profile: {
        id: String(user.id || ''),
        first_name: user.first_name || 'Student',
        last_name: user.last_name || '',
        student_number: user.student_number || '—',
        email: user.email || '',
        sex: user.sex,
        student_status: user.student_status ?? 2,
        photo_url: extractPhotoUrl(user.photo_urls),
        library_card_id: user.library_card_id ? String(user.library_card_id) : undefined,
        programmes,
        ects_collected: Math.round(ectsTotal * 10) / 10,
        ects_Target: 180,
      },
      ectsByCourse,
    };
  }

  /**
   * Fetch user's timetable (`services/tt/user`) + resolve lecturer names & photos via `services/users/users`
   */
  async fetchTimetable(
    startDate?: string,
    days = 7,
    knownUsersMap?: Record<string, UsosStaffMember>
  ): Promise<{
    activities: UsosTimetableActivity[];
    lecturersMap: Record<string, UsosStaffMember>;
  }> {
    const start = startDate || getCurrentWeekMondayIso();
    const raw = await this.callMethod<any[]>('services/tt/user', {
      start,
      days,
      fields:
        'start_time|end_time|name|course_id|course_name|classtype_name|classtype_id|group_number|room_number|building_name|building_id|lecturer_ids|frequency',
    });

    const lecturerIdSet = new Set<string>();
    for (const item of raw || []) {
      for (const lid of item.lecturer_ids || []) {
        if (lid && !knownUsersMap?.[String(lid)]) {
          lecturerIdSet.add(String(lid));
        }
      }
    }

    const fetchedMap =
      lecturerIdSet.size > 0
        ? await this.fetchUsersDetailsMap(Array.from(lecturerIdSet))
        : {};
    const lecturersMap: Record<string, UsosStaffMember> = {
      ...(knownUsersMap || {}),
      ...fetchedMap,
    };

    const colors = ['#3B82F6', '#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
    const activities: UsosTimetableActivity[] = (raw || []).map((item, idx) => {
      const startDt = new Date(String(item.start_time).replace(' ', 'T'));
      const endDt = new Date(String(item.end_time).replace(' ', 'T'));
      const dayOfWeek = startDt.getDay() === 0 ? 7 : startDt.getDay();
      const pad = (n: number) => String(n).padStart(2, '0');

      const lecturerIds: string[] = (item.lecturer_ids || []).map((id: any) => String(id));
      const firstLecturerId = lecturerIds[0] || '';
      const staffObj = lecturersMap[firstLecturerId];

      const courseNamePl = item.course_name?.pl || item.name?.pl || 'Zajęcia dydaktyczne';
      if (staffObj && courseNamePl) {
        const set = new Set(staffObj.courses_taught || []);
        set.add(courseNamePl);
        staffObj.courses_taught = Array.from(set);
      }

      const resolvedLecturer = staffObj
        ? `${staffObj.titles !== 'Nauczyciel akademicki' ? staffObj.titles + ' ' : ''}${staffObj.name}`.trim()
        : 'Prowadzący zajęcia';

      return {
        id: `${item.course_id || idx}_${item.start_time}`,
        course_id: item.course_id || `CRS-${idx}`,
        course_name: item.course_name?.pl
          ? item.course_name
          : item.name || { pl: 'Zajęcia dydaktyczne', en: 'Class' },
        class_type: item.classtype_name?.pl
          ? item.classtype_name
          : { pl: 'Zajęcia', en: 'Class' },
        class_type_id: normalizeClassTypeId(item.classtype_id),
        group_number: item.group_number || 1,
        start_time: `${pad(startDt.getHours())}:${pad(startDt.getMinutes())}`,
        end_time: `${pad(endDt.getHours())}:${pad(endDt.getMinutes())}`,
        day_of_week: dayOfWeek,
        date: String(item.start_time).slice(0, 10),
        room_number: item.room_number || 'Wg planu',
        building_name: item.building_name?.pl
          ? item.building_name
          : { pl: 'Kampus Uczelni', en: 'Campus' },
        building_id: String(item.building_id || ''),
        lecturer_name: resolvedLecturer,
        lecturer_id: firstLecturerId,
        lecturer_ids: lecturerIds,
        lecturer_photo: staffObj?.photo_url,
        lecturer_email: staffObj?.email,
        lecturer_room: staffObj?.room,
        frequency: item.frequency || 'Plan zajęć',
        color: colors[idx % colors.length],
      };
    });

    return { activities, lecturersMap };
  }

  /**
   * Fetch user's courses, grades, lecturers, and crstests points trees
   * Verified 100% compatible with UKEN `services/courses/user` (no bracket subfields on coordinators/lecturers/user_groups).
   */
  async fetchCoursesAndGrades(
    ectsByCourse: Record<string, number> = {},
    existingLecturersMap: Record<string, UsosStaffMember> = {}
  ): Promise<{
    courses: UsosCourseEdition[];
    grades: UsosGradeItem[];
    myLecturers: UsosStaffMember[];
    currentTermId: string;
  }> {
    let userCourses: any = {};
    try {
      userCourses = await this.callMethod<any>('services/courses/user', {
        active_terms_only: false,
        fields:
          'course_editions[course_id|course_name|term_id|passing_status|coordinators|lecturers|user_groups|grades|description|bibliography|notes|homepage_url|profile_url]|terms',
      });
    } catch {
      try {
        userCourses = await this.callMethod<any>('services/courses/user', {
          active_terms_only: false,
          fields:
            'course_editions[course_id|course_name|term_id|passing_status|coordinators|lecturers|user_groups]|terms',
        });
      } catch {
        userCourses = await this.callMethod<any>('services/courses/user', {
          active_terms_only: false,
        });
      }
    }

    const courseEditionsByTerm: Record<string, any[]> = userCourses?.course_editions || {};
    const termIds = Object.keys(courseEditionsByTerm).sort().reverse();

    // Determine active term from `terms` array if present
    let currentTermId = termIds[0] || 'Bieżący';
    if (Array.isArray(userCourses?.terms)) {
      const activeTerm = userCourses.terms.find((t: any) => t?.is_active);
      if (activeTerm?.id) {
        currentTermId = String(activeTerm.id);
      } else if (userCourses.terms[0]?.id) {
        currentTermId = String(userCourses.terms[0].id);
      }
    }

    // Collect all course IDs and teacher IDs across semesters
    const allCourseIds = new Set<string>();
    const teacherIdsToResolve = new Set<string>();
    const basicUserFallback: Record<string, { first_name?: string; last_name?: string }> = {};

    for (const tId of termIds) {
      const editions: any[] = courseEditionsByTerm[tId] || [];
      for (const ed of editions) {
        if (ed?.course_id) allCourseIds.add(String(ed.course_id));
        for (const c of ed?.coordinators || []) {
          if (c?.id) {
            teacherIdsToResolve.add(String(c.id));
            basicUserFallback[String(c.id)] = c;
          }
        }
        for (const l of ed?.lecturers || []) {
          if (l?.id) {
            teacherIdsToResolve.add(String(l.id));
            basicUserFallback[String(l.id)] = l;
          }
        }
        for (const g of ed?.user_groups || []) {
          for (const gl of g?.lecturers || []) {
            if (gl?.id) {
              teacherIdsToResolve.add(String(gl.id));
              basicUserFallback[String(gl.id)] = gl;
            }
          }
        }
      }
    }

    // Fetch grades via services/grades/terms2 (independently wrapped so it never breaks courses)
    let gradesData: Record<string, any> = {};
    if (termIds.length > 0) {
      const termsParam = termIds.slice(0, 12).join('|');
      try {
        gradesData = await this.callMethod<any>('services/grades/terms2', {
          term_ids: termsParam,
          fields:
            'value_symbol|passes|value_description|exam_id|exam_session_number|counts_into_average|comment|date_modified|date_acquisition|modification_author',
        });
      } catch {
        try {
          gradesData = await this.callMethod<any>('services/grades/terms2', {
            term_ids: termsParam,
          });
        } catch {
          gradesData = {};
        }
      }
    }

    // Also fetch latest grades via services/grades/latest as an extra source
    let latestGradesRaw: any[] = [];
    try {
      latestGradesRaw = await this.callMethod<any[]>('services/grades/latest', {
        days: 365,
        fields:
          'value_symbol|passes|value_description|exam_id|exam_session_number|counts_into_average|comment|date_modified|date_acquisition|modification_author|course_edition',
      });
    } catch {
      // Optional fallback
    }

    // Collect any grade author IDs so we can resolve their titles & photos too
    for (const termBucket of Object.values(gradesData || {})) {
      if (!termBucket || typeof termBucket !== 'object') continue;
      for (const crsBucket of Object.values(termBucket)) {
        const gList = [
          ...extractGradesFromExamContainer((crsBucket as any)?.course_grades),
          ...extractGradesFromExamContainer((crsBucket as any)?.course_units_grades),
        ];
        for (const g of gList) {
          if (g?.modification_author?.id) {
            const aid = String(g.modification_author.id);
            teacherIdsToResolve.add(aid);
            basicUserFallback[aid] = g.modification_author;
          }
        }
      }
    }

    // Batch-fetch full teacher details (titles, photos, rooms, office hours, emails)
    const missingTeacherIds = Array.from(teacherIdsToResolve).filter(
      (id) => !existingLecturersMap[id]
    );
    const newlyFetchedTeachers =
      missingTeacherIds.length > 0
        ? await this.fetchUsersDetailsMap(missingTeacherIds)
        : {};

    const fullTeachersMap: Record<string, UsosStaffMember> = {
      ...existingLecturersMap,
      ...newlyFetchedTeachers,
    };

    // Ensure any teacher ID that couldn't be fetched still has a fallback entry from primary user dict
    for (const [uid, basic] of Object.entries(basicUserFallback)) {
      if (!fullTeachersMap[uid] && (basic.first_name || basic.last_name)) {
        fullTeachersMap[uid] = {
          id: uid,
          name: `${basic.first_name || ''} ${basic.last_name || ''}`.trim(),
          titles: 'Nauczyciel akademicki',
          faculty: 'Kadra dydaktyczna uczelni',
          email: 'Kontakt w USOSweb',
          room: 'Wg planu zajęć',
          building: 'Kampus',
          office_hours: 'Wg harmonogramu konsultacji w USOSweb',
          courses_taught: [],
          is_my_lecturer: true,
        };
      }
    }

    // Fetch course details (`ects_credits_simplified`, `description`, `bibliography`, `assessment_criteria`) via `services/courses/courses`
    const courseDetailsMap: Record<string, any> = {};
    const courseIdList = Array.from(allCourseIds);
    for (let i = 0; i < courseIdList.length; i += 25) {
      const chunk = courseIdList.slice(i, i + 25);
      try {
        const res = await this.callMethod<Record<string, any>>('services/courses/courses', {
          course_ids: chunk.join('|'),
          fields:
            'id|name|ects_credits_simplified|description|bibliography|assessment_criteria',
        });
        Object.assign(courseDetailsMap, res || {});
      } catch {
        // Optional enrichment
      }
    }

    // Fetch student's test trees (`services/crstests/participant`) if available
    const testTreesByCourse: Record<string, UsosTestNode[]> = {};
    try {
      const crsTests = await this.callMethod<any>('services/crstests/participant');
      const testsByTerm = crsTests?.tests || {};
      for (const rootList of Object.values(testsByTerm) as any[]) {
        for (const root of rootList || []) {
          const cid = root.course_edition?.course_id;
          if (cid && root.node_id) {
            testTreesByCourse[cid] = [
              {
                id: String(root.node_id),
                name: root.name || { pl: 'Sprawdziany przedmiotu', en: 'Course Tests' },
                type: 'folder',
                description: stripHtmlTags(root.description?.pl),
              },
            ];
          }
        }
      }
    } catch {
      // Optional scope
    }

    const courses: UsosCourseEdition[] = [];
    const grades: UsosGradeItem[] = [];
    const seenGradeKeys = new Set<string>();

    const formatTeacherLabel = (userObj?: any): {
      label: string;
      id?: string;
      photo?: string;
    } => {
      if (!userObj) return { label: 'Prowadzący przedmiot' };
      const uid = String(userObj.id || '');
      const rich = fullTeachersMap[uid];
      if (rich) {
        const prefix =
          rich.titles && rich.titles !== 'Nauczyciel akademicki' ? `${rich.titles} ` : '';
        return {
          label: `${prefix}${rich.name}`.trim(),
          id: uid,
          photo: rich.photo_url,
        };
      }
      const fallbackName = `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim();
      return {
        label: fallbackName || 'Prowadzący przedmiot',
        id: uid || undefined,
      };
    };

    for (const tId of termIds) {
      const editions: any[] = courseEditionsByTerm[tId] || [];
      for (const ed of editions) {
        const cid = String(ed.course_id || '');
        const cDetails = courseDetailsMap[cid] || {};
        const courseNameObj = ed.course_name?.pl
          ? ed.course_name
          : cDetails.name?.pl
          ? cDetails.name
          : { pl: cid, en: cid };

        // Determine ECTS from user_ects_points -> course.ects_credits_simplified -> 0
        const rawSimplifiedEcts = parseFloat(String(cDetails.ects_credits_simplified ?? ''));
        const courseEcts =
          ectsByCourse[cid] ??
          (!Number.isNaN(rawSimplifiedEcts) && rawSimplifiedEcts >= 0 ? rawSimplifiedEcts : 0);

        const firstCoordRaw = ed.coordinators?.[0] || ed.lecturers?.[0];
        const coordInfo = formatTeacherLabel(firstCoordRaw);

        // Build deduplicated list of all lecturers for this course
        const courseLecturersMap = new Map<
          string,
          { id: string; name: string; titles: string; photo_url?: string }
        >();
        const registerCourseTeacher = (uRaw: any) => {
          if (!uRaw?.id) return;
          const uid = String(uRaw.id);
          const rich = fullTeachersMap[uid];
          if (rich) {
            const set = new Set(rich.courses_taught || []);
            set.add(courseNameObj.pl);
            rich.courses_taught = Array.from(set);
            courseLecturersMap.set(uid, {
              id: uid,
              name: rich.name,
              titles: rich.titles,
              photo_url: rich.photo_url,
            });
          } else {
            const name = `${uRaw.first_name || ''} ${uRaw.last_name || ''}`.trim();
            if (name) {
              courseLecturersMap.set(uid, {
                id: uid,
                name,
                titles: 'Prowadzący',
              });
            }
          }
        };

        for (const c of ed.coordinators || []) registerCourseTeacher(c);
        for (const l of ed.lecturers || []) registerCourseTeacher(l);
        for (const g of ed.user_groups || []) {
          for (const gl of g.lecturers || []) registerCourseTeacher(gl);
        }

        const groups = (ed.user_groups || []).map((g: any) => {
          const gLecRaw = g.lecturers?.[0];
          const gLecInfo = gLecRaw ? formatTeacherLabel(gLecRaw) : coordInfo;
          const participantsCount = Array.isArray(g.participants)
            ? g.participants.length
            : 0;

          return {
            group_number: g.group_number || 1,
            class_type_id: normalizeClassTypeId(g.class_type_id),
            class_type_name: g.class_type?.pl || g.class_type_id || 'Zajęcia',
            lecturer: gLecInfo.label,
            lecturer_id: gLecInfo.id,
            lecturer_photo: gLecInfo.photo,
            room: `Semestr ${tId}`,
            schedule_summary: `${g.class_type?.pl || 'Grupa'} • gr. ${g.group_number || 1}`,
            participants_count: participantsCount,
          };
        });

        // Extract grades from:
        // 1) services/grades/terms2 (`gradesData[tId][cid]`)
        // 2) embedded `ed.grades` on `course_edition` if returned
        const termGradeEntry = gradesData?.[tId]?.[cid];
        const embeddedGradeEntry = ed.grades;
        const extractedGrades = [
          ...extractGradesFromExamContainer(termGradeEntry?.course_grades),
          ...extractGradesFromExamContainer(termGradeEntry?.course_units_grades),
          ...extractGradesFromExamContainer(embeddedGradeEntry?.course_grades),
          ...extractGradesFromExamContainer(embeddedGradeEntry?.course_units_grades),
        ];

        let finalSymbol: string | undefined;
        let idxG = 0;

        for (const gObj of extractedGrades) {
          if (!gObj?.value_symbol) continue;
          const dedupKey = `${tId}_${cid}_${gObj.exam_id || idxG}_${
            gObj.exam_session_number || 1
          }_${gObj.value_symbol}`;
          if (seenGradeKeys.has(dedupKey)) continue;
          seenGradeKeys.add(dedupKey);

          finalSymbol = String(gObj.value_symbol);
          const numeric = parseNumericGrade(finalSymbol);
          const authorInfo = gObj.modification_author
            ? formatTeacherLabel(gObj.modification_author)
            : coordInfo;

          grades.push({
            id: dedupKey,
            course_id: cid,
            course_name: courseNameObj,
            term_id: tId,
            ects: courseEcts,
            value_symbol: finalSymbol,
            value_numeric: numeric,
            passes: Boolean(gObj.passes),
            counts_into_average: gObj.counts_into_average !== false,
            exam_session_number: gObj.exam_session_number || 1,
            date_modified: String(gObj.date_modified || gObj.date_acquisition || tId).slice(
              0,
              10
            ),
            author_name: authorInfo.label,
            author_id: authorInfo.id,
            author_photo: authorInfo.photo,
            comment: gObj.comment || gObj.value_description?.pl,
            class_type: gObj.value_description?.pl || 'Protokół USOS',
          });
          idxG++;
        }

        const rawDesc =
          stripHtmlTags(ed.description?.pl || cDetails.description?.pl) ||
          `Przedmiot realizowany w semestrze ${tId} (kod USOS: ${cid}).`;
        const rawCriteria =
          stripHtmlTags(ed.notes?.pl || cDetails.assessment_criteria?.pl) ||
          'Warunki zaliczenia zgodnie z kartą przedmiotu oraz regulaminem studiów uczelni.';
        const rawBib = stripHtmlTags(ed.bibliography?.pl || cDetails.bibliography?.pl);
        const literatureList = rawBib
          ? rawBib
              .split('\n')
              .map((s) => s.replace(/^[•\-*]\s*/, '').trim())
              .filter((s) => s.length > 3)
              .slice(0, 8)
          : ['Literatura wskazana przez prowadzącego podczas zajęć oraz w sylabusie USOSweb.'];

        courses.push({
          course_id: cid,
          course_name: courseNameObj,
          term_id: tId,
          ects: courseEcts,
          coordinator: coordInfo.label,
          coordinator_id: coordInfo.id,
          coordinator_photo: coordInfo.photo,
          lecturers: Array.from(courseLecturersMap.values()),
          faculty: `Semestr ${tId}`,
          passing_status:
            ed.passing_status === 'passed' || (finalSymbol && finalSymbol !== '2' && finalSymbol !== 'NZAL')
              ? 'passed'
              : ed.passing_status === 'failed' || finalSymbol === '2' || finalSymbol === 'NZAL'
              ? 'failed'
              : 'in_progress',
          final_grade: finalSymbol,
          syllabus_description: rawDesc,
          assessment_criteria: rawCriteria,
          literature: literatureList,
          homepage_url: ed.homepage_url || undefined,
          profile_url: ed.profile_url || undefined,
          groups,
          test_tree: testTreesByCourse[cid],
        });
      }
    }

    // Merge any additional grades from services/grades/latest that weren't in terms2
    for (const lg of latestGradesRaw || []) {
      if (!lg?.value_symbol) continue;
      const cid = String(lg.course_edition?.course_id || 'USOS');
      const tId = String(lg.course_edition?.term_id || currentTermId);
      const dedupKey = `${tId}_${cid}_${lg.exam_id || 0}_${lg.exam_session_number || 1}_${
        lg.value_symbol
      }`;
      if (seenGradeKeys.has(dedupKey)) continue;
      seenGradeKeys.add(dedupKey);

      const authorInfo = lg.modification_author
        ? formatTeacherLabel(lg.modification_author)
        : { label: 'Protokół USOS' };

      grades.push({
        id: dedupKey,
        course_id: cid,
        course_name: lg.course_edition?.course_name || { pl: cid, en: cid },
        term_id: tId,
        ects: ectsByCourse[cid] ?? 0,
        value_symbol: String(lg.value_symbol),
        value_numeric: parseNumericGrade(String(lg.value_symbol)),
        passes: Boolean(lg.passes),
        counts_into_average: lg.counts_into_average !== false,
        exam_session_number: lg.exam_session_number || 1,
        date_modified: String(lg.date_modified || lg.date_acquisition || tId).slice(0, 10),
        author_name: authorInfo.label,
        author_id: authorInfo.id,
        author_photo: authorInfo.photo,
        comment: lg.comment || lg.value_description?.pl,
        class_type: lg.value_description?.pl || 'Protokół USOS',
      });
    }

    const myLecturers = Object.values(fullTeachersMap).sort((a, b) =>
      a.name.localeCompare(b.name, 'pl')
    );

    return { courses, grades, myLecturers, currentTermId };
  }

  /**
   * Fetch user payments & bank accounts (`services/payments/user_payments`, `services/payments/user_accounts`)
   * Accurately resolves installment plans (`chosen_installment_plan[installments]`, `available_installment_plans[installments]`)
   * and distinguishes `total_amount` from `saldo_amount` so unpaid installments never show 0 PLN!
   */
  async fetchPaymentsAndAccount(): Promise<{
    payments: UsosPaymentItem[];
    bankAccount: UsosBankAccount | null;
  }> {
    let rawPayments: any[] = [];
    try {
      rawPayments = await this.callMethod<any[]>('services/payments/user_payments', {
        fields:
          'id|description|saldo_amount|total_amount|payment_deadline|state|account_number|currency|type|chosen_installment_plan[id|currency|installments[number|amount|payment_date|description]]|available_installment_plans[id|is_default|currency|installments[number|amount|payment_date|description]]',
      });
    } catch {
      try {
        rawPayments = await this.callMethod<any[]>('services/payments/user_payments', {
          fields:
            'id|description|saldo_amount|total_amount|payment_deadline|state|account_number|currency|chosen_installment_plan|available_installment_plans',
        });
      } catch {
        try {
          rawPayments = await this.callMethod<any[]>('services/payments/user_payments');
        } catch {
          rawPayments = [];
        }
      }
    }

    let bankAccount: UsosBankAccount | null = null;
    try {
      const rawAccounts = await this.callMethod<any[]>('services/payments/user_accounts');
      const firstAcc = rawAccounts?.[0];
      if (firstAcc?.account_number) {
        bankAccount = {
          account_number: String(firstAcc.account_number),
          account_owner:
            firstAcc.account_owner?.pl ||
            firstAcc.name?.pl ||
            'Kwestura Uczelni',
          name: firstAcc.name?.pl || 'Indywidualne konto wpłat studenta',
          title_prefix: firstAcc.title_prefix || undefined,
          currency: firstAcc.currency?.id || firstAcc.currency || 'PLN',
        };
      }
    } catch {
      // Optional endpoint
    }

    const payments: UsosPaymentItem[] = [];

    for (let idx = 0; idx < (rawPayments || []).length; idx++) {
      const p = rawPayments[idx];
      if (!p) continue;

      const accNo = p.account_number || bankAccount?.account_number || 'Konto w USOSweb';
      const curr = p.currency?.id || (typeof p.currency === 'string' ? p.currency : 'PLN');
      if (!bankAccount && p.account_number) {
        bankAccount = {
          account_number: String(p.account_number),
          account_owner: 'Kwestura Uczelni',
          name: 'Indywidualne konto wpłat studenta',
          currency: curr,
        };
      }

      const baseTitle = p.description?.pl || p.description?.en || 'Opłata uczelniana USOS';
      const rawTotal = p.total_amount !== undefined && p.total_amount !== null ? Math.abs(Number(p.total_amount)) : 0;
      const rawSaldo = p.saldo_amount !== undefined && p.saldo_amount !== null ? Number(p.saldo_amount) : 0;
      const absSaldo = Math.abs(rawSaldo);
      const isOverallPaid = p.state === 'paid';

      // Check if this payment has an installment plan (chosen or default available)
      const chosenPlan =
        p.chosen_installment_plan ||
        (Array.isArray(p.available_installment_plans)
          ? p.available_installment_plans.find((pl: any) => pl?.is_default) ||
            p.available_installment_plans[0]
          : null);

      const rawInstallments: any[] = Array.isArray(chosenPlan?.installments)
        ? chosenPlan.installments
        : [];

      if (rawInstallments.length > 0) {
        // Expand or attach installments with their exact amounts (e.g. 1900 PLN for 2nd installment!)
        const parsedInstallments = rawInstallments.map((inst: any, iIdx: number) => {
          const instNum = Number(inst.number || iIdx + 1);
          const instAmount = Math.abs(Number(inst.amount || rawTotal || absSaldo || 0));
          const instDate = inst.payment_date || p.payment_deadline || 'Wg harmonogramu';
          const instDesc =
            inst.description?.pl ||
            inst.description?.en ||
            `${baseTitle} — Rata ${instNum}`;
          const instStatus: 'paid' | 'unpaid' = isOverallPaid ? 'paid' : 'unpaid';

          // Push each installment as an explicit item so the student sees exact Rata 1, Rata 2 amounts!
          payments.push({
            id: `${p.id || idx}_rata_${instNum}`,
            title: instDesc.toLowerCase().includes('rata')
              ? instDesc
              : `${baseTitle} (Rata ${instNum})`,
            category: 'Opłata edukacyjna',
            amount: instAmount > 0 ? instAmount : rawTotal > 0 ? rawTotal : absSaldo,
            total_amount: instAmount > 0 ? instAmount : rawTotal,
            saldo_amount: absSaldo,
            currency: curr,
            due_date: instDate,
            status: instStatus,
            account_iban: accNo,
          });

          return {
            number: instNum,
            amount: instAmount,
            payment_date: instDate,
            description: instDesc,
            status: instStatus,
          };
        });

        // If for some reason no installment was pushed, fall through
        if (parsedInstallments.length > 0) {
          continue;
        }
      }

      // Single payment / individual installment item returned directly by user_payments:
      // CRITICAL FIX: When USOS returns a future installment where `saldo_amount` is 0.00 (not yet billed into saldo)
      // while `total_amount` is 1900.00 and `state !== 'paid'`, use `total_amount`!
      let effectiveAmount = rawTotal > 0 ? rawTotal : absSaldo;
      if (!isOverallPaid && absSaldo > 0 && absSaldo <= rawTotal) {
        effectiveAmount = absSaldo;
      } else if (effectiveAmount === 0 && absSaldo > 0) {
        effectiveAmount = absSaldo;
      }

      payments.push({
        id: String(p.id || idx),
        title: baseTitle,
        category: p.type === 'dormitory' ? 'Dom studencki' : 'Opłata edukacyjna',
        amount: effectiveAmount,
        total_amount: rawTotal > 0 ? rawTotal : effectiveAmount,
        saldo_amount: absSaldo,
        currency: curr,
        due_date: p.payment_deadline || 'Wg harmonogramu USOS',
        status: isOverallPaid ? 'paid' : 'unpaid',
        account_iban: accNo,
      });
    }

    return { payments, bankAccount };
  }

  /**
   * Fetch student ID cards (`services/cards/user_cards`)
   */
  async fetchStudentCard(): Promise<UsosStudentCard | null> {
    try {
      const raw = await this.callMethod<any[]>('services/cards/user_cards', {
        fields: 'id|barcode_number|type|expiration_date|date_of_issue|student_number',
      });
      const first = raw?.[0];
      if (!first) return null;
      return {
        id: String(first.id || ''),
        barcode_number: first.barcode_number ? String(first.barcode_number) : undefined,
        expiration_date: first.expiration_date ? String(first.expiration_date) : undefined,
        date_of_issue: first.date_of_issue ? String(first.date_of_issue) : undefined,
        student_number: first.student_number ? String(first.student_number) : undefined,
        type: first.type ? String(first.type) : 'student',
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetch student exams (`services/exams/student_exams`)
   */
  async fetchExams(): Promise<UsosExamItem[]> {
    try {
      const raw = await this.callMethod<any[]>('services/exams/student_exams', {
        fields: 'id|name|description|course[id|name]|term[id]|registration_start|registration_end',
      });

      return (raw || []).map((ex, idx) => ({
        id: String(ex.id || idx),
        course_id: ex.course?.id || `EX-${idx}`,
        course_name: ex.course?.name?.pl || ex.name?.pl || 'Egzamin',
        type: 'Egzamin pisemny',
        term_number: 1,
        date: (ex.registration_end || '').slice(0, 10) || 'Sesja egzaminacyjna',
        time: 'Wg harmonogramu',
        room: 'Wg USOSweb',
        building: 'Kampus',
        examiner: 'Komisja egzaminacyjna',
        is_registered: true,
        registration_deadline: (ex.registration_end || '').slice(0, 10),
        seats_taken: 1,
        seats_limit: 30,
        description: stripHtmlTags(ex.description?.pl),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch student surveys to fill (`services/surveys/surveys_to_fill2`)
   * Uses `lecturer` without invalid `[titles]` subfield!
   */
  async fetchSurveys(
    knownLecturers: Record<string, UsosStaffMember> = {}
  ): Promise<UsosSurveyItem[]> {
    try {
      const raw = await this.callMethod<any[]>('services/surveys/surveys_to_fill2', {
        include_filled_out: true,
        fields: 'id|name|lecturer|end_date|did_i_fill_out',
      });

      return (raw || []).map((s, idx) => {
        const lid = s.lecturer?.id ? String(s.lecturer.id) : '';
        const rich = knownLecturers[lid];
        const lecturerName = rich
          ? `${rich.titles !== 'Nauczyciel akademicki' ? rich.titles + ' ' : ''}${rich.name}`.trim()
          : s.lecturer
          ? `${s.lecturer.first_name || ''} ${s.lecturer.last_name || ''}`.trim()
          : 'Prowadzący';

        return {
          id: String(s.id || idx),
          course_name: s.name?.pl || 'Ankieta oceny zajęć',
          lecturer_name: lecturerName,
          lecturer_photo: rich?.photo_url,
          class_type: 'Ankieta studencka',
          term_id: 'Bieżący',
          deadline: (s.end_date || '').slice(0, 10) || 'Aktywna',
          filled_out: Boolean(s.did_i_fill_out),
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Fetch campus buildings (`services/geo/building_index`)
   */
  async fetchBuildings(): Promise<UsosBuilding[]> {
    try {
      const raw = await this.callMethod<any[]>('services/geo/building_index', {
        fields: 'id|name|postal_address|location|campus_name',
      });

      return (raw || []).map((b) => ({
        id: String(b.id),
        code: String(b.id),
        name: b.name?.pl || String(b.id),
        address: b.postal_address || b.campus_name?.pl || b.name?.pl || 'Kampus Uczelni',
        latitude: b.location?.lat || 50.0736,
        longitude: b.location?.long || 19.9056,
        facilities: ['Budynek dydaktyczny uczelni', 'Sale wykładowe i laboratoryjne'],
        rooms_sample: ['Sale dydaktyczne wg planu zajęć'],
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch student theses (`services/theses/user`)
   * Uses `supervisors` and `faculty` without invalid subfields.
   */
  async fetchThesis(
    knownLecturers: Record<string, UsosStaffMember> = {}
  ): Promise<UsosThesisInfo | null> {
    try {
      const raw = await this.callMethod<any>('services/theses/user', {
        fields: 'authored_theses[id|type|title|titles|supervisors|faculty]',
      });
      const first = raw?.authored_theses?.[0];
      if (!first) return null;

      const rawSup = first.supervisors?.[0];
      const supId = rawSup?.id ? String(rawSup.id) : '';
      const richSup = knownLecturers[supId];
      const supName = richSup
        ? `${richSup.titles !== 'Nauczyciel akademicki' ? richSup.titles + ' ' : ''}${richSup.name}`.trim()
        : rawSup
        ? `${rawSup.first_name || ''} ${rawSup.last_name || ''}`.trim()
        : 'Promotor pracy';

      return {
        id: String(first.id),
        type:
          first.type === 'master'
            ? 'Magisterska'
            : first.type === 'engineer'
            ? 'Inżynierska'
            : 'Licencjacka',
        title_pl: first.titles?.pl || first.title || 'Praca dyplomowa w systemie APD',
        title_en: first.titles?.en || first.title || '',
        supervisor: supName,
        supervisor_photo: richSup?.photo_url,
        reviewer: 'Wg systemu APD',
        faculty: first.faculty?.name?.pl || 'Wydział Uczelni',
        status: 'Złożona w APD',
        progress_percent: 100,
        milestones: [
          { label: 'Zarejestrowana w Archiwum Prac Dyplomowych (APD)', done: true },
          { label: 'Przypisany promotor pracy dyplomowej', done: true },
        ],
      };
    } catch {
      return null;
    }
  }

  /**
   * Search university staff members (`services/users/search2`)
   * Verified 200 OK on UKEN `services/users/search2`, including `photo_urls`!
   */
  async searchStaff(query: string): Promise<UsosStaffMember[]> {
    if (!query.trim()) return [];
    const raw = await this.callMethod<any>('services/users/search2', {
      lang: 'pl',
      query: query.trim(),
      among: 'current_staff',
      num: 20,
      fields:
        'items[user[id|first_name|last_name|titles|email|office_hours|room|photo_urls[original|400x500|200x250|200x200|100x125]|employment_positions|interests]]',
    });

    return (raw?.items || []).map((entry: any) => {
      const u = entry.user || {};
      const { fullName, titles } = formatUserFullName(u);
      return {
        id: String(u.id),
        name: fullName || 'Pracownik uczelni',
        titles: titles || 'Pracownik uczelni',
        faculty:
          u.employment_positions?.[0]?.faculty?.name?.pl ||
          u.employment_positions?.[0]?.position?.name?.pl ||
          'Jednostka uczelni',
        email: u.email || 'Kontakt przez USOSweb',
        room: u.room?.number ? `Pokój ${u.room.number}` : 'Brak danych o pokoju',
        building: u.room?.building_name?.pl || 'Kampus uczelni',
        office_hours:
          stripHtmlTags(u.office_hours?.pl || u.office_hours?.en) ||
          'Wg harmonogramu konsultacji w USOSweb',
        photo_url: extractPhotoUrl(u.photo_urls),
        interests: stripHtmlTags(u.interests?.pl || u.interests?.en) || undefined,
      };
    });
  }
}
