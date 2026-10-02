import { DailyRecord, ChannelProfile } from '../types';

declare const google: any;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '580467075073-iihhma75f2f1nf9dpk78dr04kn3topiq.apps.googleusercontent.com';
const CLIENT_ID = GOOGLE_CLIENT_ID;
const SCOPES = [
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
  'https://www.googleapis.com/auth/youtube.readonly'
].join(' ');

let currentAccessToken: string | null = null;

export function getCurrentAccessToken(): string | null {
  if (currentAccessToken) return currentAccessToken;
  try {
    return sessionStorage.getItem('yt_access_token');
  } catch {
    return null;
  }
}

export interface YouTubeChannelInfo {
  channelId: string;
  title: string;
  customUrl?: string;
  thumbnailUrl: string;
  subscriberCount: number;
  totalViews: number;
}

export function resetGoogleToken(): void {
  const token = getCurrentAccessToken();
  if (token && typeof google !== 'undefined' && google.accounts?.oauth2?.revoke) {
    try {
      google.accounts.oauth2.revoke(token, () => {
        console.log('[YouTube Auth] Token revoked successfully');
      });
    } catch (e) {
      console.error(e);
    }
  }
  currentAccessToken = null;
  try {
    sessionStorage.removeItem('yt_access_token');
  } catch {}
}

/**
 * 1. Google OAuth 2.0 팝업 로그인으로 Access Token 발급
 *    prompt: 'select_account'를 주어 구글 계정 및 하위 브랜드 채널(게임덩어리 등) 선택창을 강제로 띄웁니다.
 */
export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof google === 'undefined' || !google.accounts?.oauth2) {
      return reject(new Error('Google 로그인 라이브러리가 아직 로드되지 않았습니다. 페이지를 새로고침해 주세요.'));
    }

    if (!CLIENT_ID || CLIENT_ID.includes('여러분의')) {
      return reject(new Error('.env.local 파일에 VITE_GOOGLE_CLIENT_ID가 올바르게 설정되지 않았습니다.'));
    }

    try {
      currentAccessToken = null; // 이전 채널 세션 초기화
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }
          currentAccessToken = tokenResponse.access_token;
          try {
            sessionStorage.setItem('yt_access_token', tokenResponse.access_token);
          } catch {}
          resolve(tokenResponse.access_token);
        },
      });

      // select_account: 구글 로그인 시 원하는 채널(브랜드 계정)을 직접 고를 수 있는 창을 띄움
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(new Error(err.message || '로그인 창을 띄우는 중 오류가 발생했습니다.'));
    }
  });
}


/**
 * 2. 현재 로그인된 내 채널 프로필 및 누적 통계 조회
 */
export async function fetchMyChannelProfile(token?: string): Promise<YouTubeChannelInfo> {
  const authToken = token || currentAccessToken;
  if (!authToken) {
    throw new Error('Google 로그인이 필요합니다.');
  }

  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || '채널 정보를 조회하지 못했습니다.');
  }

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) {
    throw new Error('로그인한 구글 계정에 연결된 유튜브 채널을 찾을 수 없습니다.');
  }

  return {
    channelId: item.id,
    title: item.snippet.title,
    customUrl: item.snippet.customUrl,
    thumbnailUrl: item.snippet.thumbnails?.default?.url,
    subscriberCount: Number(item.statistics.subscriberCount) || 0,
    totalViews: Number(item.statistics.viewCount) || 0,
  };
}

/**
 * 3. YouTube Analytics 일별 리포트 조회
 */
export async function fetchYouTubeDailyAnalytics(
  startDate: string,
  endDate: string,
  token?: string
): Promise<any> {
  const authToken = token || currentAccessToken;
  if (!authToken) {
    throw new Error('Google 로그인이 필요합니다.');
  }

  const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
  url.searchParams.append('ids', 'channel==MINE');
  url.searchParams.append('startDate', startDate);
  url.searchParams.append('endDate', endDate);
  // 조회할 메트릭스: 조회수, 증가구독자, 이탈구독자, 예상수익
  url.searchParams.append('metrics', 'views,subscribersGained,subscribersLost,estimatedRevenue');
  url.searchParams.append('dimensions', 'day');
  url.searchParams.append('sort', 'day');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    // 만약 수익 권한이 없는 비수익화 채널인 경우 estimatedRevenue 제외하고 재시도
    if (res.status === 400 || res.status === 403) {
      const fallbackUrl = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
      fallbackUrl.searchParams.append('ids', 'channel==MINE');
      fallbackUrl.searchParams.append('startDate', startDate);
      fallbackUrl.searchParams.append('endDate', endDate);
      fallbackUrl.searchParams.append('metrics', 'views,subscribersGained,subscribersLost');
      fallbackUrl.searchParams.append('dimensions', 'day');
      fallbackUrl.searchParams.append('sort', 'day');

      const fallbackRes = await fetch(fallbackUrl.toString(), {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
      });

      if (!fallbackRes.ok) {
        const errorData = await fallbackRes.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `통계 조회 실패 (HTTP ${fallbackRes.status})`);
      }
      return await fallbackRes.json();
    }

    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `통계 조회 실패 (HTTP ${res.status})`);
  }

  return await res.json();
}

/**
 * 4. API 리포트 결과 -> DailyRecord 형식으로 변환 및 실제 구독자 수(87,300명 등) 기준으로 완벽 정합성 계산
 */
export interface ChannelVideoItem {
  videoId: string;
  title: string;
  date: string; // YYYY-MM-DD (local time)
  thumbnailUrl: string;
  isShorts: boolean;
  publishedAt: string;
}

/**
 * 4. API 리포트 결과 -> DailyRecord 형식으로 변환 및 실제 구독자 수(87,300명 등) 기준으로 완벽 정합성 계산
 */
export function mergeAnalyticsToRecords(
  reportData: any,
  existingRecords: DailyRecord[],
  currentTotalSubs: number,
  averageRPM: number = 2600,
  videos?: ChannelVideoItem[]
): DailyRecord[] {

  const rows: any[][] = reportData.rows || [];
  const columnHeaders: string[] = (reportData.columnHeaders || []).map((h: any) => h.name);
  const dayIdx = columnHeaders.indexOf('day');
  const viewsIdx = columnHeaders.indexOf('views');
  const gainedIdx = columnHeaders.indexOf('subscribersGained');
  const lostIdx = columnHeaders.indexOf('subscribersLost');
  const revIdx = columnHeaders.indexOf('estimatedRevenue');

  const todayStr = formatDate(new Date());

  // 리포트 데이터가 비어 있는 경우: 오늘 실시간 총 구독자 수 레코드 1건 즉시 생성
  if (rows.length === 0) {
    const todayRecord: DailyRecord = {
      id: `yt-${todayStr}`,
      date: todayStr,
      todaySubs: currentTotalSubs,
      yesterdaySubs: currentTotalSubs,
      subsGained: 0,
      views: 0,
      conversionRate: 0,
      estimatedRevenue: 0,
      confirmedRevenue: 0,
      revenueStatus: 'settled',
      note: 'YouTube 공식 채널 연동 완료 (상세 일별 데이터 집계 대기 중)',
      uploadedVideoType: 'none',
      updatedAt: new Date().toISOString(),
    };
    return [todayRecord];
  }

  // 1. 날짜순(오름차순)으로 정렬
  const sortedRows = [...rows].sort((a, b) => String(a[dayIdx]).localeCompare(String(b[dayIdx])));
  const latestReportDay = String(sortedRows[sortedRows.length - 1][dayIdx]);

  // 2. 오늘 날짜와 리포트 최종 확정일 사이의 일수 차이 (YouTube 통계 집계 지연일수)
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [rYear, rMonth, rDay] = latestReportDay.split('-').map(Number);
  const reportMid = new Date(rYear, rMonth - 1, rDay);
  const gapDays = Math.max(0, Math.round((todayMid.getTime() - reportMid.getTime()) / (1000 * 60 * 60 * 24)));

  // 3. 리포트 내 일평균 순증 구독자 수 계산
  const totalReportNetGained = sortedRows.reduce((acc, row) => {
    const gained = Number(row[gainedIdx]) || 0;
    const lost = Number(row[lostIdx]) || 0;
    return acc + (gained - lost);
  }, 0);
  const avgDailyNetGain = sortedRows.length > 0 ? Math.round(totalReportNetGained / sortedRows.length) : 0;

  // 4. 지연 기간(gapDays) 동안 추가 발생한 순증 추정치 (예: 4일 * ~160명 = 640명)
  const estimatedGainDuringLag = gapDays * Math.max(0, avgDailyNetGain);

  // 5. 리포트 마지막 날(예: 9월 23일) 시점의 실제 당일 마감 구독자 수 산출
  // = 현재 실시간 총 구독자 수 - 지연 기간 동안 추가로 늘어난 구독자 수
  let runningSubs = Math.max(0, currentTotalSubs - estimatedGainDuringLag);
  const computedList: DailyRecord[] = [];

  // 최신 날짜부터 거꾸로 순회하며 정확한 구독자 수(todaySubs, yesterdaySubs) 산출
  for (let i = sortedRows.length - 1; i >= 0; i--) {
    const row = sortedRows[i];
    const day = row[dayIdx];
    const views = Number(row[viewsIdx]) || 0;
    const gained = Number(row[gainedIdx]) || 0;
    const lost = Number(row[lostIdx]) || 0;
    const netGained = gained - lost;
    const conversionRate = views > 0 ? Number(((netGained / views) * 100).toFixed(2)) : 0;

    let estimatedRevenue = 0;
    if (revIdx !== -1 && row[revIdx] !== undefined) {
      estimatedRevenue = Math.round((Number(row[revIdx]) || 0) * 1380);
    } else {
      estimatedRevenue = Math.round((views / 1000) * averageRPM);
    }

    const recTodaySubs = runningSubs;
    const recYesterdaySubs = runningSubs - netGained;
    runningSubs = recYesterdaySubs; // 이전 날짜의 todaySubs로 이어짐

    // 당일 업로드 영상 찾기
    const matchedVideo = videos?.find(v => v.date === day);
    // 당일 업로드가 없다면 해당 일자 기준 직전 업로드된 최근 영상 (알고리즘 견인 영상)
    const priorVideo = !matchedVideo 
      ? videos?.filter(v => v.date <= day).sort((a, b) => b.date.localeCompare(a.date))[0]
      : undefined;

    const chosenVideo = matchedVideo || priorVideo;
    const topVideosList = chosenVideo ? [{
      videoId: chosenVideo.videoId,
      title: chosenVideo.title,
      thumbnailUrl: chosenVideo.thumbnailUrl,
      isShorts: chosenVideo.isShorts,
      publishedDate: chosenVideo.date,
    }] : undefined;

    // 기존 사용자가 직접 작성한 메모(일지)가 있다면 유지
    const existingRec = existingRecords.find(r => r.date === day);
    const hasCustomUserNote = existingRec?.note && 
      !existingRec.note.startsWith('YouTube Analytics') && 
      !existingRec.note.startsWith('YouTube 공식') && 
      !existingRec.note.includes('공식 통계') &&
      !existingRec.note.startsWith('영상 업로드:') &&
      !existingRec.note.startsWith('최근 영상 견인:');

    const defaultEmotion = existingRec?.emotion || (
      netGained >= 200 ? '🎉 대박 & 환호' :
      netGained >= 50 ? '🔥 열정 폭발' :
      netGained > 0 ? '😊 보람 & 뿌듯' :
      netGained === 0 ? '😴 방전 & 휴식' : '🤔 고민 & 연구'
    );

    computedList.push({
      id: `yt-${day}`,
      date: day,
      todaySubs: recTodaySubs,
      yesterdaySubs: recYesterdaySubs,
      subsGained: netGained,
      views,
      conversionRate,
      estimatedRevenue,
      confirmedRevenue: estimatedRevenue,
      revenueStatus: 'settled',
      emotion: defaultEmotion,
      note: finalNote,
      uploadedVideoTitle: matchedVideo?.title || (priorVideo ? `${priorVideo.title} (기존 영상)` : undefined),
      uploadedVideoType: matchedVideo ? (matchedVideo.isShorts ? 'shorts' : 'long') : (priorVideo?.isShorts ? 'shorts' : 'long'),
      uploadedVideoId: chosenVideo?.videoId,
      uploadedVideoThumbnail: chosenVideo?.thumbnailUrl,
      topVideos: topVideosList,
      updatedAt: new Date().toISOString(),
    });
  }

  // 날짜 오름차순 정렬 (과거 -> 최신)
  return computedList.sort((a, b) => a.date.localeCompare(b.date));
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 최근 업로드 영상 조회 (유튜브 업로드 재생목록에서 최대 50건 조회)
 */
export async function fetchMyLatestVideos(
  token: string, 
  maxResults = 50
): Promise<ChannelVideoItem[]> {
  try {
    const chRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!chRes.ok) return [];
    const chData = await chRes.json();
    const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return [];

    const plRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=${maxResults}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!plRes.ok) return [];
    const plData = await plRes.json();

    return (plData.items || []).map((item: any) => {
      const pubDate = item.snippet.publishedAt ? new Date(item.snippet.publishedAt) : null;
      const localDate = pubDate 
        ? `${pubDate.getFullYear()}-${String(pubDate.getMonth() + 1).padStart(2, '0')}-${String(pubDate.getDate()).padStart(2, '0')}`
        : '';
      const videoId = item.snippet.resourceId?.videoId || '';
      const thumbnailUrl = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      const title = item.snippet.title || '';

      return {
        videoId,
        title,
        date: localDate,
        thumbnailUrl,
        isShorts: title.toLowerCase().includes('#shorts'),
        publishedAt: item.snippet.publishedAt || '',
      };
    });
  } catch (e) {
    console.error('[YouTube Videos] 최근 영상 조회 실패:', e);
    return [];
  }
}

/**
 * 특정 날짜에 조회수를 가장 많이 견인한 TOP 영상 목록 조회 (YouTube Analytics API)
 */
export async function fetchDayTopVideos(
  date: string,
  token?: string
): Promise<{ videoId: string; title: string; views: number; thumbnailUrl: string; isShorts: boolean }[]> {
  const authToken = token || getCurrentAccessToken();
  if (!authToken) return [];

  try {
    const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
    url.searchParams.append('ids', 'channel==MINE');
    url.searchParams.append('startDate', date);
    url.searchParams.append('endDate', date);
    url.searchParams.append('metrics', 'views');
    url.searchParams.append('dimensions', 'video');
    url.searchParams.append('sort', '-views');
    url.searchParams.append('maxResults', '5');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`[Top Videos] YouTube Analytics API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const rows = data.rows || [];
    if (rows.length === 0) return [];

    const headers: string[] = (data.columnHeaders || []).map((h: any) => h.name);
    const videoIdx = headers.indexOf('video');
    const viewsIdx = headers.indexOf('views');

    const videoStats = rows.map((r: any[]) => ({
      videoId: String(r[videoIdx]),
      views: Number(r[viewsIdx]) || 0,
    })).filter((v: any) => Boolean(v.videoId));

    const videoIds = videoStats.map((v: any) => v.videoId);
    if (videoIds.length === 0) return [];

    // Fetch video snippet details (title, thumbnail)
    const vRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(',')}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!vRes.ok) {
      return videoStats.map((vs: any) => ({
        ...vs,
        title: `유튜브 영상 (${vs.videoId})`,
        thumbnailUrl: `https://i.ytimg.com/vi/${vs.videoId}/hqdefault.jpg`,
        isShorts: false,
      }));
    }

    const vData = await vRes.json();
    const detailMap: Record<string, any> = {};
    for (const item of (vData.items || [])) {
      detailMap[item.id] = {
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        isShorts: item.snippet.title.toLowerCase().includes('#shorts'),
      };
    }

    return videoStats.map((vs: any) => ({
      videoId: vs.videoId,
      views: vs.views,
      title: detailMap[vs.videoId]?.title || `유튜브 영상 (${vs.videoId})`,
      thumbnailUrl: detailMap[vs.videoId]?.thumbnailUrl || `https://i.ytimg.com/vi/${vs.videoId}/hqdefault.jpg`,
      isShorts: detailMap[vs.videoId]?.isShorts || false,
    }));
  } catch (err) {
    console.error('[fetchDayTopVideos Error]', err);
    return [];
  }
}

/**
 * 5. 원클릭 동기화 메인 함수: 구글 로그인 -> 채널 정보 조회 -> 최근 통계 리포트 조회 -> 병합
 */
export async function syncRecentYouTubeData(
  existingRecords: DailyRecord[],
  days: number = 14,
  averageRPM: number = 2600
): Promise<{
  updatedRecords: DailyRecord[];
  channelInfo: YouTubeChannelInfo;
  syncedDaysCount: number;
}> {
  console.log('[YouTube Sync] 1. 구글 OAuth 로그인 팝업 요청...');
  // 1. 구글 OAuth 로그인 팝업
  const token = await requestGoogleAccessToken();
  console.log('[YouTube Sync] 1. Access Token 획득 성공!');

  // 2. 내 채널 기본 정보 조회
  console.log('[YouTube Sync] 2. 채널 기본 정보 조회 중...');
  const channelInfo = await fetchMyChannelProfile(token);
  console.log('[YouTube Sync] 2. 채널 정보 조회 완료:', channelInfo);

  // 3. 동기화 날짜 범위 계산 (유튜브 통계 지연을 감안해 어제부터 days일 전까지)
  const today = new Date();
  const end = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000); // 1일 전 (어제)
  const start = new Date(today.getTime() - (days + 2) * 24 * 60 * 60 * 1000); // days+2일 전

  const startDate = formatDate(start);
  const endDate = formatDate(end);
  console.log(`[YouTube Sync] 3. 통계 조회 기간: ${startDate} ~ ${endDate}`);

  // 4. Analytics 리포트 데이터 및 최근 업로드 영상 병렬 조회 (최대 50개)
  const [reportData, latestVideos] = await Promise.all([
    fetchYouTubeDailyAnalytics(startDate, endDate, token),
    fetchMyLatestVideos(token, 50),
  ]);
  const syncedDaysCount = reportData.rows ? reportData.rows.length : 0;
  console.log(`[YouTube Sync] 4. 통계 리포트 데이터 수신 (${syncedDaysCount}일치):`, reportData);
  console.log(`[YouTube Sync] 4-1. 최근 영상 목록 수신 (${latestVideos.length}개):`, latestVideos);

  // 5. 레코드 병합
  const updatedRecords = mergeAnalyticsToRecords(
    reportData,
    existingRecords,
    channelInfo.subscriberCount,
    averageRPM,
    latestVideos
  );
  console.log('[YouTube Sync] 5. 데이터 병합 완료. 총 레코드 수:', updatedRecords.length);

  return {
    updatedRecords,
    channelInfo,
    syncedDaysCount,
  };
}



