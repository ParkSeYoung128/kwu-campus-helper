// src/utils/availability.ts
//
// 팀원이 자유 텍스트로 입력한 가능 시간
// (예: "월 10:00-12:00, 수 14:00-16:00")을
// 백엔드(/api/meeting/suggest)가 요구하는 ISO datetime 기반
// TimeRange로 변환하기 위한 파싱/변환 유틸.
//
// 설계 원칙 - "관대하지만 투명한 파싱":
// - 요일 전체 이름/한 글자, 공백 유무, '-'/'~' 구분자, 한 자리 시각을
//   모두 허용해서 실제 사용자가 흔히 쓰는 표기 변형을 최대한 받아들인다.
// - 그러나 알 수 없는 요일, 존재하지 않는 시각, 역전된 시간 범위 등은
//   조용히 무시하지 않고 invalidChunks에 담아 호출자가 사용자에게
//   "이 부분은 인식하지 못했다"고 알릴 수 있게 한다.

import { MeetingTime } from '../types';

export type ParsedSlot = {
  day: string; // '월'..'일' (표준화된 한 글자)
  start: string; // HH:MM (24시간, 0-padded)
  end: string; // HH:MM
};

export interface AvailabilityParseResult {
  valid: ParsedSlot[];
  invalidChunks: string[];
}

const DAY_ALIASES: Record<string, string> = {
  '월': '월', '월요일': '월',
  '화': '화', '화요일': '화',
  '수': '수', '수요일': '수',
  '목': '목', '목요일': '목',
  '금': '금', '금요일': '금',
  '토': '토', '토요일': '토',
  '일': '일', '일요일': '일',
};

// 월=0 ... 일=6 (한 주의 시작을 월요일로 고정)
const DAY_ORDER: Record<string, number> = {
  '월': 0, '화': 1, '수': 2, '목': 3, '금': 4, '토': 5, '일': 6,
};

// 요일(1글자 이상, 공백 포함 X) + 선택적 공백 + HH:MM + '-' 또는 '~' + HH:MM
const CHUNK_PATTERN = /^(\S+?)\s*(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})$/;

export function parseAvailabilityText(text: string): AvailabilityParseResult {
  const valid: ParsedSlot[] = [];
  const invalidChunks: string[] = [];

  const chunks = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const m = chunk.match(CHUNK_PATTERN);
    if (!m) {
      invalidChunks.push(chunk);
      continue;
    }

    const [, rawDay, rawStart, rawEnd] = m;
    const day = DAY_ALIASES[rawDay];
    if (!day) {
      invalidChunks.push(chunk);
      continue;
    }

    const [sh, sm] = rawStart.split(':').map(Number);
    const [eh, em] = rawEnd.split(':').map(Number);
    if (sh > 23 || eh > 23 || sm > 59 || em > 59) {
      invalidChunks.push(chunk);
      continue;
    }

    const start = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
    const end = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
    if (end <= start) {
      invalidChunks.push(chunk);
      continue;
    }

    valid.push({ day, start, end });
  }

  return { valid, invalidChunks };
}

/** 오늘이 속한 주의 월요일 00:00을 반환 (회의 시간 계산의 기준 주) */
export function getMondayOfThisWeek(reference: Date = new Date()): Date {
  const d = new Date(reference);
  const dow = d.getDay(); // 0=일 ... 6=토
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 파싱된 슬롯(요일+시각)을 "기준 주"의 ISO datetime 문자열(TimeRange)로 변환 */
export function slotToTimeRange(
  slot: ParsedSlot,
  weekStart: Date = getMondayOfThisWeek()
): { start: string; end: string } {
  const offset = DAY_ORDER[slot.day];
  const date = new Date(weekStart);
  date.setDate(date.getDate() + offset);

  const [sh, sm] = slot.start.split(':').map(Number);
  const [eh, em] = slot.end.split(':').map(Number);

  const start = new Date(date);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(date);
  end.setHours(eh, em, 0, 0);

  return { start: start.toISOString(), end: end.toISOString() };
}

/** 백엔드 Candidate 응답(datetime 기준)을 UI용 MeetingTime(요일+HH:MM)으로 변환 */
export function candidateToMeetingTime(startIso: string, endIso: string): MeetingTime {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    day: dayNames[start.getDay()],
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
  };
}
