import React, { useState } from 'react';
import { DailyRecord, ChannelProfile } from '../types';
import { 
  Coins, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  Wallet, 
  Calendar,
  AlertCircle,
  FileCheck2,
  DollarSign
} from 'lucide-react';

interface RevenueTrackerProps {
  currentRecord: DailyRecord | null;
  records: DailyRecord[];
  profile: ChannelProfile;
}

export const RevenueTracker: React.FC<RevenueTrackerProps> = ({
  currentRecord,
  records,
  profile,
}) => {
  const [showDelayInfo, setShowDelayInfo] = useState(false);

  if (!currentRecord) return null;

  // Calculate monthly total revenue
  const totalSettledRevenue = records.reduce((sum, r) => {
    return sum + (r.confirmedRevenue !== undefined ? r.confirmedRevenue : (r.estimatedRevenue || 0));
  }, 0);

  // Recent 7 days estimated total
  const recent7Days = records.slice(-7);
  const recent7Revenue = recent7Days.reduce((sum, r) => sum + (r.estimatedRevenue || 0), 0);

  // Check today's settlement status
  const isSettled = currentRecord.revenueStatus === 'settled';
  const displayRevenue = isSettled && currentRecord.confirmedRevenue !== undefined
    ? currentRecord.confirmedRevenue
    : currentRecord.estimatedRevenue || 0;

  return (
    <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Coins className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>유튜브 애드센스 수익 & 정산 지연 추적</span>
            </h2>
            <div className="flex items-center gap-1">
              {isSettled ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  정산 확정 완료
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 animate-spin" />
                  스튜디오 집계 대기 (1~2일 지연)
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            유튜브 스튜디오 실제 정산 규칙(최종 확정까지 24~48시간 소요)을 실시간으로 반영합니다.
          </p>
        </div>

        {/* Explain delay button */}
        <button
          onClick={() => setShowDelayInfo(!showDelayInfo)}
          className="text-xs flex items-center gap-1 text-zinc-400 hover:text-zinc-200 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>수익 정산이 왜 늦어지나요?</span>
        </button>
      </div>

      {/* Delay information banner popup */}
      {showDelayInfo && (
        <div className="mb-4 p-4 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between font-bold text-amber-300">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              유튜브 공식 애드센스 수익 집계 지연 안내
            </span>
            <button onClick={() => setShowDelayInfo(false)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            유튜브 시스템은 실시간 무효 클릭 및 봇 트래픽 검증, 광고주 입찰 최종 정산 절차를 거치기 때문에 
            <strong>'오늘 수익'은 1~2일 후에 유튜브 스튜디오에 최종 확정액으로 반영</strong>됩니다.
          </p>
          <div className="text-zinc-400 flex items-center gap-3 pt-1">
            <span>• <strong>당일 수치:</strong> 채널 평균 RPM(조회수 1,000회당 {profile.averageRPM.toLocaleString()}원) 기반 실시간 추정치</span>
            <span>• <strong>2일 전 수치:</strong> 구글 스튜디오 정산 확정액 자동 연동</span>
          </div>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* 1. Today's Revenue */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>{currentRecord.date} {isSettled ? '확정 정산액' : '당일 예상 수익'}</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {currentRecord.views.toLocaleString()}뷰 기준
              </span>
            </div>

            <div className="text-2xl font-extrabold text-white tracking-tight flex items-baseline gap-1 mt-1">
              ₩{displayRevenue.toLocaleString()}
              <span className="text-xs font-semibold text-zinc-400">원</span>
            </div>

            <div className="mt-3 p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span>적용 RPM단가</span>
                <span className="font-semibold text-zinc-200">1,000뷰당 ₩{profile.averageRPM.toLocaleString()}원</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>정산 처리 상태</span>
                <span className={isSettled ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {isSettled ? '최종 완료 (오차 0%)' : '가집계 (2일 후 확정)'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
            {isSettled ? '✓ 유튜브 최종 확정 데이터입니다.' : '⏳ 영업일 기준 약 24~48시간 내 확정됩니다.'}
          </div>
        </div>

        {/* 2. Recent 7-Day Revenue */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>최근 7일 누적 수익</span>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> 주간 추세
              </span>
            </div>

            <div className="text-2xl font-extrabold text-emerald-400 tracking-tight flex items-baseline gap-1 mt-1">
              ₩{recent7Revenue.toLocaleString()}
              <span className="text-xs font-semibold text-zinc-400">원</span>
            </div>

            <div className="mt-3 p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span>최근 7일 일평균 수익</span>
                <span className="font-semibold text-zinc-200">
                  ₩{Math.round(recent7Revenue / 7).toLocaleString()}원/일
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>최근 7일 총 조회수</span>
                <span className="font-semibold text-zinc-200">
                  {recent7Days.reduce((acc, r) => acc + r.views, 0).toLocaleString()}회
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
            월 예상 환산: 약 ₩{Math.round((recent7Revenue / 7) * 30).toLocaleString()}원
          </div>
        </div>

        {/* 3. Total Recorded Lifetime Revenue */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>전체 누적 기록 수익</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {records.length}일간 합산
              </span>
            </div>

            <div className="text-2xl font-extrabold text-amber-300 tracking-tight flex items-baseline gap-1 mt-1">
              ₩{totalSettledRevenue.toLocaleString()}
              <span className="text-xs font-semibold text-zinc-400">원</span>
            </div>

            <div className="mt-3 p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span>정산 완료 누적일수</span>
                <span className="font-semibold text-emerald-400">
                  {records.filter(r => r.revenueStatus === 'settled').length}일
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>대기(지연) 집계일수</span>
                <span className="font-semibold text-amber-400">
                  {records.filter(r => r.revenueStatus === 'pending').length}일
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>향후 실제 유튜브 API 연동 가능 규격</span>
            <FileCheck2 className="w-3.5 h-3.5 text-zinc-400" />
          </div>
        </div>

      </div>

    </div>
  );
};
