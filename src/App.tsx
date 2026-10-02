/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyRecord, ChannelProfile } from './types';
import { 
  loadRecords, 
  saveRecords, 
  deleteRecord,
  loadProfile, 
  saveProfile 
} from './utils/storage';
import { INITIAL_SAMPLE_RECORDS, DEFAULT_PROFILE } from './data/sampleData';
import { rechainRecords } from './utils/recordChaining';

import { Header } from './components/Header';
import { GoalTracker } from './components/GoalTracker';
import { GrowthTrendChart } from './components/GrowthTrendChart';
import { CreatorJournal } from './components/CreatorJournal';
import { EmotionCalendarModal } from './components/EmotionCalendarModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthGate } from './components/AuthGate';
import { ChannelPickerModal } from './components/ChannelPickerModal';
import { 
  syncRecentYouTubeData, 
  requestGoogleAccessToken, 
  fetchMyChannels, 
  setSelectedChannelId, 
  YouTubeChannelInfo,
  TARGET_CHANNEL_ID
} from './services/youtubeAnalytics';
import { Loader2, PenSquare, Target, TrendingUp, Calendar, Settings } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<DailyRecord[]>(() => rechainRecords(INITIAL_SAMPLE_RECORDS));
  const [profile, setProfile] = useState<ChannelProfile>(() => ({ ...DEFAULT_PROFILE, targetSubs: 100000 }));
  const [isInitializing, setIsInitializing] = useState(true);

  // Modals & Calendar state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEmotionCalendarOpen, setIsEmotionCalendarOpen] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
  const [isSyncingYouTube, setIsSyncingYouTube] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isChannelPickerOpen, setIsChannelPickerOpen] = useState(false);
  const [detectedChannels, setDetectedChannels] = useState<YouTubeChannelInfo[]>([]);
  const [currentOAuthToken, setCurrentOAuthToken] = useState<string>('');

  // Supabase 클라우드 데이터베이스 초기 로드
  useEffect(() => {
    let isMounted = true;
    async function initSupabaseData() {
      try {
        setIsInitializing(true);
        const [loadedRecords, loadedProfile] = await Promise.all([
          loadRecords(),
          loadProfile(),
        ]);
        if (isMounted) {
          setRecords(loadedRecords);
          setProfile(loadedProfile);
        }
      } catch (err) {
        console.error('[Supabase Init Error]', err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }
    initSupabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update records in state and Supabase Cloud
  const handleUpdateRecords = async (newRecords: DailyRecord[]) => {
    const chained = rechainRecords(newRecords);
    setRecords(chained);
    await saveRecords(chained);
  };

  // Update profile and ensure 100k target is locked in Supabase Cloud
  const handleUpdateProfile = async (newProfile: ChannelProfile) => {
    const fixedProfile: ChannelProfile = { ...newProfile, targetSubs: 100000 };
    setProfile(fixedProfile);
    await saveProfile(fixedProfile);
  };

  // Save or update a single journal record in Supabase Cloud
  const handleSaveJournalRecord = async (savedRecord: DailyRecord) => {
    const existingIndex = records.findIndex((r) => r.date === savedRecord.date);
    let updatedList: DailyRecord[];

    if (existingIndex >= 0) {
      updatedList = [...records];
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...savedRecord };
    } else {
      updatedList = [...records, savedRecord];
    }

    // Always rechain to ensure all past and future records connect cleanly
    const chained = rechainRecords(updatedList);
    
    // 가장 최근 일지 (가장 최신 날짜의 레코드)
    const latest = chained[chained.length - 1];
    const latestSubs = latest ? latest.todaySubs : savedRecord.todaySubs;

    const updatedProf: ChannelProfile = {
      ...profile,
      currentSubs: latestSubs,
      targetSubs: 100000,
    };

    // 상태 및 Supabase 클라우드 즉각 동기화 (로컬스토리지 미사용)
    setRecords(chained);
    setProfile(updatedProf);

    await Promise.all([
      saveRecords(chained),
      saveProfile(updatedProf),
    ]);
  };

  // Delete a journal record from Supabase Cloud
  const handleDeleteRecord = async (id: string) => {
    const filtered = records.filter((r) => r.id !== id);
    const chained = rechainRecords(filtered);
    setRecords(chained);
    await Promise.all([
      deleteRecord(id),
      saveRecords(chained),
    ]);
  };

  // Reset to initial sample data in Supabase Cloud
  const handleResetSampleData = async () => {
    if (confirm('샘플 데이터로 초기화하시겠습니까? Supabase 클라우드 데이터베이스의 기록이 초기화됩니다.')) {
      const resetRecords = rechainRecords(INITIAL_SAMPLE_RECORDS);
      const resetProfile: ChannelProfile = {
        ...DEFAULT_PROFILE,
        targetSubs: 100000,
        currentSubs: 87300,
      };
      setRecords(resetRecords);
      setProfile(resetProfile);
      await Promise.all([
        saveRecords(resetRecords),
        saveProfile(resetProfile),
      ]);
      setSyncMessage({
        text: '☁️ Supabase 클라우드 데이터베이스가 초기 샘플 데이터로 복원되었습니다.',
        type: 'success',
      });
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  // Import JSON backup data to Supabase Cloud
  const handleImportData = async (importedRecords: DailyRecord[], importedProfile: ChannelProfile) => {
    const fixedProfile: ChannelProfile = { ...importedProfile, targetSubs: 100000 };
    await handleUpdateRecords(importedRecords);
    await handleUpdateProfile(fixedProfile);
  };

  // 채널 정보 적용 및 결과 처리
  const handleSyncResult = async (result: any, channel?: YouTubeChannelInfo) => {
    // Save updated records to Supabase Cloud
    await handleUpdateRecords(result.updatedRecords);

    // Update profile channel title, creator name, currentSubs in Supabase Cloud
    const finalTitle = result.channelInfo?.title || channel?.title || '게임덩어리';
    const finalSubs = result.channelInfo?.subscriberCount || channel?.subscriberCount || 89818;
    const updatedProf: ChannelProfile = {
      ...profile,
      channelName: finalTitle,
      creatorName: finalTitle,
      targetSubs: 100000, // 10만 실버버튼 고정
      currentSubs: finalSubs,
    };
    await handleUpdateProfile(updatedProf);

    const msg = result.syncedDaysCount > 0
      ? `🎉 '${finalTitle}' (구독자 ${finalSubs.toLocaleString()}명) 연동 완료! 최근 ${result.syncedDaysCount}일치 공식 데이터가 Supabase에 저장되었습니다.`
      : `✅ '${finalTitle}' (구독자 ${finalSubs.toLocaleString()}명) 연동 완료!`;

    setSyncMessage({
      text: msg,
      type: 'success',
    });
    setTimeout(() => setSyncMessage(null), 8000);
  };

  // 특정 채널로 동기화 실행
  const executeSyncWithChannel = async (channel: YouTubeChannelInfo, token?: string) => {
    try {
      setIsSyncingYouTube(true);
      setIsChannelPickerOpen(false);
      setSelectedChannelId(channel.channelId);

      const effectiveToken = token || currentOAuthToken || await requestGoogleAccessToken();
      const result = await syncRecentYouTubeData(records, 14, profile.averageRPM, effectiveToken);
      await handleSyncResult(result, channel);
    } catch (err: any) {
      console.error('[YouTube Sync Error]', err);
      const errMsg = err.message || '오류가 발생했습니다. 구글 콘솔 설정 상태를 확인해 주세요.';
      setSyncMessage({
        text: `⚠️ 유튜브 연동 실패: ${errMsg}`,
        type: 'error',
      });
      setTimeout(() => setSyncMessage(null), 10000);
    } finally {
      setIsSyncingYouTube(false);
    }
  };

  // 채널 선택 모달 열기
  const handleOpenChannelPicker = async () => {
    try {
      setSyncMessage(null);
      let token = currentOAuthToken;
      if (!token) {
        setIsSyncingYouTube(true);
        token = await requestGoogleAccessToken();
        setCurrentOAuthToken(token);
        setIsSyncingYouTube(false);
      }
      const channels = await fetchMyChannels(token);
      setDetectedChannels(channels);
      setIsChannelPickerOpen(true);
    } catch (err: any) {
      setIsSyncingYouTube(false);
      console.error('[Open Channel Picker Error]', err);
      setSyncMessage({
        text: `⚠️ 채널 목록 조회 실패: ${err.message || '로그인 창을 확인해 주세요.'}`,
        type: 'error',
      });
      setTimeout(() => setSyncMessage(null), 8000);
    }
  };

  // Handle YouTube Analytics Sync
  const handleSyncYouTube = async () => {
    try {
      setIsSyncingYouTube(true);
      setSyncMessage(null);

      // 1. Google OAuth 로그인 팝업 요청
      const token = await requestGoogleAccessToken();
      setCurrentOAuthToken(token);

      // 2. 계정 내 사용 가능한 채널 목록 감지
      const channels = await fetchMyChannels(token);
      setDetectedChannels(channels);

      // 3. 만약 2개 이상의 채널이 감지되면 채널 선택 모달을 띄워 사용자가 '게임덩어리'를 직접 선택하게 함
      if (channels.length > 1) {
        setIsChannelPickerOpen(true);
        setIsSyncingYouTube(false);
        return;
      }

      // 4. 단일 채널이거나 목표 채널 '게임덩어리' 직접 동기화
      const targetChannel = channels.find(c => c.channelId === TARGET_CHANNEL_ID) || channels[0];
      if (targetChannel) {
        await executeSyncWithChannel(targetChannel, token);
      } else {
        const result = await syncRecentYouTubeData(records, 14, profile.averageRPM, token);
        await handleSyncResult(result);
      }
    } catch (err: any) {
      console.error('[YouTube Sync Error]', err);
      const errMsg = err.message || '오류가 발생했습니다. 구글 콘솔 설정 상태를 확인해 주세요.';
      setSyncMessage({
        text: `⚠️ 유튜브 연동 실패: ${errMsg}`,
        type: 'error',
      });
      setTimeout(() => setSyncMessage(null), 10000);
    } finally {
      setIsSyncingYouTube(false);
    }
  };

  // 가장 최근 일지 (날짜순 기준 가장 최신 레코드)
  const latestRecord = React.useMemo(() => {
    if (records.length === 0) return null;
    return [...records].sort((a, b) => a.date.localeCompare(b.date))[records.length - 1];
  }, [records]);

  return (
    <AuthGate>
      {(user, handleLogout) => (
        <div className="min-h-screen bg-[#0c0d10] text-zinc-100 flex flex-col font-['Pretendard',sans-serif]">
          {/* Top Header */}
          <Header
            profile={profile}
            latestRecord={latestRecord}
            records={records}
            onOpenRecordModal={() => {}}
            onOpenEmotionCalendar={() => setIsEmotionCalendarOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onResetSampleData={handleResetSampleData}
            onSyncYouTube={handleSyncYouTube}
            isSyncingYouTube={isSyncingYouTube}
            onOpenChannelPicker={handleOpenChannelPicker}
            currentUser={user}
            onLogout={handleLogout}
          />

      {/* Sync Status Banner */}
      {syncMessage && (
        <div 
          className={`max-w-5xl mx-auto w-full px-4 lg:px-6 mt-3 animate-in fade-in slide-in-from-top-2 duration-300`}
        >
          <div className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            syncMessage.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}>
            <span className="leading-relaxed">{syncMessage.text}</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleOpenChannelPicker}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                채널 선택
              </button>
              <button 
                onClick={() => setSyncMessage(null)}
                className="px-2 py-1 rounded bg-black/40 hover:bg-black/60 text-zinc-300 text-xs transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Focused on 100k Goal & Today's Journal System */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* 1. 🥈 10만 실버버튼 목표 마일스톤 트래커 (중간 기착지 & 스트릭 포함) */}
        <section id="goal-section" aria-label="10만 실버버튼 마일스톤 목표 트래커">
          <GoalTracker
            profile={profile}
            currentRecord={latestRecord}
            records={records}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </section>

        {/* 2. 📈 크리에이터 일지 기반 구독자 성장 선그래프 (첫 일지 ~ 마지막 일지) */}
        <section id="chart-section" aria-label="일지 기반 구독자 성장 곡선">
          <GrowthTrendChart
            records={records}
            targetSubs={100000}
            onSelectDate={(dateStr) => {
              setCalendarSelectedDate(dateStr);
              const el = document.getElementById('journal-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        </section>

        {/* 3. ✍️ 오늘의 일지 시스템 (날짜 설정, 오늘 구독자, 오늘 감정, 일지 작성 & 타임라인) */}
        <section id="journal-section" aria-label="크리에이터 데일리 일지 시스템">
          <CreatorJournal
            records={records}
            onSaveRecord={handleSaveJournalRecord}
            onDeleteRecord={handleDeleteRecord}
            onOpenEmotionCalendar={() => setIsEmotionCalendarOpen(true)}
            externalSelectedDate={calendarSelectedDate}
          />
        </section>

      </main>

      {/* Clean Minimal Footer (with extra padding on mobile for bottom dock) */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 px-4 py-5 pb-24 md:pb-5 mt-10 text-center text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">{profile.channelName}</span>
            <span>•</span>
            <span>10만 실버버튼 크리에이터 데일리 일지 스튜디오</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Supabase Cloud DB 연동됨
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Quick Action Bar (Only visible on mobile screens) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/92 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-2 pb-safe md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.7)]"
        aria-label="모바일 빠른 이동 메뉴"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('journal-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-zinc-400 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
          >
            <PenSquare className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300">오늘 일지</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('goal-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-zinc-400 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <Target className="w-5 h-5 mb-0.5 text-zinc-300" />
            <span className="text-[10px] font-medium text-zinc-400">10만 목표</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('chart-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-zinc-400 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <TrendingUp className="w-5 h-5 mb-0.5 text-zinc-300" />
            <span className="text-[10px] font-medium text-zinc-400">성장 차트</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEmotionCalendarOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-zinc-400 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <Calendar className="w-5 h-5 mb-0.5 text-zinc-300" />
            <span className="text-[10px] font-medium text-zinc-400">감정 달력</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-zinc-400 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <Settings className="w-5 h-5 mb-0.5 text-zinc-300" />
            <span className="text-[10px] font-medium text-zinc-400">설정</span>
          </button>
        </div>
      </nav>

      {/* Separated Monthly Emotion Calendar Modal */}
      <EmotionCalendarModal
        isOpen={isEmotionCalendarOpen}
        onClose={() => setIsEmotionCalendarOpen(false)}
        records={records}
        onSelectDate={(dateStr) => {
          setCalendarSelectedDate(dateStr);
          setIsEmotionCalendarOpen(false);
          const el = document.getElementById('journal-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 180, behavior: 'smooth' });
          }
        }}
      />

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        records={records}
        onUpdateProfile={handleUpdateProfile}
        onImportData={handleImportData}
        onResetSampleData={handleResetSampleData}
      />

      {/* YouTube Channel Picker Modal */}
      <ChannelPickerModal
        isOpen={isChannelPickerOpen}
        onClose={() => setIsChannelPickerOpen(false)}
        onSelect={(channel) => executeSyncWithChannel(channel, currentOAuthToken)}
        detectedChannels={detectedChannels}
        token={currentOAuthToken}
      />
    </div>
  )}
</AuthGate>
  );
}
