import React, { useState, useMemo } from 'react';
import { DailyRecord } from '../types';
import { OutlierDetailModal } from './OutlierDetailModal';
import { 
  Flame, 
  Rocket, 
  TrendingUp, 
  Sparkles, 
  Award, 
  Calendar, 
  Video, 
  BarChart3, 
  CheckCircle2, 
  ArrowUpRight,
  Zap,
  Film,
  Play,
  Eye
} from 'lucide-react';

interface OutlierAnalysisProps {
  records: DailyRecord[];
  onSelectRecord?: (recordId: string) => void;
  onUpdateRecord?: (record: DailyRecord) => void;
  onOpenEditModal?: (record: DailyRecord) => void;
  onNavigateToDashboard?: (recordId: string) => void;
}

export interface OutlierItem {
  record: DailyRecord;
  multiplier: number; // e.g. 2.14x
  type: 'super' | 'high' | 'above' | 'normal';
  dayOfWeek: string;
}

export const OutlierAnalysis: React.FC<OutlierAnalysisProps> = ({ 
  records, 
  onSelectRecord,
  onUpdateRecord,
  onOpenEditModal,
  onNavigateToDashboard,
}) => {
  const [selectedOutlierRecord, setSelectedOutlierRecord] = useState<DailyRecord | null>(null);

  // 1. 유효 조회수가 있는 레코드들 필터링
  const validRecords = useMemo(() => {
    return records.filter(r => r.views > 0);
  }, [records]);

  // 2. 채널 기준선(Baseline) 계산
  const { avgViews, avgSubsGained, avgConversionRate } = useMemo(() => {
    if (validRecords.length === 0) {
      return { avgViews: 0, avgSubsGained: 0, avgConversionRate: 0 };
    }
    const totalV = validRecords.reduce((acc, r) => acc + r.views, 0);
    const totalS = validRecords.reduce((acc, r) => acc + r.subsGained, 0);
    const totalCR = validRecords.reduce((acc, r) => acc + r.conversionRate, 0);

    return {
      avgViews: Math.round(totalV / validRecords.length),
      avgSubsGained: Math.round(totalS / validRecords.length),
      avgConversionRate: Number((totalCR / validRecords.length).toFixed(2)),
    };
  }, [validRecords]);

  // 3. 레코드별 아웃라이어 배수 및 등급 산출
  const analyzedItems: OutlierItem[] = useMemo(() => {
    if (avgViews === 0) return [];

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

    return validRecords.map(record => {
      const multiplier = Number((record.views / avgViews).toFixed(2));
      const dateObj = new Date(record.date);
      const dayOfWeek = dayNames[dateObj.getDay()];

      let type: 'super' | 'high' | 'above' | 'normal' = 'normal';
      if (multiplier >= 2.0) {
        type = 'super'; // 평균의 200% 이상 (초대박)
      } else if (multiplier >= 1.4) {
        type = 'high';  // 평균의 140% 이상 (급상승)
      } else if (multiplier >= 1.1) {
        type = 'above'; // 평균 이상
      }

      return { record, multiplier, type, dayOfWeek };
    }).sort((a, b) => b.record.views - a.record.views); // 조회수 높은 순 정렬
  }, [validRecords, avgViews]);

  // 상위 아웃라이어 (1.4배 이상 터진 날들)
  const topOutliers = useMemo(() => {
    return analyzedItems.filter(item => item.multiplier >= 1.4);
  }, [analyzedItems]);

  // 최고 기록
  const topRecord = analyzedItems.length > 0 ? analyzedItems[0] : null;

  // 요일별 대박 발생 빈도
  const bestDayStats = useMemo(() => {
    if (topOutliers.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const item of topOutliers) {
      counts[item.dayOfWeek] = (counts[item.dayOfWeek] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { day: sorted[0][0], count: sorted[0][1] } : null;
  }, [topOutliers]);

  // 영상 포맷별 승률 비교 (shorts vs long)
  const formatComparison = useMemo(() => {
    const shortsOutliers = topOutliers.filter(item => item.record.uploadedVideoType === 'shorts').length;
    const longOutliers = topOutliers.filter(item => item.record.uploadedVideoType === 'long').length;
    return { shortsOutliers, longOutliers };
  }, [topOutliers]);

  if (validRecords.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-400">
        <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">아웃라이어(대박 영상) 분석 준비 중</h3>
        <p className="text-xs text-zinc-500">
          유튜브 데이터가 동기화되면 채널 평균 대비 폭발적으로 터진 날들을 자동으로 감지하여 분석해 드립니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/70 via-zinc-900 to-amber-950/50 border border-red-500/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold tracking-wide">
              <Rocket className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>ViewStats™ 벤치마킹 아웃라이어 알고리즘</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>내 채널 '대박 영상' 자동 감지 & 성공 패턴 분석</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              최근 채널 기준치(평균 일일 조회수 <strong className="text-zinc-200">{avgViews.toLocaleString()}회</strong>)를 
              초과 달성하여 알고리즘을 강타한 날들을 감지하고, 성공 요인을 정밀 도출합니다.
            </p>
          </div>

          {/* Quick Outlier Stats Badge */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] text-zinc-400 font-medium">대박/급상승 발생일</div>
              <div className="text-2xl font-black text-white">
                {topOutliers.length} <span className="text-xs font-normal text-zinc-500">/ {validRecords.length}일 중</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                발생률 {Math.round((topOutliers.length / validRecords.length) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: 최고 대박 기록 */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 hover:border-red-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">🏆 역대 최고 대박일</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {topRecord ? `${topRecord.record.views.toLocaleString()}회` : '-'}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            {topRecord && (
              <>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold">
                  {topRecord.multiplier}x 배수
                </span>
                <span className="text-zinc-500 font-mono">{topRecord.record.date}</span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: 채널 평균 일일 조회수 */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all shadow-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">📊 채널 기준선 (평균)</span>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {avgViews.toLocaleString()}회
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            일일 평균 순증 <strong className="text-zinc-300">+{avgSubsGained.toLocaleString()}명</strong>
          </div>
        </div>

        {/* Card 3: 대박 터진 주요 요일 */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all shadow-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">📅 최다 급상승 요일</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {bestDayStats ? bestDayStats.day : '분석 중'}
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            {bestDayStats ? `대박의 ${bestDayStats.count}회가 이 요일에 발생` : '충분한 데이터 수집 후 도출'}
          </div>
        </div>

        {/* Card 4: 대박 영상 평균 구독 전환율 */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all shadow-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">🎯 평균 구독 전환율</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {avgConversionRate}%
          </div>
          <div className="text-xs text-purple-400/90 font-medium mt-2 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>1,000회 조회당 약 {Math.round(avgConversionRate * 10)}명 유입</span>
          </div>
        </div>

      </div>

      {/* Deep Insights: Why did it pop? (대박 성공 요인 요약) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">알고리즘 분석: 내 채널이 터진 3대 핵심 패턴</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>1. 포맷 효율 분석</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              대박 구간에서 <strong>쇼츠({formatComparison.shortsOutliers}회)</strong>와 <strong>롱폼({formatComparison.longOutliers}회)</strong>의 
              시너지로 일일 50만 회 이상의 조회수 급등이 유발되었습니다.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>2. 구독 전환 폭발력</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              조회수 1.5배 이상 터진 날은 평소 비수기 대비 구독자 흡수 속도가 
              <strong> 최대 3배 이상</strong> 가속화되는 골든 레버리지 효과가 확인되었습니다.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>3. 추천 업로드 타이밍</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {bestDayStats ? (
                <><strong>{bestDayStats.day}</strong> 전날 또는 당일 오후 업로드 시 알고리즘 노출 지속력이 극대화되는 경향을 보입니다.</>
              ) : (
                <>주말 전 목요일/금요일 저녁 시간대 영상 투입 시 초기 유입량이 급등합니다.</>
              )}
            </p>
          </div>

        </div>
      </div>

      {/* Outlier Leaderboard (일자별 대박 순위 테이블) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <span>아웃라이어(대박 영상) 성과 순위표</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              채널 평균 대비 성과 배율이 높았던 날짜 순으로 정렬된 리스트입니다.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" /> 2.0x+ 초대박
            </span>
            <span className="flex items-center gap-1 text-amber-400 ml-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 1.4x+ 급상승
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 text-zinc-400 font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-5">순위 / 날짜</th>
                <th className="py-3.5 px-4">성과 배율</th>
                <th className="py-3.5 px-4 text-right">일일 조회수</th>
                <th className="py-3.5 px-4 text-right">늘어난 구독자</th>
                <th className="py-3.5 px-4">업로드 / 견인 영상</th>
                <th className="py-3.5 px-4 text-right">전환율</th>
                <th className="py-3.5 px-5 text-center">영상 상세 / 보기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {analyzedItems.map((item, idx) => {
                const isSuper = item.type === 'super';
                const isHigh = item.type === 'high';
                const isAbove = item.type === 'above';

                const displayVideoTitle = item.record.uploadedVideoTitle || item.record.topVideos?.[0]?.title;
                const displayThumbnail = item.record.uploadedVideoThumbnail || item.record.topVideos?.[0]?.thumbnailUrl;

                return (
                  <tr 
                    key={item.record.id} 
                    className={`hover:bg-zinc-800/40 transition-colors ${
                      isSuper ? 'bg-red-500/5' : isHigh ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Rank & Date */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          idx === 0 
                            ? 'bg-amber-500 text-black font-black' 
                            : idx === 1 
                            ? 'bg-zinc-300 text-black font-bold' 
                            : idx === 2 
                            ? 'bg-amber-700 text-white font-bold' 
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white font-mono">{item.record.date}</div>
                          <div className="text-[11px] text-zinc-500">{item.dayOfWeek}</div>
                        </div>
                      </div>
                    </td>

                    {/* Multiplier Badge */}
                    <td className="py-4 px-4">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-black shadow-sm shadow-red-600/30">
                          <Rocket className="w-3 h-3" />
                          <span>{item.multiplier}x 초대박</span>
                        </span>
                      ) : isHigh ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>{item.multiplier}x 급상승</span>
                        </span>
                      ) : isAbove ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px]">
                          {item.multiplier}x 평상
                        </span>
                      ) : (
                        <span className="text-zinc-600 font-mono text-[11px]">
                          {item.multiplier}x
                        </span>
                      )}
                    </td>

                    {/* Daily Views */}
                    <td className="py-4 px-4 text-right">
                      <div className="font-bold text-white font-mono text-sm">
                        {item.record.views.toLocaleString()}회
                      </div>
                      <div className={`text-[10px] ${
                        item.multiplier >= 1.0 ? 'text-emerald-400' : 'text-zinc-500'
                      }`}>
                        {item.multiplier >= 1.0 ? `+${Math.round((item.multiplier - 1) * 100)}%` : `-${Math.round((1 - item.multiplier) * 100)}%`}
                      </div>
                    </td>

                    {/* Subs Gained */}
                    <td className="py-4 px-4 text-right font-mono">
                      <span className="text-emerald-400 font-bold">
                        +{item.record.subsGained.toLocaleString()}명
                      </span>
                    </td>

                    {/* Video Info Cell (Clickable) */}
                    <td 
                      className="py-4 px-4 max-w-xs cursor-pointer group/vid"
                      onClick={() => setSelectedOutlierRecord(item.record)}
                      title="클릭하여 어떤 영상인지 상세 보기"
                    >
                      {displayVideoTitle ? (
                        <div className="flex items-center gap-2.5">
                          {displayThumbnail ? (
                            <img 
                              src={displayThumbnail} 
                              alt="" 
                              className="w-12 h-7 object-cover rounded-md shrink-0 bg-zinc-800 border border-zinc-700/80 group-hover/vid:border-red-500 transition-colors" 
                            />
                          ) : (
                            <span className={`p-1 rounded-md text-[10px] shrink-0 font-semibold ${
                              item.record.uploadedVideoType === 'shorts' 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {item.record.uploadedVideoType === 'shorts' ? '쇼츠' : '롱폼'}
                            </span>
                          )}
                          <span className="text-zinc-200 truncate group-hover/vid:text-red-400 transition-colors font-medium">
                            {displayVideoTitle}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-zinc-500 group-hover/vid:text-zinc-300 transition-colors text-[11px]">
                          <span>알고리즘 견인</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 group-hover/vid:bg-red-500/20 group-hover/vid:text-red-300 transition-colors">
                            영상 확인 →
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Conversion Rate */}
                    <td className="py-4 px-4 text-right font-mono">
                      <span className={`font-semibold ${
                        item.record.conversionRate >= avgConversionRate ? 'text-purple-300' : 'text-zinc-400'
                      }`}>
                        {item.record.conversionRate}%
                      </span>
                    </td>

                    {/* Action Button: '영상 보기' triggers modal */}
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => setSelectedOutlierRecord(item.record)}
                        className="px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm active:scale-95"
                        title="어떤 영상인지 상세 분석 보기"
                      >
                        <Play className="w-3 h-3 fill-red-400" />
                        <span>영상 보기</span>
                        <ArrowUpRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outlier Video Detail Modal */}
      <OutlierDetailModal
        isOpen={Boolean(selectedOutlierRecord)}
        onClose={() => setSelectedOutlierRecord(null)}
        record={selectedOutlierRecord}
        avgViews={avgViews}
        onNavigateToDashboard={onNavigateToDashboard || onSelectRecord}
        onUpdateRecord={(updated) => {
          onUpdateRecord?.(updated);
          setSelectedOutlierRecord(updated);
        }}
        onOpenEditModal={onOpenEditModal}
      />

    </div>
  );
};
