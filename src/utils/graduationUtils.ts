// src/utils/graduationUtils.ts

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
  PREREQUISITE_RULES,
} from '../data/graduationRules';

const normalizeCourseName = (name: string): string => {
  const cleanName = name.replace(/\s+/g, '');
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
    totalRequired: 130,
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

  // 1. 전체 학점
  result.totalCredits = transcript.reduce((sum, item) => sum + item.credits, 0);

  // 2. 전공 필수
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

  // 3. 세부 전공
  const isAfter2024 = admissionYear >= 2024;
  const commonList = isAfter2024 ? COMMON_COURSES.from2024 : COMMON_COURSES.until2023;
  
  const myMajorTranscript = transcript.filter(
    (item) => item.department === '컴퓨터정보공학부' || !item.department
  );

  let myMajorCount = 0;
  let otherMajorCount = 0;
  let specificMajorCredits = 0;

  const myMajorList = SPECIFIC_MAJOR_COURSES[specificMajor];
  const otherMajorType = specificMajor === 'system' ? 'info' : 'system';
  const otherMajorList = SPECIFIC_MAJOR_COURSES[otherMajorType];

  myMajorTranscript.forEach((item) => {
    const normName = normalizeCourseName(item.courseName);
    
    const isCommon = commonList.includes(normName);
    const isMyMajor = myMajorList.includes(normName);
    const isOtherMajor = otherMajorList.includes(normName);

    if (isCommon || isMyMajor || isOtherMajor) {
      specificMajorCredits += item.credits;
      if (isMyMajor) myMajorCount++;
      if (isOtherMajor && !isCommon && !isMyMajor) otherMajorCount++;
    }
  });

  const messages: string[] = [];
  let isSpecificPassed = false;

  if (isAfter2024) {
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
    const cond1 = specificMajorCredits >= 30;
    const cond2 = myMajorCount >= 1;

    if (!cond1) messages.push(`총 학점이 ${30 - specificMajorCredits}점 부족합니다.`);
    if (!cond2) messages.push(`본인 세부전공 과목이 ${1 - myMajorCount}개 부족합니다.`);

    if (cond1 && cond2) {
      isSpecificPassed = true;
      messages.push('세부전공 요건을 충족했습니다.');
    }
  }

  // ★ [수정] 필수 선수과목 체크 로직 ★
  PREREQUISITE_RULES.forEach((rule) => {
    // 후수 과목은 이수했는데(taken), 필수 선수 과목은 이수하지 않은 경우(!taken)
    if (takenCourseNames.has(rule.course) && !takenCourseNames.has(rule.required)) {
      messages.push(`⚠️ [필수 선수과목 미이수] ${rule.message}`);
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

  // 4. 교양 분석
  const generalTranscript = transcript.filter(
    (item) => 
      (item.category.startsWith('general') || !item.category.startsWith('major')) &&
      !item.isCyber
  );

  const currentGeneralCredits = generalTranscript.reduce((sum, item) => sum + item.credits, 0);
  
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

  // 5. 차트 데이터
  const majorReqRate = result.details.majorRequired.passed ? 100 : Math.round(((7 - missingMajorRequired.length) / 7) * 100);
  const specificRate = Math.min(Math.round((specificMajorCredits / 30) * 100), 100);
  const generalRate = Math.min(Math.round((currentGeneralCredits / requiredGeneralCredits) * 100), 100);
  const totalRate = Math.min(Math.round((result.totalCredits / 130) * 100), 100);

  result.categories = {
    labels: ['전공필수', '세부전공', '교양', '전체'],
    data: [majorReqRate, specificRate, generalRate, totalRate],
  };

  return result;
};