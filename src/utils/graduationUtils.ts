// src/utils/graduationUtils.ts
import {
  GraduationResult,
  TranscriptItem,
  SpecificMajorType,
} from '../types';
import {
  MAJOR_REQUIRED_COURSES,
  SPECIFIC_MAJOR_COURSES,
  GENERAL_CREDIT_REQUIREMENTS,
  COURSE_NAME_ALIASES,
} from '../data/graduationRules';

// 과목명 정규화 (별칭 처리)
const normalizeCourseName = (name: string): string => {
  // 공백 제거 후 비교
  const cleanName = name.replace(/\s+/g, '');
  // 별칭 테이블 확인
  for (const [oldName, newName] of Object.entries(COURSE_NAME_ALIASES)) {
    if (cleanName === oldName.replace(/\s+/g, '')) {
      return newName;
    }
  }
  return name.trim(); // 없으면 원래 이름 (공백만 제거)
};

export const analyzeGraduationRequirement = (
  transcript: TranscriptItem[],
  admissionYear: number,
  specificMajor: SpecificMajorType
): GraduationResult => {
  const result: GraduationResult = {
    totalCredits: 0,
    totalRequired: 130, // 졸업 기준 (일단 130으로 고정, 필요시 학번별 분기)
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

  // --- 3. 세부 전공 분석 ---
  // 필터링: 컴퓨터정보공학부 개설 과목만 인정 (타과 불인정)
  const myMajorTranscript = transcript.filter(
    (item) => item.department === '컴퓨터정보공학부' || !item.department // department 정보 없으면 일단 인정(더미데이터 호환)
  );

  let myMajorCount = 0;
  let otherMajorCount = 0;
  let specificMajorCredits = 0;

  // 본인 전공, 타 전공 구분
  const myMajorList = SPECIFIC_MAJOR_COURSES[specificMajor];
  const otherMajorType = specificMajor === 'system' ? 'info' : 'system';
  const otherMajorList = SPECIFIC_MAJOR_COURSES[otherMajorType];
  const commonList = SPECIFIC_MAJOR_COURSES.common;

  myMajorTranscript.forEach((item) => {
    const normName = normalizeCourseName(item.courseName);
    
    // 세부전공 관련 과목인지 확인 (공통 or 본인 or 타전공 리스트에 있어야 함)
    const isCommon = commonList.includes(normName);
    const isMyMajor = myMajorList.includes(normName);
    const isOtherMajor = otherMajorList.includes(normName);

    if (isCommon || isMyMajor || isOtherMajor) {
      specificMajorCredits += item.credits;
      
      if (isMyMajor) myMajorCount++;
      // 공통과목은 타전공 카운트에 포함하지 않음 (순수 타전공 과목만 체크)
      if (isOtherMajor && !isCommon && !isMyMajor) otherMajorCount++;
    }
  });

  // 학번별 세부전공 룰 적용
  const isAfter2024 = admissionYear >= 2024;
  const messages: string[] = [];
  let isSpecificPassed = false;

  if (isAfter2024) {
    // 24학번 이후: 총 30학점 + 본인전공 최소 1개(권장)
    if (specificMajorCredits >= 30) {
      isSpecificPassed = true;
      messages.push('세부전공 이수 학점을 충족했습니다.');
    } else {
      messages.push(`세부전공 학점이 ${30 - specificMajorCredits}학점 부족합니다.`);
    }
  } else {
    // ~23학번: 총 30학점 + 본인 2개 + 타전공 1개
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
  }

  result.details.specificMajor = {
    passed: isSpecificPassed,
    currentCredits: specificMajorCredits,
    requiredCredits: 30,
    myMajorCount,
    otherMajorCount,
    messages,
  };

  // --- 4. 교양 분석 ---
  // e러닝 등은 균형교양/교필 학점에서 제외 (isCyber Check)
  // 전공(major)이 아닌 과목들을 교양으로 간주
  const generalTranscript = transcript.filter(
    (item) => 
      (item.category.startsWith('general') || !item.category.startsWith('major')) &&
      !item.isCyber
  );

  const currentGeneralCredits = generalTranscript.reduce((sum, item) => sum + item.credits, 0);
  const requiredGeneralCredits = isAfter2024
    ? GENERAL_CREDIT_REQUIREMENTS.from2024
    : GENERAL_CREDIT_REQUIREMENTS.until2023;

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
  // 비율 계산 (0 ~ 100)
  const majorReqRate = result.details.majorRequired.passed ? 100 : Math.round(((7 - missingMajorRequired.length) / 7) * 100);
  const specificRate = Math.min(Math.round((specificMajorCredits / 30) * 100), 100);
  const generalRate = Math.min(Math.round((currentGeneralCredits / requiredGeneralCredits) * 100), 100);
  
  // 전체 학점 달성률 (130학점 기준)
  const totalRate = Math.min(Math.round((result.totalCredits / 130) * 100), 100);

  result.categories = {
    labels: ['전공필수', '세부전공', '교양', '전체'],
    data: [majorReqRate, specificRate, generalRate, totalRate],
  };

  return result;
};