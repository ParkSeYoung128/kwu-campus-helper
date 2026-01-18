// src/data/graduationRules.ts

// 1. 전공 필수 과목 (7과목) - 변동 없음
export const MAJOR_REQUIRED_COURSES = [
  '디지털논리회로1', '객체지향프로그래밍설계', '디지털논리회로2',
  '데이터구조설계', '컴퓨터구조', '시스템프로그래밍', '운영체제',
];

// 2. 공통 교과목 리스트 (학번별 분리)
export const COMMON_COURSES = {
  // 2017~2023학번용 (42학점 범위)
  until2023: [
    '디지털논리회로1', '디지털논리회로2', '객체지향프로그래밍설계', '데이터구조설계',
    '컴퓨터구조', '시스템프로그래밍', '운영체제', '신호및시스템', '디지털신호처리',
    '알고리즘', '임베디드시스템S/W설계', '머신러닝', '산학협력캡스톤설계', 
    '산학협력캡스톤설계1', '지능IT특론', '지능IoT특론'
  ],
  // 2024학번~용 (24학점 범위)
  from2024: [
    '신호및시스템', '디지털신호처리', '알고리즘', '인공지능', '머신러닝',
    '컴퓨터비전', '산학협력캡스톤설계', '지능IT특론'
  ]
};

// 3. 세부전공별 인정 과목 (시스템=컴퓨터공학, 정보=지능정보)
export const SPECIFIC_MAJOR_COURSES = {
  system: [ // 컴퓨터공학 / 지능컴퓨팅시스템
    '마이크로프로세서', 'GPU컴퓨팅', '임베디드시스템S/W설계', '컴퓨터비전',
    '인공지능프로그래밍', 'SW/HW통합설계', 'AI시스템온칩설계및응용'
  ],
  info: [ // 정보공학 / 지능정보공학
    '소프트웨어프로젝트', '소프트웨어프로젝트1', '데이터통신', 
    '무선모바일네트워크', '무선이동네트워크및5G', '소프트웨어공학',
    '데이터베이스및데이터시각화'
  ]
};

// 4. 교양 기준 학점 (광운인되기 1학점 포함된 총 학점 기준)
export const GENERAL_CREDIT_REQUIREMENTS = {
  y2016: 17,       // 16 + 1
  y2017_2018: 20,  // 19 + 1 (최소 기준)
  y2019_2023: 22,  // 21 + 1
  from2024: 31,    // 30 + 1
};

// 5. 대체 과목 매핑 (구 과목명 -> 현 과목명)
export const COURSE_NAME_ALIASES: Record<string, string> = {
  '고급프로그래밍설계': '객체지향프로그래밍설계',
  '소프트웨어프로젝트1': '소프트웨어프로젝트',
  '무선이동네트워크': '무선모바일네트워크',
  '무선이동네트워크및5G': '무선모바일네트워크',
  '지능IoT특론': '지능IT특론',
  '산학협력캡스톤설계1': '산학협력캡스톤설계',
  '시스템반도체설계및응용': 'AI시스템온칩설계및응용',
  '데이터베이스및응용': '데이터베이스및데이터시각화',
};

// 6. 학번별 전공 명칭
export const getSpecificMajorName = (year: number, type: 'system' | 'info'): string => {
  if (year >= 2024) {
    return type === 'system' ? '지능컴퓨팅시스템' : '지능정보공학';
  } else {
    return type === 'system' ? '컴퓨터공학' : '정보공학';
  }
};

// 7. UI 추천용 과목 데이터 (기존 유지 + 업데이트)
export const RECOMMENDED_COURSES = {
  major_required: [
    { name: '디지털논리회로1', credit: 3 },
    { name: '객체지향프로그래밍설계', credit: 3 },
    { name: '디지털논리회로2', credit: 3 },
    { name: '데이터구조설계', credit: 3 },
    { name: '컴퓨터구조', credit: 3 },
    { name: '시스템프로그래밍', credit: 3 },
    { name: '운영체제', credit: 3 },
  ],
  major_elective: [
    { name: '마이크로프로세서', credit: 3 },
    { name: 'GPU컴퓨팅', credit: 3 },
    { name: '임베디드시스템S/W설계', credit: 3 },
    { name: '컴퓨터비전', credit: 3 },
    { name: '인공지능프로그래밍', credit: 3 },
    { name: '소프트웨어프로젝트', credit: 3 },
    { name: '데이터통신', credit: 3 },
    { name: '무선모바일네트워크', credit: 3 },
    { name: '소프트웨어공학', credit: 3 },
    { name: '데이터베이스및데이터시각화', credit: 3 },
    { name: '신호및시스템', credit: 3 },
    { name: '알고리즘', credit: 3 },
    { name: '인공지능', credit: 3 },
    { name: '머신러닝', credit: 3 },
    { name: '지능IT특론', credit: 3 },
    { name: '산학협력캡스톤설계', credit: 3 },
    { name: 'SW/HW통합설계', credit: 3 },
    { name: 'AI시스템온칩설계및응용', credit: 3 },
  ],
  general_required: [
    { name: '광운인되기', credit: 1 },
    { name: '대학영어', credit: 2 },
    { name: 'C프로그래밍', credit: 3 },
  ],
};

// [추가] 선수과목 이수 규칙 (권장사항)
export const PREREQUISITE_RULES: { course: string; required: string; message: string }[] = [
  { 
    course: '데이터구조설계', 
    required: 'C프로그래밍', // 혹은 '고급C프로그래밍' 등 실제 커리큘럼에 맞게 조정
    message: "3학년 권장 '데이터구조설계' 수강을 위해 'C프로그래밍' 계열 과목 선이수가 권장됩니다." 
  },
  {
    course: '운영체제',
    required: '컴퓨터구조',
    message: "'운영체제' 이해를 위해 '컴퓨터구조' 선이수가 강력히 권장됩니다."
  },
  // 필요한 경우 추가 규칙 작성
];