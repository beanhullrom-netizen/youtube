import React, { useState, useEffect, useMemo } from 'react';
import { DailyRecord } from '../types';
import { getDaysDiff, formatRecordGainInfo } from '../utils/recordChaining';
import { 
  Calendar, 
  Users, 
  Smile, 
  Sparkles, 
  Save, 
  Check, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Film, 
  Plus, 
  Clock, 
  Flame, 
  Rocket, 
  Zap, 
  HelpCircle, 
  Coffee, 
  HeartHandshake
} from 'lucide-react';

interface CreatorJournalProps {
  records: DailyRecord[];
  onSaveRecord: (record: DailyRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenEmotionCalendar?: () => void;
  externalSelectedDate?: string | null;
}

// Preset creator emotions with vibrant styling
export const EMOTION_PRESETS = [
  { 
    id: 'passion', 
    emoji: '🔥', 
    label: '열정 폭발', 
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25',
    activeClass: 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
  },
  { 
    id: 'proud', 
    emoji: '😊', 
    label: '보람 & 뿌듯', 
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25',
    activeClass: 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
  },
  { 
    id: 'excited', 
    emoji: '🚀', 
    label: '기대 & 설렘', 
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25',
    activeClass: 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
  },
  { 
    id: 'pondering', 
    emoji: '🤔', 
    label: '고민 & 연구', 
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25',
    activeClass: 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
  },
  { 
    id: 'slump', 
    emoji: '😰', 
    label: '불안 & 슬럼프', 
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40 hover:bg-purple-500/25',
    activeClass: 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
  },
  { 
    id: 'tired', 
    emoji: '😴', 
    label: '방전 & 휴식', 
    badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600 hover:bg-zinc-700/50',
    activeClass: 'bg-zinc-700 text-white border-zinc-500 shadow-md'
  },
  { 
    id: 'celebrate', 
    emoji: '🎉', 
    label: '대박 & 환호', 
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/25',
    activeClass: 'bg-yellow-500 text-black border-yellow-400 font-bold shadow-md shadow-yellow-500/30'
  },
];

export const CreatorJournal: React.FC<CreatorJournalProps> = ({
  records,
  onSaveRecord,
  onDeleteRecord,
  onOpenEmotionCalendar,
  externalSelectedDate,
}) => {
  // Format today's date in local YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [todaySubs, setTodaySubs] = useState<number>(0);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('🔥 열정 폭발');
  const [customEmotion, setCustomEmotion] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emotionFilter, setEmotionFilter] = useState<string>('all');

  // Synchronize when external date is picked from Emotion Calendar modal
  useEffect(() => {
    if (externalSelectedDate) {
      setSelectedDate(externalSelectedDate);
    }
  }, [externalSelectedDate]);

  // Find existing record for the selected date
  const existingRecordForDate = useMemo(() => {
    return records.find((r) => r.date === selectedDate) || null;
  }, [records, selectedDate]);

  // Find the closest previous record before selectedDate
  const previousRecordForDate = useMemo(() => {
    const prior = records
      .filter((r) => r.date < selectedDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    return prior[0] || null;
  }, [records, selectedDate]);

  // Find closest next record if entering an earlier historical record
  const nextRecordForDate = useMemo(() => {
    const later = records
      .filter((r) => r.date > selectedDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    return later[0] || null;
  }, [records, selectedDate]);

  // Check if this date has no preceding records (first baseline)
  const isDateBaseline = !previousRecordForDate && (!existingRecordForDate || Boolean(existingRecordForDate.isInitialBaseline));

  // Calendar days gap from previous record
  const daysDiffForDate = useMemo(() => {
    if (!previousRecordForDate) return 0;
    return Math.max(1, getDaysDiff(previousRecordForDate.date, selectedDate));
  }, [previousRecordForDate, selectedDate]);

  // Populate form fields whenever selectedDate or records change
  useEffect(() => {
    if (existingRecordForDate) {
      setTodaySubs(existingRecordForDate.todaySubs);
      setNoteContent(existingRecordForDate.note || '');
      setVideoTitle(existingRecordForDate.uploadedVideoTitle || '');
      
      const foundPreset = EMOTION_PRESETS.find(p => `${p.emoji} ${p.label}` === existingRecordForDate.emotion);
      if (foundPreset) {
        setSelectedEmotion(`${foundPreset.emoji} ${foundPreset.label}`);
        setCustomEmotion('');
      } else if (existingRecordForDate.emotion) {
        setSelectedEmotion('custom');
        setCustomEmotion(existingRecordForDate.emotion);
      } else {
        setSelectedEmotion('🔥 열정 폭발');
        setCustomEmotion('');
      }
    } else {
      // If no record exists for this date, default todaySubs sensibly based on neighbors
      const fallbackSubs = previousRecordForDate?.todaySubs 
        || nextRecordForDate?.todaySubs 
        || (records.length > 0 ? records[records.length - 1].todaySubs : 87300);
      setTodaySubs(fallbackSubs);
      setNoteContent('');
      setVideoTitle('');
      setSelectedEmotion('🔥 열정 폭발');
      setCustomEmotion('');
    }
  }, [selectedDate, existingRecordForDate, previousRecordForDate, nextRecordForDate]);

  // Yesterday subs benchmark
  const yesterdaySubs = useMemo(() => {
    if (previousRecordForDate) {
      return previousRecordForDate.todaySubs;
    }
    if (existingRecordForDate) {
      return existingRecordForDate.yesterdaySubs;
    }
    return todaySubs;
  }, [previousRecordForDate, existingRecordForDate, todaySubs]);

  // Real-time calculated net gain
  const liveNetGain = useMemo(() => {
    if (isDateBaseline) return 0;
    return todaySubs - yesterdaySubs;
  }, [isDateBaseline, todaySubs, yesterdaySubs]);

  // Real-time average daily gain if diff > 1
  const liveAvgGain = useMemo(() => {
    if (daysDiffForDate > 1) {
      return Math.round(liveNetGain / daysDiffForDate);
    }
    return liveNetGain;
  }, [daysDiffForDate, liveNetGain]);

  // Handle date stepping
  const changeDateByDays = (delta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + delta);
    const nextDateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
    setSelectedDate(nextDateStr);
  };

  const handleSetToday = () => {
    setSelectedDate(getTodayStr());
  };

  // Handle Form Submission
  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();

    const finalEmotion = selectedEmotion === 'custom' 
      ? (customEmotion.trim() || '😊 기록') 
      : selectedEmotion;

    const baseRecord: DailyRecord = existingRecordForDate || {
      id: `rec-${selectedDate}`,
      date: selectedDate,
      yesterdaySubs: isDateBaseline ? todaySubs : yesterdaySubs,
      todaySubs,
      subsGained: liveNetGain,
      daysDiff: daysDiffForDate,
      avgDailyGain: liveAvgGain,
      isInitialBaseline: isDateBaseline,
      views: 0,
      conversionRate: 0,
      estimatedRevenue: 0,
      revenueStatus: 'settled',
      note: '',
      updatedAt: new Date().toISOString(),
    };

    const updated: DailyRecord = {
      ...baseRecord,
      yesterdaySubs: isDateBaseline ? todaySubs : yesterdaySubs,
      todaySubs,
      subsGained: liveNetGain,
      daysDiff: daysDiffForDate,
      avgDailyGain: liveAvgGain,
      isInitialBaseline: isDateBaseline,
      emotion: finalEmotion,
      uploadedVideoTitle: videoTitle.trim() || undefined,
      note: noteContent.trim() || `${finalEmotion} - 오늘 하루 기록 완료`,
      updatedAt: new Date().toISOString(),
    };

    onSaveRecord(updated);

    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
    }, 2500);
  };

  // Format date readable in Korean (e.g. 2026년 9월 27일 일요일)
  const formatReadableDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // Filtered timeline feed
  const timelineRecords = useMemo(() => {
    return records
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((r) => {
        const matchesSearch = 
          (r.note && r.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (r.uploadedVideoTitle && r.uploadedVideoTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
          r.date.includes(searchQuery);

        const matchesEmotion = 
          emotionFilter === 'all' || 
          (r.emotion && r.emotion.includes(emotionFilter));

        return matchesSearch && matchesEmotion;
      });
  }, [records, searchQuery, emotionFilter]);

  return (
    <div className="space-y-6">
      
      {/* 1. 오늘의 일지 작성기 카드 */}
      <div className="bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-36 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Form Title & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Edit3 className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                크리에이터 데일리 일지 작성
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              오늘의 구독자 수, 나의 감정 상태, 그리고 오늘 하루의 솔직한 생각과 회고를 기록합니다.
            </p>
          </div>

          {/* Quick Date Stepper Navigation & Emotion Calendar Launcher */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {onOpenEmotionCalendar && (
              <button
                type="button"
                onClick={onOpenEmotionCalendar}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="월간 감정 캘린더 모달 열기"
              >
                <Smile className="w-4 h-4 text-purple-400" />
                <span>월간 감정 캘린더</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-1.5">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="어제 날짜로 이동"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white px-2 py-1 focus:outline-none border-0 cursor-pointer"
              />

              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="내일 날짜로 이동"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {selectedDate !== getTodayStr() && (
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="text-[11px] font-bold px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg ml-1 transition-colors cursor-pointer"
                >
                  오늘로
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Editor Form */}
        <form onSubmit={handleSaveJournal} className="mt-6 space-y-6">
          
          {/* Row 1: Subscriber Count & Live Net Gain */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Today Subs Input */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-red-400" />
                  <span>오늘 구독자 수</span>
                  <span className="text-red-400">*</span>
                </label>
                <span className="text-[11px] text-zinc-400">
                  {previousRecordForDate ? (
                    <>
                      직전({previousRecordForDate.date}): <strong>{previousRecordForDate.todaySubs.toLocaleString()}명</strong>
                    </>
                  ) : (
                    <span className="text-emerald-400 font-semibold">🚩 최초 기록 기준점</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={todaySubs || ''}
                    onChange={(e) => setTodaySubs(Number(e.target.value))}
                    required
                    placeholder="예: 87300"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-base font-bold text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                    명
                  </span>
                </div>

                {/* Quick Add Sub Buttons */}
                <div className="flex items-center gap-1">
                  {[10, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTodaySubs((prev) => (prev || 0) + num)}
                      className="text-[11px] font-semibold px-2 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Net Gain Status Pill */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-400">
                  {isDateBaseline
                    ? '기준점 구분:'
                    : daysDiffForDate > 1
                      ? `늘어난 구독자 (${daysDiffForDate}일간 누적):`
                      : '늘어난 구독자 (전일 대비):'}
                </span>
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  isDateBaseline
                    ? 'text-emerald-400'
                    : liveNetGain >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {isDateBaseline ? (
                    <span>🚩 시작 기준점 (순증 0)</span>
                  ) : liveNetGain >= 0 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{liveNetGain.toLocaleString()}명</span>
                      {daysDiffForDate > 1 && (
                        <span className="text-[10px] text-zinc-400 font-normal ml-1">
                          (일평균 +{liveAvgGain.toLocaleString()}명)
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>{liveNetGain.toLocaleString()}명</span>
                      {daysDiffForDate > 1 && (
                        <span className="text-[10px] text-zinc-400 font-normal ml-1">
                          (일평균 {liveAvgGain.toLocaleString()}명)
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Optional Topic or Video Title */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-amber-400" />
                <span>오늘 다룬 주제 / 영상 제목 (선택)</span>
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="예: 신규 기획 영상 업로드 완료 / 쇼츠 대본 작성"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[11px] text-zinc-500">
                오늘 채널을 위해 작업한 영상이나 주요 작업 내용을 남겨두면 나중에 성장을 회고할 때 큰 도움이 됩니다.
              </p>
            </div>
          </div>

          {/* Row 2: Today's Emotion Selector */}
          <div className="p-4.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-emerald-400" />
                <span>오늘 나의 감정 상태</span>
                <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-zinc-400">
                선택된 감정: <strong className="text-zinc-200">{selectedEmotion === 'custom' ? (customEmotion || '직접 입력') : selectedEmotion}</strong>
              </span>
            </div>

            {/* Emotion Preset Chips */}
            <div className="flex flex-wrap gap-2">
              {EMOTION_PRESETS.map((preset) => {
                const isSelected = selectedEmotion === `${preset.emoji} ${preset.label}`;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedEmotion(`${preset.emoji} ${preset.label}`);
                      setCustomEmotion('');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                      isSelected ? preset.activeClass : preset.badgeClass
                    }`}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}

              {/* Custom Emotion Button */}
              <button
                type="button"
                onClick={() => setSelectedEmotion('custom')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  selectedEmotion === 'custom' 
                    ? 'bg-zinc-700 text-white border-zinc-500' 
                    : 'bg-zinc-800/40 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                <span>✏️ 직접 입력</span>
              </button>
            </div>

            {/* Custom Emotion Input if selected */}
            {selectedEmotion === 'custom' && (
              <div className="pt-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  value={customEmotion}
                  onChange={(e) => setCustomEmotion(e.target.value)}
                  placeholder="오늘의 감정을 자유롭게 적어보세요 (예: ⚡ 묘한 긴장감, ☕ 차분한 집중)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Row 3: Daily Journal Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-400" />
                <span>오늘의 일지 & 한마디 회고</span>
                <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">
                {noteContent.length}자 작성 중
              </span>
            </div>

            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="오늘 유튜브 채널을 운영하며 어떤 감정을 느꼈나요? 댓글 반응, 조회수 변화, 겪었던 고민이나 내일 꼭 해보고 싶은 시도를 솔직하게 적어보세요."
              className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500/80 rounded-2xl p-4 text-xs sm:text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors leading-relaxed resize-y"
            />
          </div>

          {/* Bottom Save Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-zinc-400">
              <span>기록 기준일: </span>
              <strong className="text-white">{formatReadableDate(selectedDate)}</strong>
            </div>

            <div className="flex items-center gap-3">
              {isSavedFeedback && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in duration-200">
                  <Check className="w-4 h-4" />
                  일지 저장 완료!
                </span>
              )}

              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>일지 저장하기</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. 지난 일지 모아보기 / 타임라인 피드 */}
      <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
        
        {/* Feed Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span>크리에이터 일지 히스토리</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                총 {records.length}일의 기록
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              과거의 일지 카드를 누르면 해당 날짜로 바로 이동하여 수정할 수 있습니다.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="일지 내용, 날짜 검색..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Emotion Quick Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setEmotionFilter('all')}
            className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
              emotionFilter === 'all' 
                ? 'bg-zinc-200 text-black font-bold' 
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            전체 보기 ({records.length})
          </button>
          {EMOTION_PRESETS.map((preset) => {
            const count = records.filter(r => r.emotion && r.emotion.includes(preset.label)).length;
            if (count === 0) return null;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setEmotionFilter(preset.label)}
                className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                  emotionFilter === preset.label
                    ? 'bg-zinc-200 text-black font-bold'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{preset.emoji}</span>
                <span>{preset.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Timeline Cards Grid */}
        {timelineRecords.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            검색 결과 또는 저장된 일지가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timelineRecords.map((record) => {
              const isSelected = record.date === selectedDate;
              const gainInfo = formatRecordGainInfo(record);

              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedDate(record.date)}
                  className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-zinc-850/90 border-red-500/60 ring-1 ring-red-500/40 shadow-lg shadow-red-500/10' 
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50'
                  }`}
                >
                  {/* Top Bar: Date & Emotion */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white font-mono">
                          {record.date}
                        </span>
                        {record.emotion && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
                            {record.emotion}
                          </span>
                        )}
                        {/* Gap tag if 2 or more days gap */}
                        {gainInfo.tag && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {gainInfo.tag}
                          </span>
                        )}
                        {/* Baseline tag if earliest entry */}
                        {gainInfo.isBaseline && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            🚩 기록 시작점
                          </span>
                        )}
                      </div>

                      {/* Subs & Net Gain Tag */}
                      <div className="flex flex-col items-end gap-0.5 text-xs font-mono shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">
                            {record.todaySubs.toLocaleString()}명
                          </span>
                          {!gainInfo.isBaseline ? (
                            <span className={`text-[11px] font-bold ${
                              gainInfo.isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {gainInfo.gainBadgeText}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded font-sans">
                              시작 기준
                            </span>
                          )}
                        </div>
                        {gainInfo.subText && (
                          <span className="text-[10px] text-zinc-400 font-sans">
                            {gainInfo.subText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Video Title Tag if exists */}
                    {record.uploadedVideoTitle && (
                      <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl mb-2 flex items-center gap-1.5 truncate">
                        <Film className="w-3 h-3 shrink-0 text-amber-400" />
                        <span className="truncate">{record.uploadedVideoTitle}</span>
                      </div>
                    )}

                    {/* Note Content */}
                    <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3 my-1">
                      "{record.note || '작성된 일지가 없습니다.'}"
                    </p>
                  </div>

                  {/* Card Bottom: Edit / Delete */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                    <span className="text-[10px]">
                      {isSelected ? '현재 수정 중인 일지' : '클릭하여 일지 불러오기'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(record.date);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        title="일지 수정하기"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {records.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`${record.date} 일지를 정말 삭제하시겠습니까?`)) {
                              onDeleteRecord(record.id);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 transition-colors"
                          title="일지 삭제하기"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
