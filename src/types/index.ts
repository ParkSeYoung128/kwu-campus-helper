// 앱 전체 타입 정의

export type DDayType = 'exam' | 'assignment';

export type Priority = 'high' | 'medium' | 'low';

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
  Settings: undefined;
};
