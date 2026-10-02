import { DailyRecord } from '../types';

export interface StreakInfo {
  currentStreak: number;
  maxStreak: number;
  isTodayRecorded: boolean;
  isYesterdayRecorded: boolean;
  message: string;
}

/**
 * Calculate creator daily logging streak based on record dates
 */
export function calculateStreak(records: DailyRecord[]): StreakInfo {
  if (!records || records.length === 0) {
    return {
      currentStreak: 0,
      maxStreak: 0,
      isTodayRecorded: false,
      isYesterdayRecorded: false,
      message: '오늘 첫 일지를 작성하고 스트릭을 시작해보세요! 🔥',
    };
  }

  // Set of recorded dates (YYYY-MM-DD)
  const dateSet = new Set(records.map((r) => r.date));

  const now = new Date();
  const formatDay = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatDay(now);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = formatDay(yesterday);

  const isTodayRecorded = dateSet.has(todayStr);
  const isYesterdayRecorded = dateSet.has(yesterdayStr);

  // 1. Calculate current streak
  let currentStreak = 0;
  let checkDate = isTodayRecorded ? new Date(now) : new Date(yesterday);

  if (isTodayRecorded || isYesterdayRecorded) {
    while (true) {
      const dStr = formatDay(checkDate);
      if (dateSet.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // 2. Calculate max streak across all historical dates
  const sortedDates = Array.from(dateSet).sort();
  let maxStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const [y, m, d] = dStr.split('-').map(Number);
    const currDate = new Date(y, m - 1, d);

    if (prevDate) {
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }

    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
    prevDate = currDate;
  }

  // Dynamic motivational message
  let message = '';
  if (currentStreak === 0) {
    message = '오늘 일지를 작성하고 새로운 불꽃을 피워보세요! 🔥';
  } else if (isTodayRecorded) {
    message = `${currentStreak}일 연속 일지 작성 완료! 꾸준함이 10만 실버버튼을 만듭니다.`;
  } else {
    message = `어제까지 ${currentStreak}일 연속 기록 중! 오늘 일지를 쓰면 ${currentStreak + 1}일 연속 달성! 🔥`;
  }

  return {
    currentStreak,
    maxStreak: Math.max(maxStreak, currentStreak),
    isTodayRecorded,
    isYesterdayRecorded,
    message,
  };
}
