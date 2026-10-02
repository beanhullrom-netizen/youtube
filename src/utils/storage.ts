import { DailyRecord, ChannelProfile, TimeCapsule100k } from '../types';
import { INITIAL_SAMPLE_RECORDS, DEFAULT_PROFILE } from '../data/sampleData';
import { rechainRecords } from './recordChaining';

const RECORDS_KEY = 'creator_studio_records_v2';
const PROFILE_KEY = 'creator_studio_profile_v2';
const TIME_CAPSULE_KEY = 'creator_studio_time_capsule_100k';

export function loadRecords(): DailyRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) {
      const chained = rechainRecords(INITIAL_SAMPLE_RECORDS);
      saveRecords(chained);
      return chained;
    }
    let parsed: DailyRecord[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // 자동 데이터 보정 (마이그레이션):
      // 이전 실시간 동기화 시 9월 23일에 오늘(9/27) 실시간 총 구독자(87,300명)가 들어간 경우
      // 9월 23일 실제 마감 구독자(86,660명, 지연일수 4일 * 일평균 순증 160명 반영)로 보정
      const rec23 = parsed.find(r => r.date === '2026-09-23');
      if (rec23 && rec23.todaySubs === 87300) {
        const diff = 87300 - 86660; // 640명 차이 보정
        parsed = parsed.map(r => ({
          ...r,
          todaySubs: r.todaySubs > 80000 ? r.todaySubs - diff : r.todaySubs,
          yesterdaySubs: r.yesterdaySubs > 80000 ? r.yesterdaySubs - diff : r.yesterdaySubs,
        }));
      }

      // 시계열 자동 재정렬 및 증감/공백 자동 재계산 (Re-chaining)
      const chained = rechainRecords(parsed);
      saveRecords(chained);
      return chained;
    }
    return rechainRecords(INITIAL_SAMPLE_RECORDS);
  } catch (err) {
    console.error('Failed to load records from localStorage', err);
    return rechainRecords(INITIAL_SAMPLE_RECORDS);
  }
}

export function saveRecords(records: DailyRecord[]): void {
  try {
    const chained = rechainRecords(records);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(chained));
  } catch (err) {
    console.error('Failed to save records to localStorage', err);
  }
}

export function loadProfile(): ChannelProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    let prof: ChannelProfile = DEFAULT_PROFILE;
    if (raw) {
      prof = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    }
    // 목표치는 항상 100,000명(10만 실버버튼)으로 고정
    prof.targetSubs = 100000;
    if (!prof.currentSubs || prof.currentSubs < 80000) {
      prof.currentSubs = 87300;
    }
    return prof;
  } catch {
    return { ...DEFAULT_PROFILE, targetSubs: 100000, currentSubs: 87300 };
  }
}

export function saveProfile(profile: ChannelProfile): void {
  try {
    const fixedProfile: ChannelProfile = {
      ...profile,
      targetSubs: 100000, // 10만 고정
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(fixedProfile));
  } catch (err) {
    console.error('Failed to save profile', err);
  }
}

export function loadTimeCapsule(): TimeCapsule100k | null {
  try {
    const raw = localStorage.getItem(TIME_CAPSULE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load time capsule', err);
    return null;
  }
}

export function saveTimeCapsule(capsule: TimeCapsule100k | null): void {
  try {
    if (!capsule) {
      localStorage.removeItem(TIME_CAPSULE_KEY);
    } else {
      localStorage.setItem(TIME_CAPSULE_KEY, JSON.stringify(capsule));
    }
  } catch (err) {
    console.error('Failed to save time capsule', err);
  }
}

export function calculateRecordMetrics(
  yesterdaySubs: number,
  todaySubs: number,
  views: number,
  averageRPM: number = 2600,
): { subsGained: number; conversionRate: number; estimatedRevenue: number } {
  const subsGained = todaySubs - yesterdaySubs;
  const conversionRate = views > 0 ? Number(((subsGained / views) * 100).toFixed(2)) : 0;
  // Estimated revenue = (views / 1000) * RPM
  const estimatedRevenue = Math.round((views / 1000) * averageRPM);
  return { subsGained, conversionRate, estimatedRevenue };
}

export function exportDataAsJSON(records: DailyRecord[], profile: ChannelProfile) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    profile,
    records,
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `creator-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDataAsCSV(records: DailyRecord[]) {
  const headers = [
    '날짜', 
    '어제 구독자', 
    '오늘 구독자', 
    '늘어난 구독자', 
    '일일 조회수', 
    '구독 전환율(%)', 
    '업로드 영상',
    '영상 형태',
    '예상 수익(원)', 
    '확정 정산액(원)', 
    '정산 상태',
    '그날의 한마디'
  ];
  const rows = records.map((r) => [
    r.date,
    r.yesterdaySubs,
    r.todaySubs,
    r.subsGained,
    r.views,
    r.conversionRate,
    `"${(r.uploadedVideoTitle || '').replace(/"/g, '""')}"`,
    r.uploadedVideoType || 'none',
    r.estimatedRevenue || 0,
    r.confirmedRevenue !== undefined ? r.confirmedRevenue : '집계중(지연)',
    r.revenueStatus === 'settled' ? '정산완료' : '집계대기(2일지연)',
    `"${(r.note || '').replace(/"/g, '""')}"`,
  ]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `creator-studio-records-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
