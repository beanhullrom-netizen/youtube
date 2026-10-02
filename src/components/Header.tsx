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
  RefreshCw,
  LogOut
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
  onOpenChannelPicker?: () => void;
  currentUser?: { email: string; name: string; picture: string } | null;
  onLogout?: () => void;
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
  onOpenChannelPicker,
  currentUser,
  onLogout,
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
    <header className="border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand & Channel Info Row */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-md shadow-red-600/25 ring-1 ring-white/20 shrink-0">
              <TvMinimalPlay className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950" title="실시간 기록 모드" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                  {profile.channelName}
                </h1>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium shrink-0">
                  스튜디오
                </span>
                {onOpenChannelPicker && (
                  <button
                    type="button"
                    onClick={onOpenChannelPicker}
                    className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-700/60 flex items-center gap-1"
                    title="연동할 유튜브 채널 선택 (게임덩어리 등)"
                  >
                    <span>채널 선택</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 mt-0.5 truncate">
                <span className="truncate">{profile.creatorName}</span>
                <span className="text-zinc-600 shrink-0">•</span>
                <span className="truncate hidden xs:inline">{profile.category}</span>
                <span className="text-zinc-600 shrink-0 hidden xs:inline">•</span>
                <span className="inline-flex items-center gap-1 text-zinc-400 shrink-0 text-[10px] sm:text-[11px]">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  {todayDateStr}
                </span>
              </div>
            </div>
          </div>

          {/* Streak Badge for mobile view (compact) */}
          {streak.currentStreak > 0 && (
            <div className="flex md:hidden items-center gap-1 bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/30 px-2 py-1 rounded-xl text-[11px] font-bold text-orange-400 shrink-0" title={streak.message}>
              <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
              <span>{streak.currentStreak}일</span>
            </div>
          )}
        </div>

        {/* Action Buttons & Quick Stats */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 justify-between md:justify-end flex-wrap">
          {/* Streak Badge (Desktop) */}
          {streak.currentStreak > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-400 shadow-sm" title={streak.message}>
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span>{streak.currentStreak}일 연속</span>
            </div>
          )}

          {/* Quick status summary chip */}
          {latestRecord && (
            <div className="hidden lg:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1 text-zinc-400">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>채널 구독자:</span>
                <span className="font-bold text-white ml-0.5">{(latestRecord ? latestRecord.todaySubs : (profile.currentSubs || 0)).toLocaleString()}명</span>
              </div>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {(() => { const n = new Date(); return latestRecord.date === `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })() ? '오늘' : `${latestRecord.date} 마감`} +{latestRecord.subsGained.toLocaleString()}명
                </span>
              </div>
            </div>
          )}

          {/* Secondary Action Buttons Group on Mobile */}
          <div className="flex items-center gap-1.5">
            {/* Monthly Emotion Calendar Button */}
            {onOpenEmotionCalendar && (
              <button
                type="button"
                onClick={onOpenEmotionCalendar}
                className="flex items-center justify-center gap-1 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                title="월간 감정 캘린더 열기"
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                <span className="hidden sm:inline">감정 달력</span>
              </button>
            )}

            {/* YouTube Sync Button */}
            <button
              type="button"
              onClick={onSyncYouTube}
              disabled={isSyncingYouTube}
              className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-red-400 hover:text-red-300 text-xs font-semibold px-2.5 sm:px-3.5 py-2 rounded-xl border border-red-500/30 hover:border-red-500/50 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="YouTube Analytics API로 최근 통계 자동 동기화"
            >
              {isSyncingYouTube ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-red-400" />
              ) : (
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-red-500 shrink-0" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              )}
              <span className="hidden sm:inline font-medium">유튜브 동기화</span>
              <span className="sm:hidden font-medium text-[11px]">동기화</span>
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
              title="스튜디오 설정 및 백업"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">설정</span>
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={onResetSampleData}
              className="p-2 text-zinc-500 hover:text-zinc-300 bg-zinc-900/60 hover:bg-zinc-800 rounded-xl border border-zinc-800/80 transition-colors cursor-pointer"
              title="기본 샘플 데이터로 복원"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Authenticated User & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-zinc-800/80">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-emerald-500/40 object-cover shadow-sm"
                    title={`인증된 계정: ${currentUser.email}`}
                  />
                ) : (
                  <div 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold"
                    title={`인증된 계정: ${currentUser.email}`}
                  >
                    {currentUser.name?.[0] || 'U'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 text-zinc-400 hover:text-rose-400 bg-zinc-900/60 hover:bg-rose-950/30 rounded-xl border border-zinc-800/80 hover:border-rose-500/30 transition-colors cursor-pointer"
                  title={`보안 로그아웃 (${currentUser.email})`}
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Primary CTA: Write Daily Journal Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenRecordModal) onOpenRecordModal();
              const el = document.getElementById('journal-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.scrollTo({ top: 200, behavior: 'smooth' });
              }
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md shadow-red-600/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title="오늘의 일지 작성 영역으로 이동"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>오늘 일지 쓰기</span>
          </button>
        </div>

      </div>
    </header>
  );
};
