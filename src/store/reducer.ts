import { AppState, AppAction } from '../types';

// 초기 더미 데이터
const initialCafeteriaMenus = [
  {
    date: '2024-03-18',
    meals: {
      breakfast: ['밥', '된장찌개', '김치'],
      lunch: ['밥', '불고기', '나물', '국'],
      dinner: ['밥', '제육볶음', '된장찌개'],
    },
  },
  {
    date: '2024-03-19',
    meals: {
      breakfast: ['밥', '계란찜', '시금치나물'],
      lunch: ['밥', '돈까스', '콜라'],
      dinner: ['밥', '삼겹살', '쌈', '무쌈'],
    },
  },
  {
    date: '2024-03-20',
    meals: {
      breakfast: ['밥', '미역국', '김'],
      lunch: ['밥', '치킨', '콜라'],
      dinner: ['밥', '비빔밥', '국'],
    },
  },
];

const initialDDayItems = [
  {
    id: '1',
    courseName: '자료구조',
    type: 'exam' as const,
    dueDate: '2024-03-25',
    priority: 'high' as const,
  },
  {
    id: '2',
    courseName: '웹프로그래밍',
    type: 'assignment' as const,
    dueDate: '2024-03-22',
    priority: 'medium' as const,
  },
  {
    id: '3',
    courseName: '데이터베이스',
    type: 'exam' as const,
    dueDate: '2024-04-01',
    priority: 'low' as const,
  },
];

const initialTeamMembers = [
  {
    id: '1',
    name: '홍길동',
    availability: '월 10:00-12:00, 수 14:00-16:00',
  },
  {
    id: '2',
    name: '김철수',
    availability: '월 09:00-11:00, 화 13:00-15:00',
  },
];

export const initialState: AppState = {
  cafeteriaMenus: initialCafeteriaMenus,
  dDayItems: initialDDayItems,
  teamMembers: initialTeamMembers,
  notifications: {
    cafeteriaEnabled: false,
    cafeteriaTime: '12:00',
    dDayEnabled: true,
  },
};

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_DDAY_ITEM':
      return {
        ...state,
        dDayItems: [...state.dDayItems, action.payload],
      };

    case 'UPDATE_DDAY_ITEM':
      return {
        ...state,
        dDayItems: state.dDayItems.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };

    case 'DELETE_DDAY_ITEM':
      return {
        ...state,
        dDayItems: state.dDayItems.filter((item) => item.id !== action.payload),
      };

    case 'ADD_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: [...state.teamMembers, action.payload],
      };

    case 'UPDATE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.map((member) =>
          member.id === action.payload.id ? action.payload : member
        ),
      };

    case 'DELETE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.filter(
          (member) => member.id !== action.payload
        ),
      };

    case 'UPDATE_CAFETERIA_MENU':
      return {
        ...state,
        cafeteriaMenus: action.payload,
      };

    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          ...action.payload,
        },
      };

    default:
      return state;
  }
};
