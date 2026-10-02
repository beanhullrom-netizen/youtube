import React, { useState, useMemo } from 'react';
import { DailyRecord } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Percent, 
  Calendar, 
  Sparkles,
  MessageSquare,
  Coins
} from 'lucide-react';

interface AnalyticsChartProps {
  records: DailyRecord[];
}

type MetricType = 'subs' | 'views' | 'conversion' | 'revenue';
type PeriodType = '7d' | '14d' | '30d' | 'all';

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ records }) => {
  const [metric, setMetric] = useState<MetricType>('subs');
  const [period, setPeriod] = useState<PeriodType>('14d');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter records based on selected period
  const filteredRecords = useMemo(() => {
    if (!records || records.length === 0) return [];
    const count = period === '7d' ? 7 : period === '14d' ? 14 : period === '30d' ? 30 : records.length;
    return records.slice(-count);
  }, [records, period]);

  // Max values for chart scaling
  const maxSubsGained = useMemo(() => {
    return Math.max(...filteredRecords.map((r) => r.subsGained), 10);
  }, [filteredRecords]);

  const maxViews = useMemo(() => {
    return Math.max(...filteredRecords.map((r) => r.views), 1000);
  }, [filteredRecords]);

  const maxConversion = useMemo(() => {
    return Math.max(...filteredRecords.map((r) => r.conversionRate), 2.0);
  }, [filteredRecords]);

  const maxRevenue = useMemo(() => {
    return Math.max(...filteredRecords.map((r) => r.confirmedRevenue || r.estimatedRevenue || 0), 10000);
  }, [filteredRecords]);

  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 25;

  const hoveredRecord = hoveredIndex !== null && filteredRecords[hoveredIndex] ? filteredRecords[hoveredIndex] : null;

  return (
    <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-lg">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-500" />
              <span>크리에이터 성장 & 수익 추이 차트</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
              {filteredRecords.length}일간의 추이
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            차트에 마우스를 올리면 그날의 수치와 <strong className="text-purple-400">한마디</strong>를 확인할 수 있습니다.
          </p>
        </div>

        {/* Tab & Period Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric Switcher */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
            <button
              onClick={() => setMetric('subs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                metric === 'subs' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>신규 구독자</span>
            </button>
            <button
              onClick={() => setMetric('views')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                metric === 'views' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>일일 조회수</span>
            </button>
            <button
              onClick={() => setMetric('conversion')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                metric === 'conversion' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>전환율(%)</span>
            </button>
            <button
              onClick={() => setMetric('revenue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                metric === 'revenue' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>애드센스 수익</span>
            </button>
          </div>

          {/* Period Filter */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            {(['7d', '14d', '30d', 'all'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                  period === p ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {p === '7d' ? '7일' : p === '14d' ? '14일' : p === '30d' ? '30일' : '전체'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full h-[260px] select-none">
        {filteredRecords.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
            표시할 데이터가 없습니다.
          </div>
        ) : (
          <div className="relative w-full h-full">
            <svg 
              className="w-full h-full overflow-visible"
              viewBox={`0 0 800 ${chartHeight + paddingY * 2}`}
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = paddingY + chartHeight * (1 - pct);
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={800 - paddingX}
                      y2={y}
                      stroke="#27272a"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="#71717a"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="sans-serif"
                    >
                      {metric === 'subs' && Math.round(maxSubsGained * pct)}
                      {metric === 'views' && (Math.round((maxViews * pct) / 1000) + 'k')}
                      {metric === 'conversion' && (maxConversion * pct).toFixed(1) + '%'}
                      {metric === 'revenue' && ('₩' + Math.round((maxRevenue * pct) / 1000) + 'k')}
                    </text>
                  </g>
                );
              })}

              {/* Chart Bars or Lines based on chosen metric */}
              {filteredRecords.map((r, i) => {
                const totalPoints = filteredRecords.length;
                const stepX = (800 - paddingX * 2) / Math.max(1, totalPoints - 1 || 1);
                const x = paddingX + i * stepX;
                const isHovered = hoveredIndex === i;

                let val = 0;
                let maxVal = 1;
                let barColor = '#ef4444';

                if (metric === 'subs') {
                  val = Math.max(0, r.subsGained);
                  maxVal = maxSubsGained;
                  barColor = isHovered ? '#f87171' : '#ef4444';
                } else if (metric === 'views') {
                  val = r.views;
                  maxVal = maxViews;
                  barColor = isHovered ? '#60a5fa' : '#3b82f6';
                } else if (metric === 'conversion') {
                  val = r.conversionRate;
                  maxVal = maxConversion;
                  barColor = isHovered ? '#fbbf24' : '#f59e0b';
                } else {
                  val = r.confirmedRevenue || r.estimatedRevenue || 0;
                  maxVal = maxRevenue;
                  barColor = isHovered ? '#34d399' : '#10b981';
                }

                const heightPct = Math.min(1, Math.max(0.04, val / maxVal));
                const barHeight = chartHeight * heightPct;
                const barY = paddingY + (chartHeight - barHeight);
                const barWidth = Math.max(10, Math.min(32, stepX * 0.6));

                return (
                  <g
                    key={r.id || i}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Hover vertical highlight bar */}
                    {isHovered && (
                      <rect
                        x={x - barWidth}
                        y={paddingY}
                        width={barWidth * 2}
                        height={chartHeight}
                        fill="#ffffff"
                        opacity="0.05"
                        rx="4"
                      />
                    )}

                    {/* Bar visual */}
                    <rect
                      x={x - barWidth / 2}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      fill={barColor}
                      rx="4"
                      className="transition-all duration-200"
                    />

                    {/* Subtle top cap highlight */}
                    <circle
                      cx={x}
                      cy={barY}
                      r={isHovered ? 4.5 : 2.5}
                      fill="#ffffff"
                      opacity={isHovered ? 1 : 0.8}
                    />

                    {/* X-axis Date Label */}
                    {(totalPoints <= 14 || i % 2 === 0 || i === totalPoints - 1) && (
                      <text
                        x={x}
                        y={paddingY + chartHeight + 18}
                        fill={isHovered ? '#ffffff' : '#71717a'}
                        fontSize="9"
                        textAnchor="middle"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                      >
                        {r.date.slice(5)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Interactive Tooltip on Hover */}
            {hoveredRecord && hoveredIndex !== null && (
              <div 
                className="absolute z-20 pointer-events-none bg-zinc-950/95 border border-zinc-700/80 rounded-xl p-3 shadow-2xl shadow-black text-xs backdrop-blur-md transition-all duration-75"
                style={{
                  left: `${Math.min(75, Math.max(5, (hoveredIndex / (filteredRecords.length - 1 || 1)) * 100))}%`,
                  top: '-10px',
                  transform: 'translateX(-50%)',
                  width: '270px',
                }}
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {hoveredRecord.date}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                    총 {hoveredRecord.todaySubs.toLocaleString()}명
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">신규 구독자</span>
                    <strong className="text-red-400 font-bold">
                      +{hoveredRecord.subsGained.toLocaleString()}명
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">일일 조회수</span>
                    <strong className="text-blue-400 font-bold">
                      {hoveredRecord.views.toLocaleString()}회
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">구독 전환율</span>
                    <strong className="text-amber-400 font-bold">
                      {hoveredRecord.conversionRate.toFixed(2)}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">애드센스 수익</span>
                    <strong className="text-emerald-400 font-bold">
                      ₩{(hoveredRecord.confirmedRevenue || hoveredRecord.estimatedRevenue || 0).toLocaleString()}원
                    </strong>
                  </div>
                </div>

                {hoveredRecord.note && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <span className="text-[10px] text-purple-400 flex items-center gap-1 font-semibold mb-0.5">
                      <MessageSquare className="w-3 h-3" />
                      그날의 한마디:
                    </span>
                    <p className="text-[11px] text-zinc-200 line-clamp-2 italic leading-relaxed">
                      "{hoveredRecord.note}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
