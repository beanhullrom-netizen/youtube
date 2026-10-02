import React from 'react';
import { ChannelProfile, DailyRecord } from '../types';
import { 
  TvMinimalPlay, 
  PlusCircle, 
  Settings, 
  Flame, 
  Calendar, 
  Users, 
  TrendingUp,
  RotateCcw,
  Loader2,
  RefreshCw
} from 'lucide-react';

import { calculateStreak } from '../utils/streak';

interface HeaderProps {
  profile: ChannelProfile;
  latestRecord: DailyRecord | null;
  records?: DailyRecord[];
  onOpenRecordModal?: (record?: DailyRecord) => void;
  onOpenEmotionCalendar?: () => void;
  onOpenSettings: () => void;
  onResetSampleData: () => void;
  onSyncYouTube: () => void;
  isSyncingYouTube?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  latestRecord,
  records = [],
  onOpenRecordModal,
  onOpenEmotionCalendar,
  onOpenSettings,
  onResetSampleData,
  onSyncYouTube,
  isSyncingYouTube = false,
}) => {
  const streak = calculateStreak(records);

  // Format today's date in Korean: e.g. 2026. 9. 26. 토요일
  const todayDateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Brand & Channel Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-lg shadow-red-600/25 ring-1 ring-white/20">
            <TvMinimalPlay className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950" title="실시간 기록 모드" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                {profile.channelName}
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                  스튜디오
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span>{profile.creatorName}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{profile.category}</span>
              <span className="text-zinc-600">•</span>
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <Calendar className="w-3 h-3 text-zinc-500" />
                {todayDateStr}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Quick Stats */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {/* Streak Badge */}
          {streak.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-400 shadow-sm" title={streak.message}>
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span>{streak.currentStreak}일 연속</span>
            </div>
          )}

          {/* Quick status summary chip */}
          {latestRecord && (
            <div className="hidden md:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1 text-zinc-400">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>채널 구독자:</span>
                <span className="font-bold text-white ml-0.5">{(latestRecord ? latestRecord.todaySubs : (profile.currentSubs || 0)).toLocaleString()}명</span>
              </div>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {latestRecord.date === new Date().toISOString().slice(0, 10) ? '오늘' : `${latestRecord.date} 마감`} +{latestRecord.subsGained.toLocaleString()}명
                </span>
              </div>
            </div>
          )}

          {/* Monthly Emotion Calendar Button (Separated UI) */}
          {onOpenEmotionCalendar && (
            <button
              onClick={onOpenEmotionCalendar}
              className="flex items-center gap-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 text-xs font-semibold px-3 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              title="월간 감정 캘린더 열기"
            >
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">감정 달력</span>
            </button>
          )}

          <button
            onClick={onSyncYouTube}
            disabled={isSyncingYouTube}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-red-400 hover:text-red-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-red-500/30 hover:border-red-500/50 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="YouTube Analytics API로 최근 통계 자동 동기화"
          >
            {isSyncingYouTube ? (
              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
            ) : (
              <svg className="w-4 h-4 fill-red-500" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            )}
            <span className="hidden sm:inline font-medium">유튜브 동기화</span>
            <span className="sm:hidden font-medium">동기화</span>
          </button>

          <button
            onClick={() => {
              if (onOpenRecordModal) onOpenRecordModal();
              window.scrollTo({ top: 100, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-red-600/20 transition-all active:scale-95 cursor-pointer"
            title="오늘의 일지 작성 영역으로 이동"
          >
            <PlusCircle className="w-4 h-4" />
            <span>오늘 일지 쓰기</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium px-3 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            title="스튜디오 설정 및 백업"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">설정</span>
          </button>

          <button
            onClick={onResetSampleData}
            className="p-2.5 text-zinc-500 hover:text-zinc-300 bg-zinc-900/60 hover:bg-zinc-800 rounded-xl border border-zinc-800/80 transition-colors cursor-pointer"
            title="기본 샘플 데이터로 복원"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
