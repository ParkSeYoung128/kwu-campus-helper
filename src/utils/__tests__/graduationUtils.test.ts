import { analyzeGraduationRequirement } from '../graduationUtils';
import { TranscriptItem, SpecificMajorType } from '../../types';

let nextId = 1;
function item(overrides: Partial<TranscriptItem> & { courseName: string; credits: number }): TranscriptItem {
  return {
    id: String(nextId++),
    category: 'major_elective',
    ...overrides,
  };
}

const MY_DEPT = '컴퓨터정보공학부';

describe('analyzeGraduationRequirement', () => {
  beforeEach(() => {
    nextId = 1;
  });

  // ---------- ① 전체 학점 ----------
  describe('전체 학점 합산', () => {
    it('수강한 모든 과목의 학점을 합산한다', () => {
      const transcript = [
        item({ courseName: '과목A', credits: 3 }),
        item({ courseName: '과목B', credits: 2 }),
        item({ courseName: '과목C', credits: 4 }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      expect(result.totalCredits).toBe(9);
    });
  });

  // ---------- ② 전공필수 ----------
  describe('전공필수 이수 체크', () => {
    const ALL_SEVEN = [
      '디지털논리회로1',
      '객체지향프로그래밍설계',
      '디지털논리회로2',
      '데이터구조설계',
      '컴퓨터구조',
      '시스템프로그래밍',
      '운영체제',
    ];

    it('7과목을 모두 이수하면 통과하고 missing이 비어있다', () => {
      const transcript = ALL_SEVEN.map((name) =>
        item({ courseName: name, credits: 3, category: 'major_required' })
      );
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      expect(result.details.majorRequired.passed).toBe(true);
      expect(result.details.majorRequired.missing).toEqual([]);
    });

    it('일부만 이수하면 미이수 과목이 원본 배열 순서 그대로 missing에 담긴다', () => {
      // 데이터구조설계, 컴퓨터구조, 운영체제를 빼고 이수
      const taken = ALL_SEVEN.filter(
        (n) => !['데이터구조설계', '컴퓨터구조', '운영체제'].includes(n)
      );
      const transcript = taken.map((name) =>
        item({ courseName: name, credits: 3, category: 'major_required' })
      );
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      expect(result.details.majorRequired.passed).toBe(false);
      expect(result.details.majorRequired.missing).toEqual([
        '데이터구조설계',
        '컴퓨터구조',
        '운영체제',
      ]);
    });

    it('별칭(alias)으로 등록된 과목명으로 이수해도 정상 인식된다', () => {
      const taken = ALL_SEVEN.filter((n) => n !== '객체지향프로그래밍설계');
      const transcript = [
        ...taken.map((name) => item({ courseName: name, credits: 3, category: 'major_required' })),
        item({ courseName: '고급프로그래밍설계', credits: 3, category: 'major_required' }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      expect(result.details.majorRequired.passed).toBe(true);
      expect(result.details.majorRequired.missing).toEqual([]);
    });
  });

  // ---------- ③ 세부전공 (2024 이후) ----------
  describe('세부전공 - 2024년 이후 입학 (조건 3개: 학점>=30, 본전공>=2, 타전공>=1)', () => {
    it('세 조건을 모두 충족하면 통과한다', () => {
      const transcript = [
        item({ courseName: '마이크로프로세서', credits: 10, department: MY_DEPT }), // system(myMajor)
        item({ courseName: 'GPU컴퓨팅', credits: 10, department: MY_DEPT }), // system(myMajor)
        item({ courseName: '데이터통신', credits: 10, department: MY_DEPT }), // info(otherMajor)
      ];
      const result = analyzeGraduationRequirement(transcript, 2024, 'system');
      const specific = result.details.specificMajor;
      expect(specific.currentCredits).toBe(30);
      expect(specific.myMajorCount).toBe(2);
      expect(specific.otherMajorCount).toBe(1);
      expect(specific.passed).toBe(true);
      expect(specific.messages).toContain('세부전공 요건을 모두 충족했습니다.');
    });

    it('학점만 부족하면 학점 부족 메시지만 뜬다', () => {
      const transcript = [
        item({ courseName: '마이크로프로세서', credits: 3, department: MY_DEPT }),
        item({ courseName: 'GPU컴퓨팅', credits: 3, department: MY_DEPT }),
        item({ courseName: '데이터통신', credits: 3, department: MY_DEPT }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2024, 'system');
      const specific = result.details.specificMajor;
      expect(specific.currentCredits).toBe(9);
      expect(specific.passed).toBe(false);
      expect(specific.messages).toEqual(['총 학점이 21점 부족합니다.']);
    });

    it('본전공 과목 수만 부족하면 본전공 부족 메시지만 뜬다', () => {
      const transcript = [
        item({ courseName: '데이터통신', credits: 10, department: MY_DEPT }), // otherMajor
        item({ courseName: '신호및시스템', credits: 10, department: MY_DEPT }), // common
        item({ courseName: '디지털신호처리', credits: 10, department: MY_DEPT }), // common
      ];
      const result = analyzeGraduationRequirement(transcript, 2024, 'system');
      const specific = result.details.specificMajor;
      expect(specific.currentCredits).toBe(30);
      expect(specific.myMajorCount).toBe(0);
      expect(specific.otherMajorCount).toBe(1);
      expect(specific.passed).toBe(false);
      expect(specific.messages).toEqual(['본인 세부전공 과목이 2개 부족합니다.']);
    });

    it('타전공 과목 수만 부족하면 타전공 부족 메시지만 뜬다', () => {
      const transcript = [
        item({ courseName: '마이크로프로세서', credits: 10, department: MY_DEPT }),
        item({ courseName: 'GPU컴퓨팅', credits: 10, department: MY_DEPT }),
        item({ courseName: '임베디드시스템S/W설계', credits: 10, department: MY_DEPT }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2024, 'system');
      const specific = result.details.specificMajor;
      expect(specific.myMajorCount).toBe(3);
      expect(specific.otherMajorCount).toBe(0);
      expect(specific.passed).toBe(false);
      expect(specific.messages).toEqual(['타 세부전공 과목이 1개 부족합니다.']);
    });

    it('공통과목(commonList)만 이수하면 학점은 오르지만 본/타전공 카운트는 0이다', () => {
      const transcript = [
        item({ courseName: '신호및시스템', credits: 15, department: MY_DEPT }),
        item({ courseName: '디지털신호처리', credits: 15, department: MY_DEPT }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2024, 'system');
      const specific = result.details.specificMajor;
      expect(specific.currentCredits).toBe(30);
      expect(specific.myMajorCount).toBe(0);
      expect(specific.otherMajorCount).toBe(0);
    });

    it('본전공/공통 리스트에 동시에 속한 과목(컴퓨터비전)은 학점 중복 없이 1번만 반영되고 myMajorCount는 오른다', () => {
      // '컴퓨터비전'은 SPECIFIC_MAJOR_COURSES.system과 COMMON_COURSES.from2024 양쪽에 모두 존재한다.
      const transcript = [item({ courseName: '컴퓨터비전', credits: 10, department: MY_DEPT })];
      const result = analyzeGraduationRequirement(transcript, 2024, 'system');
      const specific = result.details.specificMajor;
      expect(specific.currentCredits).toBe(10); // 중복 가산 없이 1번만
      expect(specific.myMajorCount).toBe(1);
    });

    it('개설학과가 컴퓨터정보공학부가 아니면 세부전공 계산에서 제외된다', () => {
      const transcript = [
        item({ courseName: '마이크로프로세서', credits: 10, department: '전자공학과' }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2024, 'system');
      const specific = result.details.specificMajor;
      expect(specific.currentCredits).toBe(0);
      expect(specific.myMajorCount).toBe(0);
    });

    it('개설학과가 비어있으면(undefined) 본인 학과로 간주해 포함한다', () => {
      const transcript = [item({ courseName: '마이크로프로세서', credits: 10 })]; // department 미지정
      const result = analyzeGraduationRequirement(transcript, 2024, 'system');
      const specific = result.details.specificMajor;
      expect(specific.currentCredits).toBe(10);
      expect(specific.myMajorCount).toBe(1);
    });
  });

  describe('세부전공 - 2024년 이전 입학 (조건 2개: 학점>=30, 본전공>=1)', () => {
    it('두 조건을 모두 충족하면 통과한다', () => {
      const transcript = [
        item({ courseName: '마이크로프로세서', credits: 10, department: MY_DEPT }), // myMajor
        item({ courseName: '디지털논리회로1', credits: 10, department: MY_DEPT }), // common(until2023)
        item({ courseName: '디지털신호처리', credits: 10, department: MY_DEPT }), // common(until2023)
      ];
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      const specific = result.details.specificMajor;
      expect(specific.currentCredits).toBe(30);
      expect(specific.myMajorCount).toBe(1);
      expect(specific.passed).toBe(true);
      expect(specific.messages).toEqual(['세부전공 요건을 충족했습니다.']);
      // 2024년 이전에는 타전공 조건 자체가 없다
      expect(specific.otherMajorCount).toBe(0);
    });

    it('학점만 부족하면 학점 부족 메시지만 뜬다', () => {
      const transcript = [item({ courseName: '마이크로프로세서', credits: 5, department: MY_DEPT })];
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      const specific = result.details.specificMajor;
      expect(specific.passed).toBe(false);
      expect(specific.messages).toEqual(['총 학점이 25점 부족합니다.']);
    });

    it('본전공 과목 수만 부족하면(0개) 부족 메시지만 뜬다', () => {
      const transcript = [
        item({ courseName: '디지털논리회로1', credits: 15, department: MY_DEPT }),
        item({ courseName: '디지털신호처리', credits: 15, department: MY_DEPT }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      const specific = result.details.specificMajor;
      expect(specific.myMajorCount).toBe(0);
      expect(specific.passed).toBe(false);
      expect(specific.messages).toEqual(['본인 세부전공 과목이 1개 부족합니다.']);
    });
  });

  // ---------- ④ 필수 선수과목 체크 ----------
  describe('필수 선수과목 체크', () => {
    it('후수 과목만 이수하고 선수 과목을 이수하지 않으면 경고 메시지가 뜬다', () => {
      const transcript = [item({ courseName: '고급C프로그래밍', credits: 3 })];
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      expect(result.details.specificMajor.messages).toContain(
        "⚠️ [필수 선수과목 미이수] '고급C프로그래밍' 수강을 위해 'C프로그래밍'을 이수해야 합니다."
      );
    });

    it('선수/후수 과목을 모두 이수하면 경고 메시지가 없다', () => {
      const transcript = [
        item({ courseName: 'C프로그래밍', credits: 3 }),
        item({ courseName: '고급C프로그래밍', credits: 3 }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      const warning = result.details.specificMajor.messages.find((m) =>
        m.includes('고급C프로그래밍')
      );
      expect(warning).toBeUndefined();
    });

    it('선수 과목만 이수하고 후수 과목을 이수하지 않으면 경고가 뜨지 않는다(역방향 미체크)', () => {
      const transcript = [item({ courseName: 'C프로그래밍', credits: 3 })];
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      const warning = result.details.specificMajor.messages.find((m) =>
        m.includes('고급C프로그래밍')
      );
      expect(warning).toBeUndefined();
    });

    it('별칭이 걸린 선수과목을 별칭 이름으로 이수해도 정상 인식된다', () => {
      // 규칙: 산학협력캡스톤설계2 -> 산학협력캡스톤설계 필요
      // '산학협력캡스톤설계1'은 별칭 테이블에서 '산학협력캡스톤설계'로 정규화된다.
      const transcript = [
        item({ courseName: '산학협력캡스톤설계2', credits: 3 }),
        item({ courseName: '산학협력캡스톤설계1', credits: 3 }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      const warning = result.details.specificMajor.messages.find((m) =>
        m.includes('캡스톤설계2')
      );
      expect(warning).toBeUndefined();
    });
  });

  // ---------- ⑤ 교양 학점 (연도별 기준) ----------
  describe('교양 학점 - 입학연도별 기준 학점 경계값', () => {
    const cases: Array<[number, number]> = [
      [2015, 17], // <=2016
      [2016, 17],
      [2017, 20], // 2017~2018
      [2018, 20],
      [2019, 22], // 기본값(2019~2023)
      [2023, 22],
      [2024, 31], // >=2024
      [2025, 31],
    ];

    it.each(cases)('입학연도 %i는 필요 교양 학점이 %i이다', (year, expected) => {
      const result = analyzeGraduationRequirement([], year, 'system');
      expect(result.details.general.requiredCredits).toBe(expected);
    });

    it('필요 학점을 채우면 통과, 못 채우면 미통과로 판정한다', () => {
      const passing = [item({ courseName: '교양A', credits: 22, category: 'general_elective' })];
      const failing = [item({ courseName: '교양A', credits: 21, category: 'general_elective' })];
      expect(analyzeGraduationRequirement(passing, 2020, 'system').details.general.passed).toBe(
        true
      );
      expect(analyzeGraduationRequirement(failing, 2020, 'system').details.general.passed).toBe(
        false
      );
    });

    it('인강(isCyber) 과목은 카테고리와 무관하게 교양 합산에서 제외된다', () => {
      const transcript = [
        item({ courseName: '교양A', credits: 10, category: 'general_elective', isCyber: true }),
        item({ courseName: '교양B', credits: 10, category: 'general_elective', isCyber: false }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2020, 'system');
      expect(result.details.general.currentCredits).toBe(10);
    });

    it('전공(major_*) 카테고리가 아니면 교양선택/교양필수 구분 없이 합산된다', () => {
      const transcript = [
        item({ courseName: '교양필수A', credits: 5, category: 'general_required' }),
        item({ courseName: '교양선택A', credits: 5, category: 'general_elective' }),
        item({ courseName: '기타A', credits: 5, category: 'general_free' }),
        item({ courseName: '전공선택A', credits: 5, category: 'major_elective' }),
      ];
      const result = analyzeGraduationRequirement(transcript, 2020, 'system');
      // 전공선택(major_elective)만 제외되고 나머지 3개(15학점)만 합산되어야 한다
      expect(result.details.general.currentCredits).toBe(15);
    });
  });

  // ---------- ⑥ 차트 데이터 비율 ----------
  describe('차트 데이터 비율 계산', () => {
    it('학점이 기준치를 초과해도 비율은 100을 넘지 않는다(clamp)', () => {
      const transcript = [item({ courseName: '과목A', credits: 200, category: 'major_elective' })];
      const result = analyzeGraduationRequirement(transcript, 2023, 'system');
      const totalIdx = result.categories.labels.indexOf('전체');
      expect(result.categories.data[totalIdx]).toBe(100);
    });

    it(
      '[characterization] 전공필수 달성률은 MAJOR_REQUIRED_COURSES.length(=7)를 하드코딩해서 계산한다 - ' +
        '배열 길이가 바뀌면 이 테스트가 실패해서 알려줘야 한다',
      () => {
        // 7개 중 2개 누락 -> (7-2)/7 * 100 = 71.42... -> round(71)
        const taken = [
          '디지털논리회로1',
          '객체지향프로그래밍설계',
          '디지털논리회로2',
          '데이터구조설계',
          '컴퓨터구조',
        ]; // 시스템프로그래밍, 운영체제 누락
        const transcript = taken.map((name) =>
          item({ courseName: name, credits: 3, category: 'major_required' })
        );
        const result = analyzeGraduationRequirement(transcript, 2023, 'system');
        const idx = result.categories.labels.indexOf('전공필수');
        expect(result.details.majorRequired.missing.length).toBe(2);
        expect(result.categories.data[idx]).toBe(71);
      }
    );
  });
});
