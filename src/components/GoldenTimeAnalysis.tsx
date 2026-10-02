import React, { useMemo } from 'react';
import { DailyRecord } from '../types';
import { 
  Sparkles, 
  Clock, 
  Calendar, 
  Flame, 
  TrendingUp, 
  Video, 
  Film, 
  CheckCircle2, 
  Zap, 
  HelpCircle,
  BarChart3
} from 'lucide-react';

interface GoldenTimeAnalysisProps {
  records: DailyRecord[];
}

interface DayStats {
  dayName: string;
  dayIdx: number; // 0=Sun, 1=Mon, ..., 6=Sat
  count: number;
  totalViews: number;
  totalSubs: number;
  totalConv: number;
  avgViews: number;
  avgSubs: number;
  avgConv: number;
  score: number; // calculated golden score
}

const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const DAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

export const GoldenTimeAnalysis: React.FC<GoldenTimeAnalysisProps> = ({ records }) => {
  // Analyze by day of the week
  const dayStats = useMemo(() => {
    const buckets: Record<number, { count: number; views: number; subs: number; conv: number }> = {
      0: { count: 0, views: 0, subs: 0, conv: 0 },
      1: { count: 0, views: 0, subs: 0, conv: 0 },
      2: { count: 0, views: 0, subs: 0, conv: 0 },
      3: { count: 0, views: 0, subs: 0, conv: 0 },
      4: { count: 0, views: 0, subs: 0, conv: 0 },
      5: { count: 0, views: 0, subs: 0, conv: 0 },
      6: { count: 0, views: 0, subs: 0, conv: 0 },
    };

    records.forEach((r) => {
      const dateObj = new Date(r.date + 'T00:00:00');
      const day = dateObj.getDay();
      buckets[day].count += 1;
      buckets[day].views += r.views;
      buckets[day].subs += r.subsGained;
      buckets[day].conv += r.conversionRate;
    });

    const result: DayStats[] = Object.entries(buckets).map(([key, val]) => {
      const idx = Number(key);
      const count = val.count || 1;
      const avgViews = Math.round(val.views / count);
      const avgSubs = Math.round(val.subs / count);
      const avgConv = Number((val.conv / count).toFixed(2));
      // Score = weighted combination of views & conversion rate
      const score = (avgViews / 100) * 0.4 + avgConv * 30 + avgSubs * 0.5;

      return {
        dayName: DAY_NAMES[idx],
        dayIdx: idx,
        count: val.count,
        totalViews: val.views,
        totalSubs: val.subs,
        totalConv: val.conv,
        avgViews,
        avgSubs,
        avgConv,
        score,
      };
    });

    return result;
  }, [records]);

  // Find best days
  const sortedDays = useMemo(() => {
    return [...dayStats].sort((a, b) => b.score - a.score);
  }, [dayStats]);

  const bestDay = sortedDays[0];
  const secondBestDay = sortedDays[1];

  // Analyze video type conversion impact (Shorts vs Long-form)
  const formatStats = useMemo(() => {
    let shortsCount = 0;
    let shortsSubs = 0;
    let shortsViews = 0;

    let longCount = 0;
    let longSubs = 0;
    let longViews = 0;

    records.forEach((r) => {
      if (r.uploadedVideoType === 'shorts') {
        shortsCount++;
        shortsSubs += r.subsGained;
        shortsViews += r.views;
      } else if (r.uploadedVideoType === 'long') {
        longCount++;
        longSubs += r.subsGained;
        longViews += r.views;
      }
    });

    const shortsAvgConv = shortsViews > 0 ? Number(((shortsSubs / shortsViews) * 100).toFixed(2)) : 0;
    const longAvgConv = longViews > 0 ? Number(((longSubs / longViews) * 100).toFixed(2)) : 0;

    return {
      shortsCount,
      shortsAvgConv,
      longCount,
      longAvgConv,
    };
  }, [records]);

  // Max score for bar scaling
  const maxScore = Math.max(...dayStats.map((d) => d.score), 1);

  return (
    <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-lg space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              크리에이터 골든 타임 & 최적 업로드 요일 분석
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
              실데이터 기반
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            누적된 조회수와 구독 전환율을 종합 분석하여 내 채널 영상이 가장 잘 터지는 최적의 타이밍을 도출합니다.
          </p>
        </div>

        {/* Golden Time Recommendation Box */}
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-red-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-zinc-400 text-[11px] block">추천 골든 업로드 요일</span>
            <span className="font-extrabold text-white text-sm">
              <strong className="text-amber-300">{bestDay?.dayName}</strong> &{' '}
              <strong className="text-rose-300">{secondBestDay?.dayName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Insight 1: Best Upload Day */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> 1위 골든 요일
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
              성장 스코어 1위
            </span>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {bestDay?.dayName}
            </div>
            <div className="text-xs text-zinc-400 mt-1 space-y-0.5 font-mono">
              <div>평균 조회수: <strong className="text-zinc-200">{bestDay?.avgViews.toLocaleString()}회</strong></div>
              <div>평균 전환율: <strong className="text-emerald-400">{bestDay?.avgConv}%</strong></div>
              <div>평균 순증: <strong className="text-red-400">+{bestDay?.avgSubs}명</strong></div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            💡 주 시청자층이 저녁 시간대에 집중 유입되는 피크 데이입니다.
          </div>
        </div>

        {/* Insight 2: Recommended Upload Time Slots */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> 추천 업로드 시간대
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
              알고리즘 골든아워
            </span>
          </div>

          <div>
            <div className="text-xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
              <span>오후 6:00 ~ 8:30</span>
            </div>
            <div className="text-xs text-zinc-400 mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span><strong>평일:</strong> 18:30 ~ 20:00 (퇴근/하교 피크)</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span><strong>주말(토/일):</strong> 13:00 ~ 15:00 / 19:00</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            💡 알고리즘 시청자 색인 및 알림 전달까지 약 1~2시간 선행 업로드를 권장합니다.
          </div>
        </div>

        {/* Insight 3: Format Performance (Shorts vs Long-form) */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-purple-400" /> 영상 포맷별 구독 전환율
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
              포맷 분석
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold text-zinc-200">쇼츠 (#Shorts)</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-400 font-mono">{formatStats.shortsAvgConv}%</span>
                <span className="text-[10px] text-zinc-500 block">조회수 폭발력 우수</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold text-zinc-200">롱폼 일반영상</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-amber-400 font-mono">{formatStats.longAvgConv}%</span>
                <span className="text-[10px] text-zinc-500 block">시청지속 & 팬덤 전환</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            💡 쇼츠로 유입을 모으고, 롱폼으로 진성 구독자를 고착시키는 연계 전략이 유리합니다.
          </div>
        </div>

      </div>

      {/* Day of Week Visual Bar Chart */}
      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-zinc-300 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-red-500" />
            요일별 채널 반응 스코어 (조회수 + 구독전환율 복합 지수)
          </span>
          <span className="text-[11px] text-zinc-500">높을수록 알고리즘 반응이 좋은 요일</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dayStats.map((item) => {
            const isBest = item.dayIdx === bestDay?.dayIdx;
            const heightPct = Math.min(100, Math.max(15, (item.score / maxScore) * 100));

            return (
              <div key={item.dayIdx} className="flex flex-col items-center">
                {/* Bar */}
                <div className="w-full bg-zinc-900 rounded-lg h-24 p-1 flex items-end justify-center relative group">
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${
                      isBest 
                        ? 'bg-gradient-to-t from-amber-500 to-rose-500 shadow-md shadow-amber-500/20' 
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-[10px] text-zinc-200 whitespace-nowrap z-20 shadow-lg">
                    평균 {item.avgViews.toLocaleString()}회 / {item.avgConv}%
                  </div>
                </div>

                {/* Day label */}
                <span className={`text-xs mt-2 font-medium ${isBest ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}>
                  {DAY_SHORT[item.dayIdx]}
                  {isBest && '★'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {item.avgConv}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
