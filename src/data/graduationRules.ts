// src/data/graduationRules.ts

// 1. 전공 필수 과목 (7과목)
export const MAJOR_REQUIRED_COURSES = [
  '디지털논리회로1', '객체지향프로그래밍설계', '디지털논리회로2',
  '데이터구조설계', '컴퓨터구조', '시스템프로그래밍', '운영체제',
];

// 2. 공통 교과목 리스트
export const COMMON_COURSES = {
  until2023: [
    '디지털논리회로1', '디지털논리회로2', '객체지향프로그래밍설계', '데이터구조설계',
    '컴퓨터구조', '시스템프로그래밍', '운영체제', '신호및시스템', '디지털신호처리',
    '알고리즘', '임베디드시스템S/W설계', '머신러닝', '산학협력캡스톤설계', 
    '산학협력캡스톤설계1', '지능IT특론', '지능IoT특론'
  ],
  from2024: [
    '신호및시스템', '디지털신호처리', '알고리즘', '인공지능', '머신러닝',
    '컴퓨터비전', '산학협력캡스톤설계', '지능IT특론'
  ]
};

// 3. 세부전공별 인정 과목
export const SPECIFIC_MAJOR_COURSES = {
  system: [
    '마이크로프로세서', 'GPU컴퓨팅', '임베디드시스템S/W설계', '컴퓨터비전',
    '인공지능프로그래밍', 'SW/HW통합설계', 'AI시스템온칩설계및응용',
    '회로이론', '전자회로', '어셈블리프로그램설계및실습'
  ],
  info: [
    '소프트웨어프로젝트', '소프트웨어프로젝트1', '데이터통신', 
    '무선모바일네트워크', '무선이동네트워크및5G', '소프트웨어공학',
    '데이터베이스및데이터시각화', '오픈소스소프트웨어설계및실습'
  ]
};

// 4. 교양 기준 학점
export const GENERAL_CREDIT_REQUIREMENTS = {
  y2016: 17,
  y2017_2018: 20,
  y2019_2023: 22,
  from2024: 31,
};

// 5. 대체 과목 매핑
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

// 7. 필수 선후수 관계 규칙 (Strict Prerequisites)
export const PREREQUISITE_RULES = [
  // [프로그래밍 기초 트랙]
  { 
    course: '고급C프로그래밍', 
    required: 'C프로그래밍', 
    message: "'고급C프로그래밍' 수강을 위해 'C프로그래밍'을 이수해야 합니다." 
  },
  { 
    course: '객체지향프로그래밍설계', 
    required: '고급C프로그래밍', 
    message: "'객체지향프로그래밍설계' 수강을 위해 '고급C프로그래밍'을 이수해야 합니다." 
  },
  { 
    course: '데이터구조설계', 
    required: '객체지향프로그래밍설계', 
    message: "'데이터구조설계' 수강을 위해 '객체지향프로그래밍설계'를 먼저 이수해야 합니다." 
  },
  { 
    course: '시스템프로그래밍', 
    required: '데이터구조설계', 
    message: "'시스템프로그래밍' 수강을 위해 '데이터구조설계'를 이수해야 합니다." 
  },
  { 
    course: '운영체제', 
    required: '데이터구조설계', 
    message: "'운영체제' 수강을 위해 '데이터구조설계'를 이수해야 합니다." 
  },

  // [하드웨어 트랙]
  { 
    course: '디지털논리회로2', 
    required: '디지털논리회로1', 
    message: "'디지털논리회로2' 수강을 위해 '디지털논리회로1'을 이수해야 합니다." 
  },

  // [캡스톤]
  { 
    course: '산학협력캡스톤설계2', 
    required: '산학협력캡스톤설계',
    message: "'캡스톤설계2' 수강을 위해 '캡스톤설계1'을 이수해야 합니다." 
  },

  // [수학/기초교양]
  { 
    course: '공학수학1', 
    required: '대학수학및연습1', 
    message: "'공학수학1' 수강을 위해 '대학수학및연습1'을 이수해야 합니다." 
  },
  { 
    course: '공학수학2', 
    required: '대학수학및연습2', 
    message: "'공학수학2' 수강을 위해 '대학수학및연습2'를 이수해야 합니다." 
  },
];

// 8. UI 추천용 과목 데이터 (수학 과목 추가)
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
    { name: 'C프로그래밍', credit: 3 }, // 선수과목 테스트용
    { name: '고급C프로그래밍', credit: 3 }, // 선수과목 테스트용
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
    { name: '산학협력캡스톤설계2', credit: 3 },
    { name: 'SW/HW통합설계', credit: 3 },
    { name: 'AI시스템온칩설계및응용', credit: 3 },
  ],
  general_required: [
    { name: '광운인되기', credit: 1 },
    { name: '대학영어', credit: 2 },
    // 수학 과목 추가
    { name: '대학수학및연습1', credit: 3 },
    { name: '대학수학및연습2', credit: 3 },
    { name: '공학수학1', credit: 3 },
    { name: '공학수학2', credit: 3 },
  ],
};