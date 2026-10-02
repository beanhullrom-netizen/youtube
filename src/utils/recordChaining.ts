import { DailyRecord } from '../types';

/**
 * Calculate difference in days between two 'YYYY-MM-DD' dates.
 * Returns a positive integer or zero.
 */
export function getDaysDiff(d1: string, d2: string): number {
  if (!d1 || !d2) return 0;
  const [y1, m1, day1] = d1.split('-').map(Number);
  const [y2, m2, day2] = d2.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, day1);
  const utc2 = Date.UTC(y2, m2 - 1, day2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(Math.round((utc2 - utc1) / msPerDay));
}

/**
 * Re-chain records in chronological order.
 * Ensures yesterdaySubs, subsGained, daysDiff, avgDailyGain, and isInitialBaseline
 * are always 100% accurate regardless of the order records were entered.
 */
export function rechainRecords(records: DailyRecord[]): DailyRecord[] {
  if (!records || records.length === 0) return [];

  // 1. Sort ascending by date
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // 2. Map and rechain each record
  return sorted.map((record, index) => {
    if (index === 0) {
      // First baseline entry: No prior record exists
      return {
        ...record,
        yesterdaySubs: record.todaySubs,
        subsGained: 0,
        daysDiff: 0,
        avgDailyGain: 0,
        isInitialBaseline: true,
      };
    }

    const prev = sorted[index - 1];
    const diff = Math.max(1, getDaysDiff(prev.date, record.date));
    const gained = record.todaySubs - prev.todaySubs;
    const avgGain = diff > 1 ? Math.round(gained / diff) : gained;

    return {
      ...record,
      yesterdaySubs: prev.todaySubs,
      subsGained: gained,
      daysDiff: diff,
      avgDailyGain: avgGain,
      isInitialBaseline: false,
    };
  });
}

/**
 * Formats gain and gap information for display in cards, lists, and tooltips.
 */
export function formatRecordGainInfo(record: DailyRecord) {
  if (record.isInitialBaseline || record.daysDiff === 0) {
    return {
      isBaseline: true,
      tag: '🚩 기록 시작점',
      gainBadgeText: '기준점',
      subText: '첫 일지 기준',
      fullGainString: '기준점 (기록 시작)',
      isPositive: true,
      daysDiff: 0,
    };
  }

  const gained = record.subsGained;
  const isPositive = gained >= 0;
  const gainSign = isPositive ? `+${gained.toLocaleString()}` : gained.toLocaleString();
  const daysDiff = record.daysDiff || 1;

  if (daysDiff === 1) {
    return {
      isBaseline: false,
      tag: null,
      gainBadgeText: `${gainSign}`,
      subText: '어제 대비',
      fullGainString: `${gainSign}명 (어제 대비)`,
      isPositive,
      daysDiff: 1,
    };
  }

  const avgGain = record.avgDailyGain ?? Math.round(gained / daysDiff);
  const avgSign = avgGain >= 0 ? `+${avgGain.toLocaleString()}` : avgGain.toLocaleString();

  return {
    isBaseline: false,
    tag: `🗓️ ${daysDiff}일 만의 기록`,
    gainBadgeText: `${gainSign}`,
    subText: `${daysDiff}일간 (일평균 ${avgSign}명)`,
    fullGainString: `${gainSign}명 (${daysDiff}일간 누적, 일평균 ${avgSign}명)`,
    isPositive,
    daysDiff,
  };
}
