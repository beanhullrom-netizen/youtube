/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyRecord, ChannelProfile } from './types';
import { 
  loadRecords, 
  saveRecords, 
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
import { syncRecentYouTubeData } from './services/youtubeAnalytics';

export default function App() {
  const [records, setRecords] = useState<DailyRecord[]>(() => loadRecords());
  const [profile, setProfile] = useState<ChannelProfile>(() => loadProfile());

  // Modals & Calendar state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEmotionCalendarOpen, setIsEmotionCalendarOpen] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
  const [isSyncingYouTube, setIsSyncingYouTube] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Update records in state and localStorage
  const handleUpdateRecords = (newRecords: DailyRecord[]) => {
    const chained = rechainRecords(newRecords);
    setRecords(chained);
    saveRecords(chained);
  };

  // Update profile and ensure 100k target is locked
  const handleUpdateProfile = (newProfile: ChannelProfile) => {
    const fixedProfile: ChannelProfile = { ...newProfile, targetSubs: 100000 };
    setProfile(fixedProfile);
    saveProfile(fixedProfile);
  };

  // Save or update a single journal record
  const handleSaveJournalRecord = (savedRecord: DailyRecord) => {
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

    // 상태 및 로컬 스토리지 즉각 동기화
    setRecords(chained);
    saveRecords(chained);
    setProfile(updatedProf);
    saveProfile(updatedProf);
  };

  // Delete a journal record
  const handleDeleteRecord = (id: string) => {
    const filtered = records.filter((r) => r.id !== id);
    handleUpdateRecords(filtered);
  };

  // Reset to initial sample data
  const handleResetSampleData = () => {
    if (confirm('샘플 데이터로 초기화하시겠습니까? 작성했던 기록이 초기화됩니다.')) {
      handleUpdateRecords(INITIAL_SAMPLE_RECORDS);
      handleUpdateProfile({
        ...DEFAULT_PROFILE,
        targetSubs: 100000,
        currentSubs: 87300,
      });
      setSyncMessage({
        text: '초기 샘플 데이터로 복원되었습니다.',
        type: 'success',
      });
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  // Import JSON backup data
  const handleImportData = (importedRecords: DailyRecord[], importedProfile: ChannelProfile) => {
    handleUpdateRecords(importedRecords);
    handleUpdateProfile({ ...importedProfile, targetSubs: 100000 });
  };

  // Handle YouTube Analytics Sync
  const handleSyncYouTube = async () => {
    try {
      setIsSyncingYouTube(true);
      setSyncMessage(null);
      const result = await syncRecentYouTubeData(records, 14, profile.averageRPM);
      
      // Save updated records
      handleUpdateRecords(result.updatedRecords);

      // Update profile channel title, creator name, currentSubs and keep targetSubs fixed to 100,000
      if (result.channelInfo.title) {
        const updatedProf: ChannelProfile = {
          ...profile,
          channelName: result.channelInfo.title,
          creatorName: result.channelInfo.title,
          targetSubs: 100000, // 10만 실버버튼 고정
          currentSubs: result.channelInfo.subscriberCount || 87300,
        };
        handleUpdateProfile(updatedProf);
      }

      const msg = result.syncedDaysCount > 0
        ? `🎉 유튜브 연동 완료! 채널 '${result.channelInfo.title}'의 최근 ${result.syncedDaysCount}일치 공식 데이터가 반영되었습니다.`
        : `✅ 채널 '${result.channelInfo.title}' (구독자 ${result.channelInfo.subscriberCount.toLocaleString()}명) 연동 완료!`;

      setSyncMessage({
        text: msg,
        type: 'success',
      });
      setTimeout(() => setSyncMessage(null), 8000);
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
            <span>{syncMessage.text}</span>
            <button 
              onClick={() => setSyncMessage(null)}
              className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 text-zinc-300 text-xs"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Focused on 100k Goal & Today's Journal System */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* 1. 🥈 10만 실버버튼 목표 마일스톤 트래커 (중간 기착지 & 스트릭 포함) */}
        <section aria-label="10만 실버버튼 마일스톤 목표 트래커">
          <GoalTracker
            profile={profile}
            currentRecord={latestRecord}
            records={records}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </section>

        {/* 2. 📈 크리에이터 일지 기반 구독자 성장 선그래프 (첫 일지 ~ 마지막 일지) */}
        <section aria-label="일지 기반 구독자 성장 곡선">
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

      {/* Clean Minimal Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 px-4 py-5 mt-10 text-center text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">{profile.channelName}</span>
            <span>•</span>
            <span>10만 실버버튼 크리에이터 데일리 일지 스튜디오</span>
          </div>
          <span className="text-[11px] text-zinc-600">
            목표 100,000명 달성까지 매일의 감정과 구독자를 기록하세요
          </span>
        </div>
      </footer>

      {/* Separated Monthly Emotion Calendar Modal (Feature 3) */}
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
    </div>
  );
}
