// src/data/graduationRules.ts

// 1. 전공 필수 과목 (7과목)
// 2학년: 디논1, 객체지향, 디논2, 데구설 / 3학년: 컴구, 시프, 운영체제
export const MAJOR_REQUIRED_COURSES = [
  '디지털논리회로1',
  '객체지향프로그래밍설계', // 전필로 변경됨
  '디지털논리회로2',
  '데이터구조설계',
  '컴퓨터구조',
  '시스템프로그래밍',
  '운영체제',
];

// 2. 세부전공 인정 과목 리스트 (로직용)
export const SPECIFIC_MAJOR_COURSES = {
  common: [
    '디지털논리회로1', '디지털논리회로2', '객체지향프로그래밍설계', '데이터구조설계',
    '컴퓨터구조', '시스템프로그래밍', '운영체제', '신호및시스템', '디지털신호처리',
    '알고리즘', '임베디드시스템S/W설계', '머신러닝', '산학협력캡스톤설계1',
    '지능IT특론', '인공지능', '컴퓨터비전', '운영체제실습', 
  ],
  system: [
    '마이크로프로세서', 'GPU컴퓨팅', 'SW/HW통합설계', 'AI시스템온칩설계및응용',
    '인공지능프로그래밍', '컴퓨터구조실험', '시스템프로그래밍실습',
    '회로이론', '전자회로', '어셈블리프로그램설계및실습', // 시스템 하드웨어 관련
  ],
  info: [
    '소프트웨어프로젝트1', '소프트웨어프로젝트2', '데이터통신', '무선이동네트워크및5G',
    '소프트웨어공학', '데이터베이스및데이터시각화', '컴퓨터네트워크',
    '객체지향프로그래밍실습', '오픈소스소프트웨어설계및실습', // 소프트웨어 관련
  ],
};

// 3. 교양 기준 학점
export const GENERAL_CREDIT_REQUIREMENTS = {
  until2023: 22,
  from2024: 31,
};

// 4. 대체 과목 매핑 (구 과목명 -> 현 과목명)
export const COURSE_NAME_ALIASES: Record<string, string> = {
  '고급프로그래밍설계': '객체지향프로그래밍설계',
  '고급프로그래밍실습': '객체지향프로그래밍실습',
  '하드웨어소프트웨어통합설계': 'SW/HW통합설계',
  '임베디드시스템H/W설계및실험': 'SW/HW통합설계',
  '데이터통신설계': '데이터통신',
  '무선이동네트워크': '무선이동네트워크및5G',
  '시스템반도체설계및응용': 'AI시스템온칩설계및응용',
  '데이터베이스및응용': '데이터베이스및데이터시각화',
  'IoT특론': '지능IoT특론',
  '차세대IT특론': '지능IoT특론',
  '캡스톤설계': '산학협력캡스톤설계2',
};

// 5. 학번별 전공 명칭 반환
export const getSpecificMajorName = (year: number, type: 'system' | 'info'): string => {
  if (year >= 2024) {
    return type === 'system' ? '지능컴퓨팅시스템' : '지능정보공학';
  } else {
    return type === 'system' ? '컴퓨터공학' : '정보공학';
  }
};

// 6. UI 추천용 과목 데이터 (학년/학기별 교과과정 반영)
export const RECOMMENDED_COURSES = {
  // 전공 필수 (7과목)
  major_required: [
    { name: '디지털논리회로1', credit: 3 },
    { name: '객체지향프로그래밍설계', credit: 3 },
    { name: '디지털논리회로2', credit: 3 },
    { name: '데이터구조설계', credit: 3 },
    { name: '컴퓨터구조', credit: 3 },
    { name: '시스템프로그래밍', credit: 3 },
    { name: '운영체제', credit: 3 },
  ],
  // 전공 선택 
  major_elective: [
    // 1학년
    { name: '컴퓨터공학입문세미나', credit: 2 },
    { name: '고급C프로그래밍', credit: 3 },
    // 2학년
    { name: '회로이론', credit: 3 },
    { name: '컴퓨터공학기초실험1', credit: 3 },
    { name: '객체지향프로그래밍실습', credit: 3 },
    { name: '컴퓨터공학기초실험2', credit: 3 },
    { name: '어셈블리프로그램설계및실습', credit: 3 },
    { name: '전자회로', credit: 3 },
    { name: '오픈소스소프트웨어설계및실습', credit: 3 },
    { name: '데이터구조실습', credit: 3 },
    // 3학년
    { name: '컴퓨터구조실험', credit: 3 },
    { name: '시스템프로그래밍실습', credit: 3 },
    { name: '신호및시스템', credit: 3 },
    { name: '컴퓨터네트워크', credit: 3 },
    { name: '소프트웨어프로젝트1', credit: 3 },
    { name: '운영체제실습', credit: 3 }, // 전선으로 이동
    { name: 'SW/HW통합설계', credit: 3 },
    { name: '마이크로프로세서', credit: 3 },
    { name: '디지털신호처리', credit: 3 },
    { name: '데이터통신', credit: 3 },
    { name: '알고리즘', credit: 3 },
    { name: '인공지능', credit: 3 },
    { name: '소프트웨어프로젝트2', credit: 3 },
    { name: 'GPU컴퓨팅', credit: 3 },
    // 4학년
    { name: '소프트웨어공학', credit: 3 },
    { name: '무선이동네트워크및5G', credit: 3 },
    { name: '컴퓨터비전', credit: 3 },
    { name: '임베디드시스템S/W설계', credit: 3 },
    { name: '머신러닝', credit: 3 },
    { name: '산학협력캡스톤설계1', credit: 3 },
    { name: 'AI시스템온칩설계및응용', credit: 3 },
    { name: '인공지능프로그래밍', credit: 3 },
    { name: '데이터베이스및데이터시각화', credit: 3 },
    { name: '지능IoT특론', credit: 3 },
    { name: '산학협력캡스톤설계2', credit: 3 },
  ],
  // 교양 (예시)
  general_required: [
    { name: '광운인되기', credit: 1 },
    { name: '영어회화', credit: 2 },
    { name: 'C프로그래밍', credit: 3 },
  ],
};