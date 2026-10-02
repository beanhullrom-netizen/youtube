import React, { useState, useMemo } from 'react';
import { DailyRecord } from '../types';
import { getDaysDiff, formatRecordGainInfo } from '../utils/recordChaining';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  ArrowUpRight,
  Flame,
  Award,
  Filter
} from 'lucide-react';

interface GrowthTrendChartProps {
  records: DailyRecord[];
  targetSubs?: number;
  onSelectDate?: (dateStr: string) => void;
}

export const GrowthTrendChart: React.FC<GrowthTrendChartProps> = ({
  records,
  targetSubs = 100000,
  onSelectDate,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '14d'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Sort records ascending by date and ensure valid numbers
  const validRecords = useMemo(() => {
    return [...records]
      .filter((r) => r && r.date && typeof r.todaySubs === 'number' && r.todaySubs > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  // 2. Filter by selected time range
  const filteredRecords = useMemo(() => {
    if (validRecords.length <= 1) return validRecords;
    if (timeRange === '14d') {
      return validRecords.slice(-14);
    }
    if (timeRange === '30d') {
      return validRecords.slice(-30);
    }
    return validRecords;
  }, [validRecords, timeRange]);

  // 3. Calculate key growth metrics from first to last with calendar day normalization
  const metrics = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    const first = filteredRecords[0];
    const last = filteredRecords[filteredRecords.length - 1];
    const totalGained = last.todaySubs - first.todaySubs;
    const pctGained = first.todaySubs > 0 
      ? ((totalGained / first.todaySubs) * 100).toFixed(2) 
      : '0.00';
    
    // Actual calendar elapsed days between first and last record
    const calendarDays = Math.max(1, getDaysDiff(first.date, last.date));
    const avgDailyGain = Math.round(totalGained / calendarDays);

    // Highest single-day gain (consecutive 1-day records)
    let highestSingleDay: DailyRecord | null = null;
    let highestPeriod: DailyRecord | null = null;

    for (const r of filteredRecords) {
      if (r.isInitialBaseline) continue;
      if (r.daysDiff === 1) {
        if (!highestSingleDay || (r.subsGained || 0) > (highestSingleDay.subsGained || 0)) {
          highestSingleDay = r;
        }
      }
      if (!highestPeriod || (r.subsGained || 0) > (highestPeriod.subsGained || 0)) {
        highestPeriod = r;
      }
    }

    return {
      first,
      last,
      totalGained,
      pctGained,
      recordCount: filteredRecords.length,
      calendarDays,
      avgDailyGain,
      highestSingleDay,
      highestPeriod,
    };
  }, [filteredRecords]);

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 250;
  const padding = { top: 35, right: 35, bottom: 45, left: 65 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Calculate scales and coordinate mappings
  const chartData = useMemo(() => {
    if (filteredRecords.length < 2) return null;

    const subsList = filteredRecords.map((r) => r.todaySubs);
    const rawMin = Math.min(...subsList);
    const rawMax = Math.max(...subsList);
    const range = rawMax - rawMin;

    // Buffer 5% top and bottom for visual breathing room
    const buffer = Math.max(20, Math.round(range * 0.08));
    const minY = Math.max(0, rawMin - buffer);
    const maxY = rawMax + buffer;
    const effectiveRange = Math.max(1, maxY - minY);

    const points = filteredRecords.map((r, i) => {
      const x = padding.left + (i / (filteredRecords.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - ((r.todaySubs - minY) / effectiveRange) * plotHeight;
      return { x, y, record: r, index: i };
    });

    // Generate smooth SVG curve path (cubic bezier)
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      // Control points
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    // Area closed path for gradient background fill
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const areaD = `${pathD} L ${lastPoint.x} ${padding.top + plotHeight} L ${firstPoint.x} ${padding.top + plotHeight} Z`;

    // 4 horizontal Y-axis gridlines
    const yGridTicks = [0, 0.33, 0.66, 1].map((pct) => {
      const val = Math.round(minY + pct * effectiveRange);
      const y = padding.top + plotHeight - pct * plotHeight;
      return { val, y };
    });

    return {
      points,
      pathD,
      areaD,
      yGridTicks,
      minY,
      maxY,
    };
  }, [filteredRecords, plotWidth, plotHeight, padding.left, padding.top]);

  if (!metrics || validRecords.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 text-center text-zinc-400">
        <TrendingUp className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-zinc-300">구독자 성장 곡선 준비 중</p>
        <p className="text-xs text-zinc-500 mt-1">
          일지를 2일 이상 기록하시면 첫 일지부터 지금까지의 나만의 성장 곡선이 선그래프로 그려집니다.
        </p>
      </div>
    );
  }

  const { first, last, totalGained, pctGained, recordCount, calendarDays, avgDailyGain, highestSingleDay, highestPeriod } = metrics;
  const activeHoverPoint = hoveredIndex !== null && chartData ? chartData.points[hoveredIndex] : null;

  // Format date helper: 2026-09-13 -> 09.13
  const formatDateLabel = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[1]}.${parts[2]}`;
    return dStr;
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800/90 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all">
      {/* Background soft ambient glow */}
      <div className="absolute top-0 right-1/4 w-80 h-32 bg-rose-600/5 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>일지 기반 구독자 성장 곡선</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                {timeRange === 'all' ? '전체 여정' : timeRange === '30d' ? '최근 30일' : '최근 14일'}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              처음 작성한 일지부터 가장 최근 일지까지의 구독자 성장 흐름입니다.
            </p>
          </div>
        </div>

        {/* Range filter buttons & Collapse Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {validRecords.length > 14 && (
            <div className="flex items-center bg-zinc-950/80 border border-zinc-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeRange('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeRange === 'all' 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                전체
              </button>
              {validRecords.length > 30 && (
                <button
                  type="button"
                  onClick={() => setTimeRange('30d')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    timeRange === '30d' 
                      ? 'bg-zinc-800 text-white shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  30일
                </button>
              )}
              <button
                type="button"
                onClick={() => setTimeRange('14d')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeRange === '14d' 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                14일
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-800/80"
            title={isCollapsed ? '그래프 펼치기' : '그래프 접기'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* KPI Cards: First Journal -> Last Journal Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 relative z-10">
        {/* 1. First Record Starting Point */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>첫 일지 시작점</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono">
            {first.todaySubs.toLocaleString()}명
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
            {first.date} 기록
          </div>
        </div>

        {/* 2. Last Record Current Point */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>현재 최신 기록</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-amber-300 font-mono">
            {last.todaySubs.toLocaleString()}명
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
            {last.date} 마감
          </div>
        </div>

        {/* 3. Total Growth During Period */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/20 to-zinc-950/70 border border-rose-500/30">
          <div className="text-[11px] text-rose-300 flex items-center gap-1.5 font-medium mb-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            <span>전체 누적 성장</span>
          </div>
          <div className={`text-base sm:text-lg font-bold font-mono ${totalGained >= 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
            {totalGained >= 0 ? `+${totalGained.toLocaleString()}` : totalGained.toLocaleString()}명
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            {totalGained >= 0 ? `+${pctGained}% 성장` : `${pctGained}% 변동`}
          </div>
        </div>

        {/* 4. Days Recorded & Average Pace */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium mb-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>기록 여정 / 일평균</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono">
            {calendarDays > recordCount ? `${calendarDays}일간 여정` : `총 ${recordCount}일치`}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
            일평균 +{avgDailyGain.toLocaleString()}명 페이스
            {calendarDays > recordCount && (
              <span className="text-[10px] text-zinc-400 font-normal ml-1">
                ({recordCount}편 일지)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive SVG Line Chart */}
      {!isCollapsed && chartData && (
        <div className="relative pt-2 pb-1 z-10 animate-in fade-in duration-300">
          
          {/* Active Hover Detail Glass Box (Floating inside chart header) */}
          {activeHoverPoint ? (
            <div className="mb-2 p-2.5 rounded-xl bg-zinc-900/90 border border-rose-500/40 text-xs flex items-center justify-between gap-4 animate-in fade-in duration-150 shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">
                  {activeHoverPoint.record.emotion ? activeHoverPoint.record.emotion.split(' ')[0] : '📝'}
                </span>
                <div>
                  <span className="font-bold text-white mr-2">{activeHoverPoint.record.date}</span>
                  <span className="text-zinc-400">구독자:</span>
                  <strong className="text-amber-300 font-mono ml-1">{activeHoverPoint.record.todaySubs.toLocaleString()}명</strong>
                  <span className="text-zinc-400 ml-2">구간 증감:</span>
                  {activeHoverPoint.record.isInitialBaseline ? (
                    <strong className="text-emerald-400 font-mono ml-1">🚩 시작 기준점 (기준)</strong>
                  ) : (
                    <strong className={`font-mono ml-1 ${(activeHoverPoint.record.subsGained || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(activeHoverPoint.record.subsGained || 0) >= 0 ? `+${activeHoverPoint.record.subsGained.toLocaleString()}` : activeHoverPoint.record.subsGained.toLocaleString()}명
                      {activeHoverPoint.record.daysDiff && activeHoverPoint.record.daysDiff > 1 ? (
                        <span className="text-zinc-400 font-normal font-sans text-[11px] ml-1">
                          ({activeHoverPoint.record.daysDiff}일간, 일평균 +{activeHoverPoint.record.avgDailyGain?.toLocaleString()}명)
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-normal font-sans text-[11px] ml-1">
                          (어제 대비)
                        </span>
                      )}
                    </strong>
                  )}
                </div>
              </div>
              {activeHoverPoint.record.uploadedVideoTitle && (
                <div className="hidden md:block text-[11px] text-zinc-400 truncate max-w-xs">
                  🎬 {activeHoverPoint.record.uploadedVideoTitle}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-2 text-right text-[11px] text-zinc-500">
              * 그래프 선의 각 날짜 점 위에 마우스를 올리면 그날의 상세 일지와 기록을 볼 수 있습니다.
            </div>
          )}

          {/* SVG Canvas */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[620px] select-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                {/* Line Gradient: Red to Rose to Amber */}
                <linearGradient id="growthLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="60%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>

                {/* Shaded Area Under Line Gradient */}
                <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(244, 63, 94, 0.28)" />
                  <stop offset="65%" stopColor="rgba(244, 63, 94, 0.05)" />
                  <stop offset="100%" stopColor="rgba(244, 63, 94, 0.0)" />
                </linearGradient>

                {/* Drop shadow glow filter */}
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f43f5e" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {chartData.yGridTicks.map((tick, i) => (
                <g key={`grid-${i}`}>
                  <line
                    x1={padding.left}
                    y1={tick.y}
                    x2={svgWidth - padding.right}
                    y2={tick.y}
                    stroke="#27272a"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={tick.y + 4}
                    fill="#71717a"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {tick.val.toLocaleString()}
                  </text>
                </g>
              ))}

              {/* Area Gradient Fill Under Curve */}
              <path d={chartData.areaD} fill="url(#growthAreaGradient)" />

              {/* Glowing Line Stroke */}
              <path
                d={chartData.pathD}
                fill="none"
                stroke="url(#growthLineGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glowFilter)"
              />

              {/* Active Hover Vertical Guide Line */}
              {activeHoverPoint && (
                <g>
                  <line
                    x1={activeHoverPoint.x}
                    y1={padding.top}
                    x2={activeHoverPoint.x}
                    y2={padding.top + plotHeight}
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                </g>
              )}

              {/* Data Points on the line */}
              {chartData.points.map((pt, i) => {
                const isFirst = i === 0;
                const isLast = i === chartData.points.length - 1;
                const isHovered = hoveredIndex === i;

                return (
                  <g
                    key={`pt-${pt.record.id || pt.record.date}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => onSelectDate && onSelectDate(pt.record.date)}
                  >
                    {/* Invisible larger hover hit area */}
                    <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                    {/* Outer ring for first/last/hovered */}
                    {(isFirst || isLast || isHovered) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? '9' : '6.5'}
                        fill={isFirst ? '#10b981' : '#f43f5e'}
                        opacity={isHovered ? '0.35' : '0.25'}
                        className={isLast ? 'animate-ping' : ''}
                      />
                    )}

                    {/* Point Core Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? '5.5' : isFirst || isLast ? '4.5' : '3'}
                      fill={isFirst ? '#10b981' : isLast ? '#fbbf24' : isHovered ? '#ffffff' : '#f43f5e'}
                      stroke="#09090b"
                      strokeWidth="2"
                    />

                    {/* First Point Label Badge */}
                    {isFirst && (
                      <g>
                        <rect
                          x={pt.x - 30}
                          y={pt.y - 28}
                          width="60"
                          height="18"
                          rx="9"
                          fill="#064e3b"
                          stroke="#10b981"
                          strokeWidth="1"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 16}
                          fill="#a7f3d0"
                          fontSize="9.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          시작
                        </text>
                      </g>
                    )}

                    {/* Last Point Label Badge */}
                    {isLast && (
                      <g>
                        <rect
                          x={pt.x - 38}
                          y={pt.y - 28}
                          width="76"
                          height="18"
                          rx="9"
                          fill="#7f1d1d"
                          stroke="#f43f5e"
                          strokeWidth="1"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 16}
                          fill="#fecdd3"
                          fontSize="9.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          현재 최신
                        </text>
                      </g>
                    )}

                    {/* X-axis Date Label at Bottom */}
                    {(isFirst || isLast || i % Math.max(1, Math.floor(chartData.points.length / 7)) === 0) && (
                      <text
                        x={pt.x}
                        y={padding.top + plotHeight + 20}
                        fill={isFirst || isLast || isHovered ? '#f4f4f5' : '#71717a'}
                        fontSize="10"
                        fontWeight={isFirst || isLast || isHovered ? 'bold' : 'normal'}
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {formatDateLabel(pt.record.date)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/60 mt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>첫 기록일: {first.date} ({first.todaySubs.toLocaleString()}명)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>현재 기준일: {last.date} ({last.todaySubs.toLocaleString()}명)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
