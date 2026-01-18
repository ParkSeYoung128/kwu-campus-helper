import {
  GraduationResult,
  TranscriptItem,
  SpecificMajorType,
} from '../types';
import {
  MAJOR_REQUIRED_COURSES,
  SPECIFIC_MAJOR_COURSES,
  COMMON_COURSES,
  GENERAL_CREDIT_REQUIREMENTS,
  COURSE_NAME_ALIASES,
  PREREQUISITE_RULES, // 선수과목 규칙 추가됨
} from '../data/graduationRules';

// 과목명 정규화 (공백 제거 및 별칭 처리)
const normalizeCourseName = (name: string): string => {
  const cleanName = name.replace(/\s+/g, '');
  // 별칭 테이블 확인
  for (const [oldName, newName] of Object.entries(COURSE_NAME_ALIASES)) {
    if (cleanName === oldName.replace(/\s+/g, '')) {
      return newName;
    }
  }
  return name.trim();
};

export const analyzeGraduationRequirement = (
  transcript: TranscriptItem[],
  admissionYear: number,
  specificMajor: SpecificMajorType
): GraduationResult => {
  const result: GraduationResult = {
    totalCredits: 0,
    totalRequired: 130, // 졸업 기준 학점
    categories: { labels: [], data: [] },
    details: {
      majorRequired: { passed: false, missing: [] },
      specificMajor: {
        passed: false,
        currentCredits: 0,
        requiredCredits: 30,
        myMajorCount: 0,
        otherMajorCount: 0,
        messages: [],
      },
      general: {
        passed: false,
        currentCredits: 0,
        requiredCredits: 0,
        messages: [],
      },
    },
  };

  // --- 1. 전체 학점 계산 ---
  result.totalCredits = transcript.reduce((sum, item) => sum + item.credits, 0);

  // --- 2. 전공 필수 분석 (7과목) ---
  // 사용자가 수강한 과목명 집합 (정규화됨)
  const takenCourseNames = new Set(
    transcript.map((item) => normalizeCourseName(item.courseName))
  );

  const missingMajorRequired = MAJOR_REQUIRED_COURSES.filter(
    (required) => !takenCourseNames.has(required)
  );

  result.details.majorRequired = {
    passed: missingMajorRequired.length === 0,
    missing: missingMajorRequired,
  };

  // --- 3. 세부 전공 분석 (학번별 로직 분기) ---
  const isAfter2024 = admissionYear >= 2024;

  // 3-1. 공통 과목 리스트 선택 (24학번부터 공통과목 축소 반영)
  const commonList = isAfter2024 ? COMMON_COURSES.from2024 : COMMON_COURSES.until2023;

  // 3-2. 컴퓨터정보공학부 개설 과목만 필터링 (타과 불인정)
  const myMajorTranscript = transcript.filter(
    (item) => item.department === '컴퓨터정보공학부' || !item.department
  );

  let myMajorCount = 0;
  let otherMajorCount = 0;
  let specificMajorCredits = 0;

  // 본인 전공, 타 전공 구분
  const myMajorList = SPECIFIC_MAJOR_COURSES[specificMajor];
  const otherMajorType = specificMajor === 'system' ? 'info' : 'system';
  const otherMajorList = SPECIFIC_MAJOR_COURSES[otherMajorType];

  myMajorTranscript.forEach((item) => {
    const normName = normalizeCourseName(item.courseName);
    
    // 세부전공 관련 과목인지 확인
    const isCommon = commonList.includes(normName);
    const isMyMajor = myMajorList.includes(normName);
    const isOtherMajor = otherMajorList.includes(normName);

    // 공통, 본인, 타전공 모두 학점 인정
    if (isCommon || isMyMajor || isOtherMajor) {
      specificMajorCredits += item.credits;
      
      if (isMyMajor) myMajorCount++;
      // 공통과목은 타전공 카운트에서 제외 (순수 타전공만 카운트)
      if (isOtherMajor && !isCommon && !isMyMajor) otherMajorCount++;
    }
  });

  // 3-3. 학번별 통과 조건 검사
  const messages: string[] = [];
  let isSpecificPassed = false;

  if (isAfter2024) {
    // [2024학번 이후] 본인2 + 타전공1 + 총 30학점 (엄격해짐)
    const cond1 = specificMajorCredits >= 30;
    const cond2 = myMajorCount >= 2;
    const cond3 = otherMajorCount >= 1;

    if (!cond1) messages.push(`총 학점이 ${30 - specificMajorCredits}점 부족합니다.`);
    if (!cond2) messages.push(`본인 세부전공 과목이 ${2 - myMajorCount}개 부족합니다.`);
    if (!cond3) messages.push(`타 세부전공 과목이 ${1 - otherMajorCount}개 부족합니다.`);

    if (cond1 && cond2 && cond3) {
      isSpecificPassed = true;
      messages.push('세부전공 요건을 모두 충족했습니다.');
    }
  } else {
    // [2023학번 이전] 본인1 + 총 30학점 (비교적 완화)
    const cond1 = specificMajorCredits >= 30;
    const cond2 = myMajorCount >= 1;

    if (!cond1) messages.push(`총 학점이 ${30 - specificMajorCredits}점 부족합니다.`);
    if (!cond2) messages.push(`본인 세부전공 과목이 ${1 - myMajorCount}개 부족합니다.`);

    if (cond1 && cond2) {
      isSpecificPassed = true;
      messages.push('세부전공 요건을 충족했습니다.');
    }
  }

  // ★ [통합] 선수과목(권장) 체크 로직 추가 ★
  // (팀원 코드의 장점을 흡수하여 경고 메시지에 추가)
  PREREQUISITE_RULES.forEach((rule) => {
    // 이미 normalize된 takenCourseNames를 사용해 검사
    // 주의: rule.course와 rule.required도 데이터 파일에 정확한 명칭으로 있어야 함
    if (takenCourseNames.has(rule.course) && !takenCourseNames.has(rule.required)) {
      messages.push(`⚠️ [권장] ${rule.message}`);
    }
  });

  result.details.specificMajor = {
    passed: isSpecificPassed,
    currentCredits: specificMajorCredits,
    requiredCredits: 30,
    myMajorCount,
    otherMajorCount,
    messages,
  };

  // --- 4. 교양 분석 ---
  // e러닝 등은 제외 (isCyber Check)
  const generalTranscript = transcript.filter(
    (item) => 
      (item.category.startsWith('general') || !item.category.startsWith('major')) &&
      !item.isCyber
  );

  const currentGeneralCredits = generalTranscript.reduce((sum, item) => sum + item.credits, 0);
  
  // 학번별 교양 기준 학점 가져오기
  let requiredGeneralCredits = GENERAL_CREDIT_REQUIREMENTS.y2019_2023;
  if (admissionYear <= 2016) requiredGeneralCredits = GENERAL_CREDIT_REQUIREMENTS.y2016;
  else if (admissionYear <= 2018) requiredGeneralCredits = GENERAL_CREDIT_REQUIREMENTS.y2017_2018;
  else if (admissionYear >= 2024) requiredGeneralCredits = GENERAL_CREDIT_REQUIREMENTS.from2024;

  result.details.general = {
    passed: currentGeneralCredits >= requiredGeneralCredits,
    currentCredits: currentGeneralCredits,
    requiredCredits: requiredGeneralCredits,
    messages: [
      currentGeneralCredits >= requiredGeneralCredits
        ? '교양 이수 학점을 충족했습니다.'
        : `교양 학점이 ${requiredGeneralCredits - currentGeneralCredits}학점 부족합니다.`,
    ],
  };

  // --- 5. 차트 데이터 생성 ---
  const majorReqRate = result.details.majorRequired.passed ? 100 : Math.round(((7 - missingMajorRequired.length) / 7) * 100);
  const specificRate = Math.min(Math.round((specificMajorCredits / 30) * 100), 100);
  const generalRate = Math.min(Math.round((currentGeneralCredits / requiredGeneralCredits) * 100), 100);
  
  // 전체 학점 달성률
  const totalRate = Math.min(Math.round((result.totalCredits / 130) * 100), 100);

  result.categories = {
    labels: ['전공필수', '세부전공', '교양', '전체'],
    data: [majorReqRate, specificRate, generalRate, totalRate],
  };

  return result;
};