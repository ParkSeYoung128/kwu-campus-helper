// availability.test.ts
//
// 주의: 이 프로젝트에는 아직 테스트 러너(jest 등)가 설치되어 있지 않습니다.
// 이 파일은 parseAvailabilityText / slotToTimeRange / candidateToMeetingTime의
// 기대 동작을 문서화한 회귀 테스트 스펙이며, 실제 실행은 다음 두 가지 방법 중 하나로 가능합니다.
//   1) jest + ts-jest(또는 @swc/jest) 설치 후 `npx jest` 로 그대로 실행
//   2) (임시 검증용) tsc로 컴파일한 뒤 node --test 등으로 실행
//
// 이번 작업에서는 새 패키지 설치 전 승인을 받기로 한 제약사항에 따라
// jest를 설치하지 않았고, 대신 tsc 컴파일 + node assert 조합으로
// 아래와 동일한 케이스 16개를 모두 통과시키는 것을 확인했습니다.
// (자세한 내용은 작업 리포트의 4단계 검증 섹션 참고)

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
    expect(range.start.slice(0, 10)).toBe('2026-09-07');
    expect(new Date(range.start).getHours()).toBe(10);
  });

  it('일요일 슬롯은 기준 주 +6일로 매핑된다', () => {
    const monday = getMondayOfThisWeek(new Date('2026-09-07T00:00:00'));
    const range = slotToTimeRange({ day: '일', start: '09:00', end: '10:00' }, monday);
    expect(range.start.slice(0, 10)).toBe('2026-09-13');
  });

  it('ISO datetime을 요일+HH:MM으로 정확히 역변환한다', () => {
    const mt = candidateToMeetingTime('2026-09-09T14:00:00', '2026-09-09T16:00:00'); // 수요일
    expect(mt.day).toBe('수');
    expect(mt.startTime).toBe('14:00');
    expect(mt.endTime).toBe('16:00');
  });
});
