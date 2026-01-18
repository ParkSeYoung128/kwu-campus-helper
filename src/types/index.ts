// 앱 전체 타입 정의

export type DDayType = 'exam' | 'assignment';

export type Priority = 'high' | 'medium' | 'low';

// --- 졸업 로드맵 관련 타입 추가 ---

// 세부 전공 타입 (지능컴퓨팅시스템 / 지능정보공학)
export type SpecificMajorType = 'system' | 'info';

// 과목 이수 구분 (전필, 전선, 교필, 교선 등)
export type CourseCategory =
  | 'major_required' // 전공필수
  | 'major_elective' // 전공선택
  | 'general_required' // 교양필수 (광운인되기 등)
  | 'general_elective' // 교양선택 (균형교양 등)
  | 'general_free'; // 일반선택/기타

// 사용자가 입력한 수강 과목 데이터
export interface TranscriptItem {
  id: string;
  courseName: string; // 교과목명
  credits: number; // 학점
  grade?: string; // 성적 (옵션)
  category: CourseCategory; // 이수구분
  department?: string; // 개설학과 (타과 전공 인정 불가 체크용)
  isCyber?: boolean; // 인강 여부 (균형교양 제외용)
}

// 졸업 요건 분석 결과 (UI에 보여줄 데이터)
export interface GraduationResult {
  // 1. 전체 이수율
  totalCredits: number;
  totalRequired: number;

  // 2. 영역별 달성도 (막대 그래프용)
  categories: {
    labels: string[];
    data: number[]; // 0 ~ 100
  };

  // 3. 상세 분석 결과
  details: {
    majorRequired: {
      passed: boolean;
      missing: string[]; // 미이수 과목명
    };
    specificMajor: {
      passed: boolean;
      currentCredits: number;
      requiredCredits: number;
      myMajorCount: number; // 본인 세부전공 과목 수
      otherMajorCount: number; // 타 세부전공 과목 수
      messages: string[]; // "본인 전공 과목이 1개 부족합니다" 등
    };
    general: {
      passed: boolean;
      currentCredits: number;
      requiredCredits: number;
      messages: string[];
    };
  };
}

export interface CafeteriaMenu {
  date: string; // YYYY-MM-DD
  meals: {
    breakfast?: string[];
    lunch?: string[];
    dinner?: string[];
  };
}

export interface DDayItem {
  id: string;
  courseName: string;
  type: DDayType;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
}

export interface TeamMember {
  id: string;
  name: string;
  availability: string; // 간단한 문자열 형태 (예: "월 10:00-12:00, 수 14:00-16:00")
}

export interface MeetingTime {
  startTime: string;
  endTime: string;
  day: string;
}

// 앱 상태 타입
export interface AppState {
  cafeteriaMenus: CafeteriaMenu[];
  dDayItems: DDayItem[];
  teamMembers: TeamMember[];
  notifications: {
    cafeteriaEnabled: boolean;
    cafeteriaTime: string; // HH:MM
    dDayEnabled: boolean;
  };
}

// 액션 타입
export type AppAction =
  | { type: 'ADD_DDAY_ITEM'; payload: DDayItem }
  | { type: 'UPDATE_DDAY_ITEM'; payload: DDayItem }
  | { type: 'DELETE_DDAY_ITEM'; payload: string }
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'DELETE_TEAM_MEMBER'; payload: string }
  | { type: 'UPDATE_CAFETERIA_MENU'; payload: CafeteriaMenu[] }
  | { type: 'UPDATE_NOTIFICATIONS'; payload: Partial<AppState['notifications']> };

// 네비게이션 타입
export type RootTabParamList = {
  Home: undefined;
  Cafeteria: undefined;
  DDay: undefined;
  Meeting: undefined;
  Roadmap: undefined;
  Settings: undefined;
};
