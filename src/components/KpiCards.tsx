import React, { useState } from 'react';
import { DailyRecord } from '../types';
import { 
  Users, 
  Eye, 
  Percent, 
  MessageSquareHeart, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Edit3, 
  Check, 
  HelpCircle,
  Zap,
  Info,
  Video,
  Film,
  Rocket,
  Flame
} from 'lucide-react';

interface KpiCardsProps {
  currentRecord: DailyRecord | null;
  previousRecord: DailyRecord | null;
  allRecords?: DailyRecord[];
  onQuickSaveNote: (note: string) => void;
  onOpenRecordModal: (record?: DailyRecord) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  currentRecord,
  previousRecord,
  allRecords = [],
  onQuickSaveNote,
  onOpenRecordModal,
}) => {

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(currentRecord?.note || '');
  const [showConversionInfo, setShowConversionInfo] = useState(false);

  // Sync draft when current record changes
  React.useEffect(() => {
    setNoteDraft(currentRecord?.note || '');
  }, [currentRecord?.note]);

  const handleSaveNote = () => {
    onQuickSaveNote(noteDraft);
    setIsEditingNote(false);
  };

  // Calculate average views across all records to detect if this date is an outlier (must be at top level)
  const avgViews = React.useMemo(() => {
    const valid = allRecords.filter(r => r.views > 0);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((acc, r) => acc + r.views, 0) / valid.length);
  }, [allRecords]);


  if (!currentRecord) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
        <p>기록된 데이터가 없습니다. 상단의 '오늘 수치 기록하기' 버튼을 눌러 첫 기록을 시작해보세요!</p>
      </div>
    );
  }

  const { todaySubs, yesterdaySubs, subsGained, views, conversionRate, note, uploadedVideoTitle, uploadedVideoType } = currentRecord;

  // Percentage growth of subs
  const subsGrowthPct = yesterdaySubs > 0 
    ? ((subsGained / yesterdaySubs) * 100).toFixed(2)
    : '0.00';

  // Compare views with yesterday's views if previous record exists
  const prevViews = previousRecord ? previousRecord.views : 0;
  const viewsDiff = prevViews > 0 ? views - prevViews : 0;
  const viewsGrowthPct = prevViews > 0 ? ((viewsDiff / prevViews) * 100).toFixed(1) : null;

  // Conversion rate tier benchmark assessment
  let conversionTier = {
    label: '보통',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    desc: '평균 수준 (유튜브 기준 일반적)',
    icon: Sparkles,
  };
  if (conversionRate >= 1.5) {
    conversionTier = {
      label: '최상위급 (1.5%+)',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      desc: '상위 5% 급성장 채널 전환율 🔥',
      icon: Zap,
    };
  } else if (conversionRate >= 1.0) {
    conversionTier = {
      label: '매우 우수 (1.0%+)',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      desc: '시청자 유입 대비 강력한 구독 유도 성과',
      icon: Sparkles,
    };
  } else if (conversionRate >= 0.5) {
    conversionTier = {
      label: '우수 (0.5%+)',
      badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      desc: '안정적인 팬 전환 흐름 유지 중',
      icon: Sparkles,
    };
  } else {
    conversionTier = {
      label: '보완 추천 (<0.5%)',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      desc: '영상 후반부 구독 유도(CTA) 및 썸네일 점검 추천',
      icon: Info,
    };
  }

  // Subs per 1000 views
  const subsPerK = views > 0 ? ((subsGained / views) * 1000).toFixed(1) : '0';


  const viewMultiplier = avgViews > 0 && views > 0 ? Number((views / avgViews).toFixed(2)) : 1;
  const isSuperOutlier = viewMultiplier >= 2.0;
  const isOutlier = viewMultiplier >= 1.4 && !isSuperOutlier;

  // Check date relationships
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yesterdayObj = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;

  const isToday = currentRecord.date === todayStr;
  const isYesterday = currentRecord.date === yesterdayStr;
  const dateBadgeLabel = isToday ? '오늘' : isYesterday ? '어제' : currentRecord.date;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">


      {/* 1. 구독자 현황: 전일 vs 당일 & 늘어난 구독자수 한눈에 보기 */}
      <div className="relative group bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg shadow-black/40 transition-all flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-red-600/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              1. 구독자 현황
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                공식 확정 집계
              </span>
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Subscribers Main Number */}
          <div className="mt-1">
            <div className="text-xs text-zinc-400 font-medium">
              <span>{currentRecord.date} 마감 구독자</span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1 mt-0.5">
              {todaySubs.toLocaleString()}
              <span className="text-sm font-semibold text-zinc-400">명</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 shrink-0 text-red-400" />
              <span>YouTube Analytics API 공식 데이터</span>
            </p>
          </div>

          {/* Yesterday vs Today visual comparison & Net gain */}
          <div className="mt-3.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">전일 마감 구독자</span>
              <span className="font-medium text-zinc-300">{yesterdaySubs.toLocaleString()}명</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">당일 마감 구독자</span>
              <span className="font-semibold text-white">{todaySubs.toLocaleString()}명</span>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">늘어난 구독자 (순증)</span>
              <div className={`flex items-center gap-1 text-sm font-bold ${subsGained >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {subsGained >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>+{subsGained.toLocaleString()}명</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    <span>{subsGained.toLocaleString()}명</span>
                  </>
                )}
                <span className="text-[11px] font-normal text-zinc-400 ml-0.5">
                  ({subsGrowthPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/40">
          <span>전일 대비 순증가율</span>
          <span className="text-emerald-400 font-medium">+{subsGrowthPct}% 상승</span>
        </div>
      </div>

      {/* 2. 일일 전체 조회수 */}
      <div className="relative group bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg shadow-black/40 transition-all flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-600/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                2. 일일 전체 조회수
              </span>
              {isSuperOutlier && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black flex items-center gap-1 shadow-sm shadow-red-600/30">
                  <Rocket className="w-3 h-3" />
                  <span>{viewMultiplier}x 초대박</span>
                </span>
              )}
              {isOutlier && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>{viewMultiplier}x 급상승</span>
                </span>
              )}
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>


          {/* Views Main Number */}
          <div className="mt-1">
            <div className="text-xs text-zinc-400 font-medium">
              일일 전체 조회수 ({currentRecord.date})
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1 mt-0.5">
              {views.toLocaleString()}
              <span className="text-sm font-semibold text-zinc-400">회</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 shrink-0 text-blue-400" />
              <span>YouTube Analytics 공식 확정 집계</span>
            </p>
          </div>

          {/* Comparison box */}
          <div className="mt-3.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">전일 조회수</span>
              <span className="font-medium text-zinc-300">
                {prevViews > 0 ? `${prevViews.toLocaleString()}회` : '이전 데이터 없음'}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">전일 대비 변동</span>
              {prevViews > 0 && viewsGrowthPct !== null ? (
                <div className={`flex items-center gap-1 text-xs font-bold ${viewsDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {viewsDiff >= 0 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{viewsDiff.toLocaleString()}회</span>
                      <span className="text-[10px] text-zinc-400">({viewsGrowthPct}%)</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>{viewsDiff.toLocaleString()}회</span>
                      <span className="text-[10px] text-zinc-400">({viewsGrowthPct}%)</span>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-xs text-zinc-500">기준일 비교</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/40">
          <span>조회수당 구독 생성</span>
          <span className="text-blue-400 font-medium">1,000뷰당 {subsPerK}명</span>
        </div>
      </div>

      {/* 3. 조회수 대비 구독자수와 구독전환율 */}
      <div className="relative group bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg shadow-black/40 transition-all flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              3. 구독 전환율
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowConversionInfo(!showConversionInfo)}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="구독 전환율 계산식 안내"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Conversion Rate Main Number */}
          <div className="mt-1">
            <div className="text-xs text-zinc-400 font-medium">조회수 대비 전환율</div>
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1 mt-0.5">
              {conversionRate.toFixed(2)}
              <span className="text-xl font-bold text-emerald-400">%</span>
            </div>
          </div>

          {/* Formula / Benchmark breakdown */}
          <div className="mt-4 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">유입 구독자</span>
              <span className="font-semibold text-emerald-400">+{subsGained.toLocaleString()}명</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">당일 총 조회수</span>
              <span className="font-medium text-zinc-300">{views.toLocaleString()}회</span>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">1,000회 조회당</span>
              <span className="text-xs font-bold text-white bg-zinc-800/90 px-2 py-0.5 rounded-md border border-zinc-700">
                {subsPerK}명 유입
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-zinc-800/40">
          <div className={`text-[11px] px-2 py-1 rounded-lg border flex items-center justify-between font-medium ${conversionTier.badgeClass}`}>
            <span className="flex items-center gap-1">
              <conversionTier.icon className="w-3 h-3" />
              {conversionTier.label}
            </span>
            <span className="text-[10px] opacity-80">유튜브 상위권</span>
          </div>
        </div>

        {/* Modal tooltip overlay if clicked Help */}
        {showConversionInfo && (
          <div className="absolute inset-0 bg-zinc-950/95 p-4 rounded-2xl flex flex-col justify-between z-10 text-xs">
            <div>
              <div className="font-bold text-white flex items-center justify-between mb-2">
                <span>구독 전환율 계산 공식</span>
                <button 
                  onClick={() => setShowConversionInfo(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-2 font-mono bg-zinc-900 p-2 rounded border border-zinc-800 text-[11px]">
                (신규 구독자 / 당일 조회수) × 100%
              </p>
              <div className="space-y-1 text-zinc-400 text-[11px]">
                <p>• <strong className="text-zinc-200">0.5% 이하:</strong> 일반적 평균</p>
                <p>• <strong className="text-zinc-200">0.5% ~ 1.0%:</strong> 매우 우수한 전환</p>
                <p>• <strong className="text-zinc-200">1.5% 이상:</strong> 상위 5% 초고효율 급성장!</p>
              </div>
            </div>
            <button
              onClick={() => setShowConversionInfo(false)}
              className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg font-medium"
            >
              닫기
            </button>
          </div>
        )}
      </div>

      {/* 4. 그날의 한마디 (Today's Word) - Clean without tags clutter */}
      <div className="relative group bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg shadow-black/40 transition-all flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-purple-600/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              4. 그날의 한마디
            </span>
            <div className="flex items-center gap-1">
              {!isEditingNote ? (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="한마디 바로 수정"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSaveNote}
                  className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  title="저장"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <MessageSquareHeart className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Today's Note Content */}
          <div className="mt-2 min-h-[95px]">
            {isEditingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="오늘 영상 성과나 느낀 점, 내일 할 일을 적어보세요..."
                  className="w-full text-xs bg-zinc-950 border border-purple-500/50 rounded-xl p-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none h-20"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setNoteDraft(note);
                      setIsEditingNote(false);
                    }}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="text-[11px] bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-0.5 rounded-md font-medium cursor-pointer"
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingNote(true)} 
                className="cursor-pointer group/note p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 hover:border-purple-500/40 transition-colors h-full flex flex-col justify-between"
              >
                <p className="text-xs text-zinc-200 leading-relaxed line-clamp-3 italic">
                  "{note || '아직 작성된 일지가 없습니다. 여기를 클릭하여 오늘의 한마디를 적어보세요 ✍️'}"
                </p>
                <span className="text-[10px] text-zinc-500 group-hover/note:text-purple-400 flex items-center gap-1 mt-2">
                  <Edit3 className="w-2.5 h-2.5" /> {note ? '클릭하여 일지 수정' : '클릭하여 일지 작성'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Video info if any, clean without noisy tags */}
        <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 truncate max-w-[190px]">
            {uploadedVideoType === 'shorts' ? (
              <span className="flex items-center gap-1 text-rose-400 font-semibold shrink-0">
                <Film className="w-3 h-3" /> 쇼츠:
              </span>
            ) : uploadedVideoType === 'long' ? (
              <span className="flex items-center gap-1 text-blue-400 font-semibold shrink-0">
                <Video className="w-3 h-3" /> 롱폼:
              </span>
            ) : (
              <span className="text-zinc-500">업로드 없음</span>
            )}
            {uploadedVideoTitle && (
              <span className="text-zinc-300 truncate" title={uploadedVideoTitle}>
                {uploadedVideoTitle}
              </span>
            )}
          </div>
          <span className="text-[10px] text-purple-400 font-medium shrink-0">
            데일리 회고
          </span>
        </div>
      </div>

    </div>
  );
};
