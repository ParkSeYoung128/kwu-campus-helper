// availability.test.ts
//
// parseAvailabilityText / slotToTimeRange / candidateToMeetingTime에 대한
// jest 테스트. `npx jest`로 실행한다 (package.json의 jest-expo preset 참고).

import {
  parseAvailabilityText,
  slotToTimeRange,
  candidateToMeetingTime,
  getMondayOfThisWeek,
} from '../availability';

describe('parseAvailabilityText', () => {
  // 1차 시도 실패 -> 2차 버전에서 보강된 케이스
  it('요일 전체 이름("월요일")을 인식한다', () => {
    const r = parseAvailabilityText('월요일 10:00-12:00');
    expect(r.valid).toHaveLength(1);
    expect(r.valid[0].day).toBe('월');
  });

  it('물결(~) 구분자를 인식한다', () => {
    expect(parseAvailabilityText('월 10:00~12:00').valid).toHaveLength(1);
  });

  it('요일-시간 사이 공백이 없어도 인식한다', () => {
    expect(parseAvailabilityText('월10:00-12:00').valid).toHaveLength(1);
  });

  it('한 자리 시각(9:00)을 0-padding하여 인식한다', () => {
    const r = parseAvailabilityText('월 9:00-12:00');
    expect(r.valid[0].start).toBe('09:00');
  });

  // 회귀 방지: 기존에 통과하던 정상 케이스
  it('기본 케이스(2개 구간, 쉼표+공백)를 인식한다', () => {
    const r = parseAvailabilityText('월 10:00-12:00, 수 14:00-16:00');
    expect(r.valid).toHaveLength(2);
    expect(r.invalidChunks).toHaveLength(0);
  });

  it('쉼표 뒤 공백이 없어도 인식한다', () => {
    expect(parseAvailabilityText('월 10:00-12:00,수 14:00-16:00').valid).toHaveLength(2);
  });

  it('3개 이상 구간을 모두 인식한다', () => {
    const r = parseAvailabilityText('월 10:00-12:00, 수 14:00-16:00, 금 09:00-10:30');
    expect(r.valid).toHaveLength(3);
  });

  // 여전히 명확한 오류로 거부되어야 하는 케이스 (조용히 무시하지 않고 invalidChunks에 담김)
  it('요일 오타("워")를 invalidChunks로 분류한다', () => {
    const r = parseAvailabilityText('워 10:00-12:00');
    expect(r.valid).toHaveLength(0);
    expect(r.invalidChunks).toHaveLength(1);
  });

  it('완전 자유 서술("아무때나 가능")을 invalidChunks로 분류한다', () => {
    expect(parseAvailabilityText('아무때나 가능').invalidChunks).toHaveLength(1);
  });

  it('빈 문자열은 valid/invalid 모두 0건이다', () => {
    const r = parseAvailabilityText('');
    expect(r.valid).toHaveLength(0);
    expect(r.invalidChunks).toHaveLength(0);
  });

  it('존재하지 않는 시각(25:00)은 거부한다', () => {
    const r = parseAvailabilityText('월 25:00-26:00');
    expect(r.valid).toHaveLength(0);
    expect(r.invalidChunks).toHaveLength(1);
  });

  it('종료시간이 시작시간보다 빠르면 거부한다', () => {
    expect(parseAvailabilityText('월 14:00-13:00').valid).toHaveLength(0);
  });

  it('요일 두 글자 붙여쓰기("월화")는 거부한다', () => {
    expect(parseAvailabilityText('월화 10:00-12:00').valid).toHaveLength(0);
  });
});

describe('slotToTimeRange / candidateToMeetingTime', () => {
  it('월요일 슬롯은 기준 주의 월요일 날짜로 매핑된다', () => {
    const monday = getMondayOfThisWeek(new Date('2026-09-07T00:00:00')); // 2026-09-07 = 월
    const range = slotToTimeRange({ day: '월', start: '10:00', end: '12:00' }, monday);

    // 문자열을 슬라이스해서 날짜를 비교하지 않고, Date로 파싱한 뒤
    // 로컬 캘린더 날짜(연/월/일)를 직접 확인한다. 문자열 포맷이
    // 나중에 바뀌어도(예: UTC ISO <-> naive 벽시계 문자열) 이 테스트가
    // "정말 그 날짜인지"를 검증하도록 하기 위함이다.
    const start = new Date(range.start);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(8); // 0-indexed: 8 = 9월
    expect(start.getDate()).toBe(7);
    expect(start.getHours()).toBe(10);
  });

  it('일요일 슬롯은 기준 주 +6일로 매핑된다', () => {
    const monday = getMondayOfThisWeek(new Date('2026-09-07T00:00:00'));
    const range = slotToTimeRange({ day: '일', start: '09:00', end: '10:00' }, monday);

    const start = new Date(range.start);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(8);
    expect(start.getDate()).toBe(13);
  });

  it('ISO datetime을 요일+HH:MM으로 정확히 역변환한다', () => {
    const mt = candidateToMeetingTime('2026-09-09T14:00:00', '2026-09-09T16:00:00'); // 수요일
    expect(mt.day).toBe('수');
    expect(mt.startTime).toBe('14:00');
    expect(mt.endTime).toBe('16:00');
  });

  // 회귀 테스트 (CodeRabbit 리뷰에서 지적된 Major 이슈):
  // 이전 구현은 Date.toISOString()으로 UTC 변환을 해서 전송했는데,
  // 백엔드는 timezone 필드를 실제로 쓰지 않고 tzinfo만 제거한 뒤
  // 숫자 그대로 계산한다. 그 결과 기기 로컬 타임존이 UTC가 아니면
  // (예: America/Los_Angeles에서 "10:00"을 입력) 백엔드가 받는 시각이
  // 사용자가 입력한 시각과 달라지는 버그가 있었다(10:00 -> 17:00로 둔갑).
  // slotToTimeRange를 "타임존 변환 없는 벽시계 문자열"을 만들도록 고쳐서,
  // 기기 타임존이 무엇이든 항상 사용자가 입력한 숫자 그대로 나가야 한다.
  describe('타임존 독립성 (기기 로컬 타임존과 무관하게 동일한 벽시계 시각을 반환해야 한다)', () => {
    const ORIGINAL_TZ = process.env.TZ;

    afterEach(() => {
      if (ORIGINAL_TZ === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = ORIGINAL_TZ;
      }
    });

    const buildRangeUnderTz = (tz: string) => {
      process.env.TZ = tz;
      // 명시적 로컬 컴포넌트(연, 월, 일)로 구성 - 문자열 파싱으로 인한
      // 타임존 모호성을 피하기 위해 Date(y, m, d, ...) 형태를 사용한다.
      const monday = getMondayOfThisWeek(new Date(2026, 8, 7, 12, 0, 0)); // 2026-09-07(월)
      return slotToTimeRange({ day: '월', start: '10:00', end: '12:00' }, monday);
    };

    it('UTC / Asia/Seoul / America/Los_Angeles에서 동일한 결과를 낸다', () => {
      const utc = buildRangeUnderTz('UTC');
      const seoul = buildRangeUnderTz('Asia/Seoul');
      const la = buildRangeUnderTz('America/Los_Angeles');

      expect(seoul).toEqual(utc);
      expect(la).toEqual(utc);
      expect(utc.start).toBe('2026-09-07T10:00:00');
      expect(utc.end).toBe('2026-09-07T12:00:00');
    });
  });
});
