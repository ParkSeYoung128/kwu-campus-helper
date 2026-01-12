// 유틸 함수 모음

/**
 * 날짜 포맷팅 함수
 * @param dateString YYYY-MM-DD 형식의 날짜 문자열
 * @returns 포맷된 날짜 문자열 (예: "2024년 3월 15일")
 */
export const formatDate = (dateString: string): string => {
  // TODO: 실제 날짜 포맷팅 로직 구현
  // 현재는 간단한 형태로 반환
  const date = new Date(dateString);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 날짜 차이 계산 (D-day 계산용)
 * @param targetDate 목표 날짜 (YYYY-MM-DD)
 * @returns 날짜 차이 (음수면 지난 날)
 * 
 * TODO: 실제 D-day 계산 로직은 DDay 화면에서 구현 필요
 */
export const calculateDaysDiff = (targetDate: string): number => {
  const today = new Date(getTodayString());
  const target = new Date(targetDate);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * 시간 포맷팅 (HH:MM)
 */
export const formatTime = (timeString: string): string => {
  return timeString; // 현재는 그대로 반환
};
