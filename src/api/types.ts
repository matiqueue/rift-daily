export interface LangDict {
  pl: string;
  en: string;
}

export interface UsosUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  email: string;
  sex?: 'M' | 'F';
  student_status: number;
  photo_url?: string;
  postal_addresses?: string[];
  library_card_id?: string;
  programmes: UsosStudentProgramme[];
  ects_collected: number;
  ects_Target: number;
  current_term_id: string;
}

export interface UsosStudentProgramme {
  id: string;
  programme_id: string;
  name: LangDict;
  faculty: LangDict;
  stage: string;
  status: 'ACTIVE' | 'GRADUATED' | 'SUSPENDED';
  admission_date: string;
  is_primary: boolean;
}

export interface UsosTimetableActivity {
  id: string;
  course_id: string;
  course_name: LangDict;
  class_type: LangDict;
  class_type_id: 'W' | 'CW' | 'LAB' | 'PROJ' | 'SEM' | 'LEK';
  group_number: number;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  day_of_week: number; // 1 = Mon ... 7 = Sun
  date: string; // YYYY-MM-DD
  room_number: string;
  building_name: LangDict;
  building_id: string;
  lecturer_name: string;
  lecturer_id: string;
  lecturer_ids?: string[];
  lecturer_photo?: string;
  lecturer_email?: string;
  lecturer_room?: string;
  frequency: string;
  color: string;
}

export interface UsosGradeItem {
  id: string;
  course_id: string;
  course_name: LangDict;
  term_id: string;
  ects: number;
  value_symbol: string; // "5", "4,5", "4", "3,5", "3", "2", "ZAL"
  value_numeric: number | null; // null for ZAL
  passes: boolean;
  counts_into_average?: boolean;
  exam_session_number: number; // 1 or 2
  date_modified: string;
  author_name: string;
  author_id?: string;
  author_photo?: string;
  comment?: string;
  class_type: string;
}

export interface UsosTestNode {
  id: string;
  name: LangDict;
  type: 'folder' | 'task' | 'grade';
  points_earned?: number;
  points_max?: number;
  grade_symbol?: string;
  weight?: string;
  date?: string;
  description?: string;
  stats_avg?: number;
  children?: UsosTestNode[];
}

export interface UsosCourseEdition {
  course_id: string;
  course_name: LangDict;
  term_id: string;
  ects: number;
  coordinator: string;
  coordinator_id?: string;
  coordinator_photo?: string;
  lecturers?: {
    id: string;
    name: string;
    titles: string;
    photo_url?: string;
  }[];
  faculty: string;
  passing_status: 'passed' | 'in_progress' | 'failed';
  final_grade?: string;
  syllabus_description: string;
  assessment_criteria: string;
  literature: string[];
  homepage_url?: string;
  profile_url?: string;
  groups: {
    group_number: number;
    class_type_id: 'W' | 'CW' | 'LAB' | 'PROJ' | 'SEM' | 'LEK';
    class_type_name: string;
    lecturer: string;
    lecturer_id?: string;
    lecturer_photo?: string;
    room: string;
    schedule_summary: string;
    participants_count: number;
  }[];
  test_tree?: UsosTestNode[];
}

export interface UsosExamItem {
  id: string;
  course_id: string;
  course_name: string;
  type: 'Egzamin pisemny' | 'Egzamin ustny' | 'Zaliczenie końcowe' | 'Kolokwium zaliczeniowe';
  term_number: 1 | 2;
  date: string;
  time: string;
  room: string;
  building: string;
  examiner: string;
  is_registered: boolean;
  registration_deadline: string;
  seats_taken: number;
  seats_limit: number;
  description?: string;
}

export interface UsosPaymentInstallment {
  number: number;
  amount: number;
  payment_date: string;
  description: string;
  status: 'paid' | 'unpaid';
}

export interface UsosPaymentItem {
  id: string;
  title: string;
  category: 'Opłata edukacyjna' | 'Dom studencki' | 'Legitymacja / Duplikat' | 'Stypendium';
  amount: number;
  total_amount?: number;
  saldo_amount?: number;
  currency: 'PLN' | string;
  due_date: string;
  status: 'unpaid' | 'paid' | 'incoming_scholarship';
  account_iban: string;
  paid_date?: string;
  installments?: UsosPaymentInstallment[];
}

export interface UsosBankAccount {
  account_number: string;
  account_owner: string;
  name: string;
  title_prefix?: string;
  currency: string;
}

export interface UsosStudentCard {
  id: string;
  barcode_number?: string;
  expiration_date?: string;
  date_of_issue?: string;
  student_number?: string;
  type?: string;
}

export interface UsosRegistrationRound {
  id: string;
  name: string;
  term_id: string;
  mode: 'Bezpośrednia do grup' | 'Żetonowa (UL)' | 'Giełda grup';
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
  start_date: string;
  end_date: string;
  tokens_left?: number;
  courses: {
    course_id: string;
    course_name: string;
    ects: number;
    group_options: string[];
    selected_group?: string;
    is_registered: boolean;
    seats_free: number;
    seats_total: number;
  }[];
}

export interface UsosSurveyItem {
  id: string;
  course_name: string;
  lecturer_name: string;
  lecturer_photo?: string;
  class_type: string;
  term_id: string;
  deadline: string;
  filled_out: boolean;
  rating?: number;
  comment?: string;
}

export interface UsosStaffMember {
  id: string;
  name: string;
  titles: string;
  faculty: string;
  email: string;
  room: string;
  building: string;
  office_hours: string;
  photo_url?: string;
  phone?: string;
  interests?: string;
  courses_taught?: string[];
  is_my_lecturer?: boolean;
}

export interface UsosBuilding {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  facilities: string[];
  rooms_sample: string[];
}

export interface UsosThesisInfo {
  id: string;
  type: 'Inżynierska' | 'Licencjacka' | 'Magisterska';
  title_pl: string;
  title_en: string;
  supervisor: string;
  supervisor_photo?: string;
  reviewer: string;
  faculty: string;
  status: 'W przygotowaniu' | 'Złożona w APD' | 'Obroniona';
  progress_percent: number;
  defense_date?: string;
  milestones: { label: string; done: boolean }[];
}

export interface UsosDormInfo {
  dorm_name: string;
  address: string;
  room_number: string;
  room_type: string;
  allocation_period: string;
  check_in_status: 'Zakwaterowany' | 'Przyznane miejsce' | 'Brak wniosku';
  monthly_rate: number;
  deposit_paid: boolean;
  roommates: string[];
}

export interface UsosClearanceSlip {
  id: string;
  title: string;
  issue_date: string;
  status: 'W toku' | 'Rozliczona';
  items: {
    department: string;
    status: 'OK' | 'Wymaga podpisu';
    updated_at: string;
  }[];
}
