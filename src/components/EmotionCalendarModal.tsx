import React, { useState, useMemo, useEffect } from 'react';
import { DailyRecord } from '../types';
import { EMOTION_PRESETS } from './CreatorJournal';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Smile, 
  Check, 
  Clock,
  ArrowRight
} from 'lucide-react';

interface EmotionCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DailyRecord[];
  onSelectDate: (dateStr: string) => void;
}

export const EmotionCalendarModal: React.FC<EmotionCalendarModalProps> = ({
  isOpen,
  onClose,
  records,
  onSelectDate,
}) => {
  // Current viewing month (default: current date)
  const today = new Date();
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth()); // 0-indexed

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Calendar dates generation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  // Map records by YYYY-MM-DD
  const recordsMap = useMemo(() => {
    const map = new Map<string, DailyRecord>();
    for (const r of records) {
      map.set(r.date, r);
    }
    return map;
  }, [records]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const prefix = `${viewYear}-${mStr}`;
    const monthRecords = records.filter(r => r.date.startsWith(prefix));

    const totalDaysRecorded = monthRecords.length;
    const totalSubsGained = monthRecords.reduce((sum, r) => sum + (r.subsGained || 0), 0);

    // Emotion count breakdown
    const emotionCounts: Record<string, number> = {};
    for (const r of monthRecords) {
      if (r.emotion) {
        emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
      }
    }

    const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    const topEmotion = sortedEmotions[0] ? sortedEmotions[0][0] : null;

    return {
      monthRecords,
      totalDaysRecorded,
      totalSubsGained,
      sortedEmotions,
      topEmotion,
    };
  }, [records, viewYear, viewMonth]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Format today's date string for comparison (YYYY-MM-DD)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[94dvh] sm:max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>월간 감정 캘린더</span>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  기분 & 구독자 흐름
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 truncate">
                날짜별 나의 감정 상태와 구독자 변화를 한눈에 회고합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="닫기"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-5">
          
          {/* Month Stepper & Quick Stats Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800">
            {/* Stepper */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg sm:rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="이전 달"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <h3 className="text-sm sm:text-base font-extrabold text-white font-mono min-w-[100px] sm:min-w-[130px] text-center">
                {viewYear}년 {viewMonth + 1}월
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg sm:rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="다음 달"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {(viewYear !== today.getFullYear() || viewMonth !== today.getMonth()) && (
                <button
                  type="button"
                  onClick={handleResetToCurrentMonth}
                  className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors ml-1 cursor-pointer whitespace-nowrap"
                >
                  이번 달로
                </button>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-mono justify-between sm:justify-start flex-wrap">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-zinc-400">기록일:</span>
                <strong className="text-white bg-zinc-950 px-1.5 sm:px-2 py-0.5 rounded border border-zinc-800">
                  {monthlyStats.totalDaysRecorded}일
                </strong>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-zinc-400">순증:</span>
                <strong className={`px-1.5 sm:px-2 py-0.5 rounded border ${
                  monthlyStats.totalSubsGained >= 0 
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {monthlyStats.totalSubsGained >= 0 ? `+${monthlyStats.totalSubsGained}` : monthlyStats.totalSubsGained}명
                </strong>
              </div>
              {monthlyStats.topEmotion && (
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-zinc-400">주요 감정:</span>
                  <strong className="text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    {monthlyStats.topEmotion}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-950/80 border border-zinc-800/90">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[10px] sm:text-xs font-semibold text-zinc-400 pb-2 border-b border-zinc-800">
              <span className="text-rose-400">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span className="text-blue-400">토</span>
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1.5 sm:pt-2">
              {/* Empty leading padding days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[48px] xs:min-h-[56px] sm:min-h-[74px] rounded-lg sm:rounded-xl bg-zinc-900/15 border border-transparent" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const mStr = String(viewMonth + 1).padStart(2, '0');
                const dStr = String(dayNum).padStart(2, '0');
                const dateKey = `${viewYear}-${mStr}-${dStr}`;

                const record = recordsMap.get(dateKey);
                const isTodayDate = dateKey === todayStr;

                return (
                  <div
                    key={dateKey}
                    onClick={() => {
                      onSelectDate(dateKey);
                      onClose();
                    }}
                    className={`min-h-[48px] xs:min-h-[56px] sm:min-h-[74px] p-1 sm:p-2 rounded-lg sm:rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${
                      isTodayDate 
                        ? 'border-red-500 ring-1 ring-red-500/50 bg-red-950/20' 
                        : record 
                          ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-zinc-700' 
                          : 'border-zinc-900/60 bg-zinc-950/30 text-zinc-600 hover:bg-zinc-900/30'
                    }`}
                  >
                    {/* Day number & today marker */}
                    <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-mono leading-none">
                      <span className={`font-semibold ${
                        isTodayDate ? 'text-red-400 font-bold' : record ? 'text-zinc-200' : 'text-zinc-500'
                      }`}>
                        {dayNum}
                      </span>
                      {isTodayDate && (
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500" title="오늘" />
                      )}
                    </div>

                    {/* Emotion & Subs pill */}
                    {record ? (
                      <div className="flex flex-col items-center justify-center my-0.5">
                        <span className="text-sm xs:text-base sm:text-2xl leading-none select-none py-0.5 filter drop-shadow">
                          {record.emotion ? record.emotion.split(' ')[0] : '📝'}
                        </span>
                        <div className="text-[8px] xs:text-[9px] sm:text-[10px] font-mono font-bold mt-0.5 leading-none">
                          <span className={(record.subsGained ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {(record.subsGained ?? 0) >= 0 ? `+${record.subsGained ?? 0}` : record.subsGained}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-20 group-hover:opacity-60 transition-opacity">
                        <span className="text-[10px] sm:text-xs text-zinc-600">+</span>
                      </div>
                    )}

                    {/* Tooltip on hover */}
                    {record && record.note && (
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-200 shadow-xl z-20 pointer-events-none line-clamp-3">
                        <div className="font-bold text-amber-400 text-[10px] mb-0.5">{record.date} ({record.emotion || '일지'})</div>
                        "{record.note}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Emotion Breakdown pills */}
          {monthlyStats.sortedEmotions.length > 0 && (
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-1.5 sm:space-y-2">
              <span className="text-[11px] sm:text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-purple-400" />
                <span>이번 달 감정 분포 요약</span>
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-0.5">
                {monthlyStats.sortedEmotions.map(([emotion, count]) => (
                  <span
                    key={emotion}
                    className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 flex items-center gap-1 sm:gap-1.5 font-medium"
                  >
                    <span>{emotion}</span>
                    <strong className="text-purple-300 font-mono">({count}회)</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-center text-[10px] sm:text-[11px] text-zinc-500">
            * 달력의 날짜를 누르면 해당 날짜의 일지 작성기로 바로 이동하여 내용을 확인 및 수정할 수 있습니다.
          </div>
        </div>

      </div>
    </div>
  );
};
