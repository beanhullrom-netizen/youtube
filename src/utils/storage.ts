import { DailyRecord, ChannelProfile, TimeCapsule100k } from '../types';
import { INITIAL_SAMPLE_RECORDS, DEFAULT_PROFILE } from '../data/sampleData';
import { rechainRecords } from './recordChaining';
import { supabase } from '../services/supabase';

// 사용자의 요청("로컬에 저장되는 정보는 없어야해")에 따라 로컬 브라우저 캐시 전면 정리
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('creator_studio_records_v2');
    localStorage.removeItem('creator_studio_profile_v2');
    localStorage.removeItem('creator_studio_time_capsule_100k');
    localStorage.removeItem('creator_studio_audio_muted');
  } catch (e) {
    console.warn('LocalStorage cleanup skipped', e);
  }
}

// ---------------------------------------------------------------------------
// DB Mapper: Supabase snake_case <-> TypeScript camelCase
// ---------------------------------------------------------------------------

export function fromDbRecord(row: any): DailyRecord {
  return {
    id: row.id,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : row.date,
    todaySubs: Number(row.today_subs ?? 0),
    yesterdaySubs: Number(row.yesterday_subs ?? 0),
    subsGained: Number(row.subs_gained ?? 0),
    views: Number(row.views ?? 0),
    conversionRate: Number(row.conversion_rate ?? 0),
    note: row.note || '',
    emotion: row.emotion || undefined,
    uploadedVideoTitle: row.uploaded_video_title || undefined,
    uploadedVideoType: row.uploaded_video_type || 'none',
    uploadedVideoId: row.uploaded_video_id || undefined,
    uploadedVideoThumbnail: row.uploaded_video_thumbnail || undefined,
    topVideos: row.top_videos || undefined,
    daysDiff: row.days_diff != null ? Number(row.days_diff) : undefined,
    avgDailyGain: row.avg_daily_gain != null ? Number(row.avg_daily_gain) : undefined,
    isInitialBaseline: row.is_initial_baseline ?? false,
    estimatedRevenue: Number(row.estimated_revenue ?? 0),
    confirmedRevenue: row.confirmed_revenue != null ? Number(row.confirmed_revenue) : undefined,
    revenueStatus: row.revenue_status || 'pending',
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function toDbRecord(r: DailyRecord) {
  return {
    id: r.id,
    date: r.date,
    today_subs: r.todaySubs,
    yesterday_subs: r.yesterdaySubs,
    subs_gained: r.subsGained,
    views: r.views,
    conversion_rate: r.conversionRate,
    note: r.note || '',
    emotion: r.emotion || null,
    uploaded_video_title: r.uploadedVideoTitle || null,
    uploaded_video_type: r.uploadedVideoType || 'none',
    uploaded_video_id: r.uploadedVideoId || null,
    uploaded_video_thumbnail: r.uploadedVideoThumbnail || null,
    top_videos: r.topVideos || [],
    days_diff: r.daysDiff ?? 1,
    avg_daily_gain: r.avgDailyGain ?? 0,
    is_initial_baseline: r.isInitialBaseline ?? false,
    estimated_revenue: r.estimatedRevenue ?? 0,
    confirmed_revenue: r.confirmedRevenue ?? null,
    revenue_status: r.revenueStatus || 'pending',
    updated_at: r.updatedAt || new Date().toISOString(),
  };
}

export function fromDbProfile(row: any): ChannelProfile {
  return {
    channelName: row.channel_name || '게임덩어리',
    creatorName: row.creator_name || '게임덩어리',
    category: row.category || '테크 & 게임',
    targetSubs: 100000,
    currentSubs: Number(row.current_subs ?? 87300),
    targetDate: row.target_date || undefined,
    averageRPM: Number(row.average_rpm ?? 2600),
  };
}

export function toDbProfile(p: ChannelProfile) {
  return {
    id: 'default',
    channel_name: p.channelName,
    creator_name: p.creatorName,
    category: p.category,
    target_subs: 100000,
    current_subs: p.currentSubs || 87300,
    target_date: p.targetDate || null,
    average_rpm: p.averageRPM || 2600,
    updated_at: new Date().toISOString(),
  };
}

export function fromDbCapsule(row: any): TimeCapsule100k | null {
  if (!row || !row.is_sealed) return null;
  return {
    isSealed: row.is_sealed,
    writtenAt: row.written_at || '',
    writtenSubs: Number(row.written_subs ?? 0),
    title: row.title || '10만의 나에게 보내는 편지',
    message: row.message || '',
    rewardPromise: row.reward_promise || undefined,
    unsealedAt: row.unsealed_at || undefined,
  };
}

export function toDbCapsule(capsule: TimeCapsule100k) {
  return {
    id: 'default',
    is_sealed: capsule.isSealed,
    written_at: capsule.writtenAt,
    written_subs: capsule.writtenSubs,
    title: capsule.title,
    message: capsule.message,
    reward_promise: capsule.rewardPromise || null,
    unsealed_at: capsule.unsealedAt || null,
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Daily Records CRUD (Supabase Direct)
// ---------------------------------------------------------------------------

export async function loadRecords(): Promise<DailyRecord[]> {
  try {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.warn('Supabase loadRecords warning/fallback:', error.message);
      return rechainRecords(INITIAL_SAMPLE_RECORDS);
    }

    if (data && data.length > 0) {
      const parsed = data.map(fromDbRecord);
      return rechainRecords(parsed);
    }

    // DB가 비어있는 경우 초기 샘플 데이터 시딩
    const initialChained = rechainRecords(INITIAL_SAMPLE_RECORDS);
    await saveRecords(initialChained);
    return initialChained;
  } catch (err) {
    console.error('Failed to load records from Supabase', err);
    return rechainRecords(INITIAL_SAMPLE_RECORDS);
  }
}

export async function saveRecords(records: DailyRecord[]): Promise<void> {
  try {
    const chained = rechainRecords(records);
    const dbPayload = chained.map(toDbRecord);
    const { error } = await supabase
      .from('daily_records')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.error('Failed to bulk upsert records to Supabase', error);
    }
  } catch (err) {
    console.error('Failed to save records to Supabase', err);
  }
}

export async function saveSingleRecord(record: DailyRecord): Promise<void> {
  try {
    const dbPayload = toDbRecord(record);
    const { error } = await supabase
      .from('daily_records')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.error('Failed to save record to Supabase', error);
    }
  } catch (err) {
    console.error('Failed to save record to Supabase', err);
  }
}

export async function deleteRecord(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('daily_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete record from Supabase', error);
    }
  } catch (err) {
    console.error('Failed to delete record from Supabase', err);
  }
}

// ---------------------------------------------------------------------------
// Channel Profile CRUD (Supabase Direct)
// ---------------------------------------------------------------------------

export async function loadProfile(): Promise<ChannelProfile> {
  try {
    const { data, error } = await supabase
      .from('channel_profile')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.warn('Supabase loadProfile warning/fallback:', error.message);
      return { ...DEFAULT_PROFILE, targetSubs: 100000 };
    }

    if (data) {
      return fromDbProfile(data);
    }

    // 기본 프로필 시딩
    const defProf: ChannelProfile = { ...DEFAULT_PROFILE, targetSubs: 100000 };
    await saveProfile(defProf);
    return defProf;
  } catch (err) {
    console.error('Failed to load profile from Supabase', err);
    return { ...DEFAULT_PROFILE, targetSubs: 100000 };
  }
}

export async function saveProfile(profile: ChannelProfile): Promise<void> {
  try {
    const dbPayload = toDbProfile(profile);
    const { error } = await supabase
      .from('channel_profile')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.error('Failed to save profile to Supabase', error);
    }
  } catch (err) {
    console.error('Failed to save profile to Supabase', err);
  }
}

// ---------------------------------------------------------------------------
// Time Capsule CRUD (Supabase Direct)
// ---------------------------------------------------------------------------

export async function loadTimeCapsule(): Promise<TimeCapsule100k | null> {
  try {
    const { data, error } = await supabase
      .from('time_capsule_100k')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.warn('Supabase loadTimeCapsule warning/fallback:', error.message);
      return null;
    }

    if (data) {
      return fromDbCapsule(data);
    }
    return null;
  } catch (err) {
    console.error('Failed to load time capsule from Supabase', err);
    return null;
  }
}

export async function saveTimeCapsule(capsule: TimeCapsule100k | null): Promise<void> {
  try {
    if (!capsule) {
      await supabase
        .from('time_capsule_100k')
        .delete()
        .eq('id', 'default');
    } else {
      const dbPayload = toDbCapsule(capsule);
      await supabase
        .from('time_capsule_100k')
        .upsert(dbPayload, { onConflict: 'id' });
    }
  } catch (err) {
    console.error('Failed to save time capsule to Supabase', err);
  }
}

// ---------------------------------------------------------------------------
// Metrics & Export Utilities
// ---------------------------------------------------------------------------

export function calculateRecordMetrics(
  yesterdaySubs: number,
  todaySubs: number,
  views: number,
  averageRPM: number = 2600,
): { subsGained: number; conversionRate: number; estimatedRevenue: number } {
  const subsGained = todaySubs - yesterdaySubs;
  const conversionRate = views > 0 ? Number(((subsGained / views) * 100).toFixed(2)) : 0;
  const estimatedRevenue = Math.round((views / 1000) * averageRPM);
  return { subsGained, conversionRate, estimatedRevenue };
}

export function exportDataAsJSON(records: DailyRecord[], profile: ChannelProfile) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    source: 'Supabase Cloud Database',
    profile,
    records,
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `creator-studio-supabase-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
