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
  UsosTimetableActivity,
  UsosUserProfile,
} from '@/api/types';

function formatIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

function isoDayOfWeek(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

/**
 * Generates realistic, self-contained Polish USOS sample data anchored to today's date
 * so reviewers and prospective users can explore every tab without a live university account.
 */
export function buildDemoUsosSnapshot() {
  const today = new Date();
  const todayIso = formatIsoDate(today);
  const tomorrow = addDays(today, 1);
  const tomorrowIso = formatIsoDate(tomorrow);
  const dayAfter = addDays(today, 2);
  const dayAfterIso = formatIsoDate(dayAfter);

  const user: UsosUserProfile = {
    id: 'demo-100240',
    first_name: 'Jan',
    last_name: 'Kowalski',
    student_number: '100240',
    email: 'jan.kowalski@student.uken.krakow.pl',
    sex: 'M',
    student_status: 2,
    library_card_id: 'UKEN-100240-9',
    programmes: [
      {
        id: 'DEMO-INF-1',
        programme_id: 'INF-S1',
        name: { pl: 'Informatyka (stacjonarne I stopnia)', en: 'Computer Science (BSc)' },
        faculty: { pl: 'Instytut Nauk Technicznych', en: 'Institute of Technical Sciences' },
        stage: 'Semestr 5',
        status: 'ACTIVE',
        admission_date: '2024-10-01',
        is_primary: true,
      },
    ],
    ects_collected: 124,
    ects_Target: 180,
    current_term_id: '2026/27-Z',
  };

  const staff: UsosStaffMember[] = [
    {
      id: 'staff-1',
      name: 'dr hab. Piotr Nowak, prof. UKEN',
      titles: 'dr hab., prof. UKEN',
      faculty: 'Instytut Nauk Technicznych',
      email: 'piotr.nowak@uken.krakow.pl',
      room: '204N',
      building: 'Budynek Główny UKEN',
      office_hours: 'Wtorek 11:30–13:00',
      courses_taught: ['Inżynieria Oprogramowania i Architektura'],
      is_my_lecturer: true,
    },
    {
      id: 'staff-2',
      name: 'dr inż. Anna Wiśniewska',
      titles: 'dr inż.',
      faculty: 'Instytut Nauk Technicznych',
      email: 'anna.wisniewska@uken.krakow.pl',
      room: '312N',
      building: 'Budynek Główny UKEN',
      office_hours: 'Środa 10:00–11:30',
      courses_taught: ['Algorytmy i Struktury Danych'],
      is_my_lecturer: true,
    },
    {
      id: 'staff-3',
      name: 'dr Marek Zieliński',
      titles: 'dr',
      faculty: 'Instytut Nauk Technicznych',
      email: 'marek.zielinski@uken.krakow.pl',
      room: '108A',
      building: 'Budynek Główny UKEN',
      office_hours: 'Czwartek 12:00–13:30',
      courses_taught: ['Systemy Baz Danych i SQL'],
      is_my_lecturer: true,
    },
  ];

  const timetable: UsosTimetableActivity[] = [
    {
      id: 'tt-demo-1',
      course_id: 'INF-IOA-501',
      course_name: {
        pl: 'Inżynieria Oprogramowania i Architektura',
        en: 'Software Engineering & Architecture',
      },
      class_type: { pl: 'Wykład', en: 'Lecture' },
      class_type_id: 'W',
      group_number: 1,
      start_time: '09:45',
      end_time: '11:15',
      day_of_week: isoDayOfWeek(today),
      date: todayIso,
      room_number: '204N',
      building_name: {
        pl: 'Budynek Główny UKEN (ul. Podchorążych 2)',
        en: 'UKEN Main Building',
      },
      building_id: 'BLD-MAIN',
      lecturer_name: 'dr hab. Piotr Nowak, prof. UKEN',
      lecturer_id: 'staff-1',
      lecturer_email: 'piotr.nowak@uken.krakow.pl',
      lecturer_room: '204N',
      frequency: 'co tydzień',
      color: '#6366F1',
    },
    {
      id: 'tt-demo-2',
      course_id: 'INF-ASD-502',
      course_name: {
        pl: 'Algorytmy i Struktury Danych',
        en: 'Algorithms & Data Structures',
      },
      class_type: { pl: 'Laboratorium', en: 'Laboratory' },
      class_type_id: 'LAB',
      group_number: 2,
      start_time: '11:30',
      end_time: '13:00',
      day_of_week: isoDayOfWeek(today),
      date: todayIso,
      room_number: '312N',
      building_name: {
        pl: 'Budynek Główny UKEN (ul. Podchorążych 2)',
        en: 'UKEN Main Building',
      },
      building_id: 'BLD-MAIN',
      lecturer_name: 'dr inż. Anna Wiśniewska',
      lecturer_id: 'staff-2',
      lecturer_email: 'anna.wisniewska@uken.krakow.pl',
      lecturer_room: '312N',
      frequency: 'co tydzień',
      color: '#10B981',
    },
    {
      id: 'tt-demo-3',
      course_id: 'INF-SBD-503',
      course_name: {
        pl: 'Systemy Baz Danych i SQL',
        en: 'Database Systems & SQL',
      },
      class_type: { pl: 'Ćwiczenia', en: 'Tutorial' },
      class_type_id: 'CW',
      group_number: 1,
      start_time: '14:00',
      end_time: '15:30',
      day_of_week: isoDayOfWeek(today),
      date: todayIso,
      room_number: '108A',
      building_name: {
        pl: 'Budynek Główny UKEN (ul. Podchorążych 2)',
        en: 'UKEN Main Building',
      },
      building_id: 'BLD-MAIN',
      lecturer_name: 'dr Marek Zieliński',
      lecturer_id: 'staff-3',
      lecturer_email: 'marek.zielinski@uken.krakow.pl',
      lecturer_room: '108A',
      frequency: 'co tydzień',
      color: '#F59E0B',
    },
    {
      id: 'tt-demo-4',
      course_id: 'INF-SEC-504',
      course_name: {
        pl: 'Bezpieczeństwo Aplikacji Mobilnych',
        en: 'Mobile Application Security',
      },
      class_type: { pl: 'Projekt', en: 'Project' },
      class_type_id: 'PROJ',
      group_number: 1,
      start_time: '10:00',
      end_time: '11:30',
      day_of_week: isoDayOfWeek(tomorrow),
      date: tomorrowIso,
      room_number: '215N',
      building_name: {
        pl: 'Budynek Główny UKEN (ul. Podchorążych 2)',
        en: 'UKEN Main Building',
      },
      building_id: 'BLD-MAIN',
      lecturer_name: 'dr hab. Piotr Nowak, prof. UKEN',
      lecturer_id: 'staff-1',
      frequency: 'co tydzień',
      color: '#8B5CF6',
    },
    {
      id: 'tt-demo-5',
      course_id: 'INF-AI-505',
      course_name: {
        pl: 'Uczenie Maszynowe w Praktyce',
        en: 'Applied Machine Learning',
      },
      class_type: { pl: 'Wykład', en: 'Lecture' },
      class_type_id: 'W',
      group_number: 1,
      start_time: '12:00',
      end_time: '13:30',
      day_of_week: isoDayOfWeek(dayAfter),
      date: dayAfterIso,
      room_number: 'Aula A1',
      building_name: {
        pl: 'Budynek Główny UKEN (ul. Podchorążych 2)',
        en: 'UKEN Main Building',
      },
      building_id: 'BLD-MAIN',
      lecturer_name: 'dr inż. Anna Wiśniewska',
      lecturer_id: 'staff-2',
      frequency: 'co tydzień',
      color: '#06B6D4',
    },
  ];

  const grades: UsosGradeItem[] = [
    {
      id: 'gr-demo-1',
      course_id: 'INF-IOA-501',
      course_name: {
        pl: 'Inżynieria Oprogramowania i Architektura',
        en: 'Software Engineering & Architecture',
      },
      term_id: '2026/27-Z',
      ects: 6,
      value_symbol: '5',
      value_numeric: 5.0,
      passes: true,
      counts_into_average: true,
      exam_session_number: 1,
      date_modified: todayIso,
      author_name: 'dr hab. Piotr Nowak, prof. UKEN',
      author_id: 'staff-1',
      class_type: 'Wykład',
    },
    {
      id: 'gr-demo-2',
      course_id: 'INF-ASD-502',
      course_name: {
        pl: 'Algorytmy i Struktury Danych',
        en: 'Algorithms & Data Structures',
      },
      term_id: '2026/27-Z',
      ects: 5,
      value_symbol: '5',
      value_numeric: 5.0,
      passes: true,
      counts_into_average: true,
      exam_session_number: 1,
      date_modified: todayIso,
      author_name: 'dr inż. Anna Wiśniewska',
      author_id: 'staff-2',
      class_type: 'Laboratorium',
    },
    {
      id: 'gr-demo-3',
      course_id: 'INF-SBD-503',
      course_name: {
        pl: 'Systemy Baz Danych i SQL',
        en: 'Database Systems & SQL',
      },
      term_id: '2026/27-Z',
      ects: 5,
      value_symbol: '4,5',
      value_numeric: 4.5,
      passes: true,
      counts_into_average: true,
      exam_session_number: 1,
      date_modified: todayIso,
      author_name: 'dr Marek Zieliński',
      author_id: 'staff-3',
      class_type: 'Ćwiczenia',
    },
  ];

  const courses: UsosCourseEdition[] = [
    {
      course_id: 'INF-IOA-501',
      course_name: {
        pl: 'Inżynieria Oprogramowania i Architektura',
        en: 'Software Engineering & Architecture',
      },
      term_id: '2026/27-Z',
      ects: 6,
      coordinator: 'dr hab. Piotr Nowak, prof. UKEN',
      coordinator_id: 'staff-1',
      faculty: 'Instytut Nauk Technicznych',
      passing_status: 'passed',
      final_grade: '5',
      syllabus_description:
        'Projektowanie skalowalnych systemów rozproszonych, wzorce architektoniczne, testy automatyczne i CI/CD.',
      assessment_criteria: 'Projekt zespołowy (60%) + egzamin pisemny (40%).',
      literature: ['Clean Architecture — R. C. Martin', 'Designing Data-Intensive Applications — M. Kleppmann'],
      groups: [
        {
          group_number: 1,
          class_type_id: 'W',
          class_type_name: 'Wykład',
          lecturer: 'dr hab. Piotr Nowak, prof. UKEN',
          lecturer_id: 'staff-1',
          room: '204N',
          schedule_summary: '09:45–11:15',
          participants_count: 68,
        },
      ],
    },
    {
      course_id: 'INF-ASD-502',
      course_name: {
        pl: 'Algorytmy i Struktury Danych',
        en: 'Algorithms & Data Structures',
      },
      term_id: '2026/27-Z',
      ects: 5,
      coordinator: 'dr inż. Anna Wiśniewska',
      coordinator_id: 'staff-2',
      faculty: 'Instytut Nauk Technicznych',
      passing_status: 'passed',
      final_grade: '5',
      syllabus_description:
        'Analiza złożoności obliczeniowej, drzewa zrównoważone, algorytmy grafowe i programowanie dynamiczne.',
      assessment_criteria: 'Zadania laboratoryjne (50%) + kolokwium (50%).',
      literature: ['Introduction to Algorithms — Cormen et al.'],
      groups: [
        {
          group_number: 2,
          class_type_id: 'LAB',
          class_type_name: 'Laboratorium',
          lecturer: 'dr inż. Anna Wiśniewska',
          lecturer_id: 'staff-2',
          room: '312N',
          schedule_summary: '11:30–13:00',
          participants_count: 24,
        },
      ],
    },
    {
      course_id: 'INF-SBD-503',
      course_name: {
        pl: 'Systemy Baz Danych i SQL',
        en: 'Database Systems & SQL',
      },
      term_id: '2026/27-Z',
      ects: 5,
      coordinator: 'dr Marek Zieliński',
      coordinator_id: 'staff-3',
      faculty: 'Instytut Nauk Technicznych',
      passing_status: 'passed',
      final_grade: '4,5',
      syllabus_description:
        'Model relacyjny, indeksowanie B-Tree, transakcje ACID, optymalizacja zapytań PostgreSQL.',
      assessment_criteria: 'Projekt bazy danych (50%) + zaliczenie (50%).',
      literature: ['Database Internals — Alex Petrov'],
      groups: [
        {
          group_number: 1,
          class_type_id: 'CW',
          class_type_name: 'Ćwiczenia',
          lecturer: 'dr Marek Zieliński',
          lecturer_id: 'staff-3',
          room: '108A',
          schedule_summary: '14:00–15:30',
          participants_count: 28,
        },
      ],
    },
  ];

  const exams: UsosExamItem[] = [
    {
      id: 'ex-demo-1',
      course_id: 'INF-SEC-504',
      course_name: 'Bezpieczeństwo Aplikacji Mobilnych',
      type: 'Egzamin pisemny',
      term_number: 1,
      date: formatIsoDate(addDays(today, 9)),
      time: '10:00',
      room: 'Aula A1',
      building: 'Budynek Główny UKEN',
      examiner: 'dr hab. Piotr Nowak, prof. UKEN',
      is_registered: true,
      registration_deadline: formatIsoDate(addDays(today, 7)),
      seats_taken: 42,
      seats_limit: 80,
    },
  ];

  const payments: UsosPaymentItem[] = [
    {
      id: 'pay-demo-1',
      title: 'Opłata za usługi edukacyjne (Rata 1)',
      category: 'Opłata edukacyjna',
      amount: 1900,
      total_amount: 1900,
      saldo_amount: 0,
      currency: 'PLN',
      due_date: formatIsoDate(addDays(today, 14)),
      status: 'unpaid',
      account_iban: 'PL61 1090 1014 0000 0712 1981 2874',
    },
  ];

  const bankAccount: UsosBankAccount = {
    account_number: 'PL61 1090 1014 0000 0712 1981 2874',
    account_owner: 'Uniwersytet Komisji Edukacji Narodowej w Krakowie',
    name: 'Indywidualne konto rozliczeniowe studenta (Demo)',
    currency: 'PLN',
  };

  const studentCard: UsosStudentCard = {
    id: 'ELS-100240',
    barcode_number: '202410024099',
    expiration_date: '2027-03-31',
    date_of_issue: '2024-10-01',
    student_number: '100240',
    type: 'Elektroniczna Legitymacja Studencka (ELS)',
  };

  const surveys: UsosSurveyItem[] = [
    {
      id: 'srv-demo-1',
      course_name: 'Inżynieria Oprogramowania i Architektura',
      lecturer_name: 'dr hab. Piotr Nowak, prof. UKEN',
      class_type: 'Wykład',
      term_id: '2026/27-Z',
      deadline: formatIsoDate(addDays(today, 21)),
      filled_out: false,
    },
  ];

  const buildings: UsosBuilding[] = [
    {
      id: 'BLD-MAIN',
      code: 'BG',
      name: 'Budynek Główny UKEN',
      address: 'ul. Podchorążych 2, 30-084 Kraków',
      latitude: 50.0736,
      longitude: 19.9086,
      facilities: ['Wi-Fi Eduroam', 'Biblioteka', 'Winda', 'Bufet'],
      rooms_sample: ['Aula A1', '204N', '312N', '108A'],
    },
  ];

  return {
    user,
    timetable,
    upcomingTimetable: timetable,
    grades,
    courses,
    exams,
    payments,
    bankAccount,
    studentCard,
    surveys,
    staff,
    buildings,
    thesis: null,
  };
}
