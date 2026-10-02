import React, { useState, useRef, useEffect } from 'react';
import { ChannelProfile, DailyRecord, TimeCapsule100k } from '../types';
import { calculateStreak } from '../utils/streak';
import { loadTimeCapsule, saveTimeCapsule } from '../utils/storage';
import { getDaysDiff } from '../utils/recordChaining';
import { MilestoneCelebrationModal } from './MilestoneCelebrationModal';
import { TimeCapsuleModal } from './TimeCapsuleModal';
import { 
  Target, 
  Award, 
  Calendar, 
  ChevronRight, 
  Zap, 
  Flame, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  Mail,
  Gift
} from 'lucide-react';

interface GoalTrackerProps {
  profile: ChannelProfile;
  currentRecord: DailyRecord | null;
  records: DailyRecord[];
  onOpenSettings: () => void;
}

interface SubMilestone {
  target: number;
  label: string;
  badge: string;
  desc: string;
  theme: 'gold' | 'peak' | 'rocket' | 'silver';
  glowClass: string;
  progressGradient: string;
  cheerTitle: string;
  cheerMsg: string;
  tag: string;
}

const SUB_MILESTONES: SubMilestone[] = [
  { 
    target: 88888, 
    label: '88,888명', 
    badge: '🍀 골드넘버', 
    desc: '행운의 트리플 에이트',
    theme: 'gold',
    glowClass: 'card-gold-glow',
    progressGradient: 'bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600',
    cheerTitle: '🍀 88,888 골드넘버 기운 듬뿍!',
    cheerMsg: '트리플 8의 황금빛 대박 행운이 채널에 쏟아집니다! ✨',
    tag: '황금빛 행운'
  },
  { 
    target: 90000, 
    label: '90,000명', 
    badge: '🏔️ 9만 고지', 
    desc: '앞자리 9만 돌파',
    theme: 'peak',
    glowClass: 'card-peak-glow',
    progressGradient: 'bg-gradient-to-r from-emerald-500 via-teal-300 to-cyan-400',
    cheerTitle: '🏔️ 9만 고지 정복 눈앞!',
    cheerMsg: '마지막 1만 명의 정상을 향해 거침없이 올라갑니다! 🚩',
    tag: '정상 정복'
  },
  { 
    target: 95000, 
    label: '95,000명', 
    badge: '🚀 파이널 카운트', 
    desc: '실버버튼까지 5,000명',
    theme: 'rocket',
    glowClass: 'card-rocket-glow',
    progressGradient: 'bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300',
    cheerTitle: '⚡ 파이널 카운트다운 진입!',
    cheerMsg: '엔진 풀가동! 실버버튼까지 단 5,000명 남았습니다! 🔥',
    tag: '최종 카운트다운'
  },
  { 
    target: 100000, 
    label: '100,000명', 
    badge: '🥈 10만 실버버튼', 
    desc: '영광의 실버버튼 달성',
    theme: 'silver',
    glowClass: 'card-silver-glow',
    progressGradient: 'bg-gradient-to-r from-slate-200 via-white to-indigo-300',
    cheerTitle: '🥈 영광의 10만 실버버튼!',
    cheerMsg: '유튜브 본사에서 날아오는 은빛 트로피의 주인공입니다! 🏆',
    tag: '실버 트로피'
  },
];

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  profile,
  currentRecord,
  records,
  onOpenSettings,
}) => {
  const [showSubMilestones, setShowSubMilestones] = useState(true);
  const [selectedCelebration, setSelectedCelebration] = useState<SubMilestone | null>(null);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [timeCapsule, setTimeCapsule] = useState<TimeCapsule100k | null>(null);
  const [isCapsuleModalOpen, setIsCapsuleModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadTimeCapsule().then((capsule) => {
      if (isMounted) setTimeCapsule(capsule);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveCapsule = async (newCapsule: TimeCapsule100k) => {
    setTimeCapsule(newCapsule);
    await saveTimeCapsule(newCapsule);
  };

  const handleResetCapsule = async () => {
    setTimeCapsule(null);
    await saveTimeCapsule(null);
  };

  // 가장 최근 일지(currentRecord)의 당일 마감 구독자 수를 최우선 기준으로 반영
  const currentSubs = currentRecord ? currentRecord.todaySubs : (profile.currentSubs || 87300);
  const prevSubsRef = useRef(currentSubs);

  // Automatically trigger celebration when a milestone target is newly achieved!
  useEffect(() => {
    const prev = prevSubsRef.current;
    if (prev < currentSubs) {
      const newlyAchieved = SUB_MILESTONES.find(m => prev < m.target && currentSubs >= m.target);
      if (newlyAchieved) {
        setIsReplayMode(false);
        setSelectedCelebration(newlyAchieved);
      }
    }
    prevSubsRef.current = currentSubs;
  }, [currentSubs]);

  const targetSubs = 100000; // 10만 실버버튼 고정
  const progressPct = Math.min(100, Math.max(0, (currentSubs / targetSubs) * 100));
  const remainingSubs = Math.max(0, targetSubs - currentSubs);

  // 1. Calculate streak
  const streak = calculateStreak(records);

  // 2. Calculate normalized daily growth rate based on recent records
  const nonBaselineRecords = records.filter(r => !r.isInitialBaseline);
  const recentRecords = nonBaselineRecords.slice(-7);
  let avgDailyGain = 1;
  if (recentRecords.length > 0) {
    const firstRecent = recentRecords[0];
    const lastRecent = recentRecords[recentRecords.length - 1];
    const totalGainRecent = lastRecent.todaySubs - (firstRecent.yesterdaySubs ?? firstRecent.todaySubs);
    const spanDays = Math.max(1, getDaysDiff(firstRecent.date, lastRecent.date) + (firstRecent.daysDiff ? firstRecent.daysDiff - 1 : 0));
    avgDailyGain = Math.max(1, Math.round(totalGainRecent / spanDays));
  } else if (currentRecord && !currentRecord.isInitialBaseline && currentRecord.subsGained > 0) {
    avgDailyGain = currentRecord.avgDailyGain || currentRecord.subsGained;
  }

  // Projected days to reach target
  const daysToTarget = avgDailyGain > 0 ? Math.ceil(remainingSubs / avgDailyGain) : 0;
  
  // Calculate projected date
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + daysToTarget);
  const projectedDateStr = projectedDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Find next upcoming milestone
  const nextMilestone = SUB_MILESTONES.find(m => m.target > currentSubs) || SUB_MILESTONES[SUB_MILESTONES.length - 1];

  return (
    <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden space-y-4 sm:space-y-5">
      <div className="absolute top-0 right-1/4 w-80 h-28 bg-red-600/10 blur-3xl pointer-events-none" />

      {/* Top Main Section */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-5">
        
        {/* Left: Goal Title, Numbers, Progress Bar */}
        <div className="space-y-2 flex-1 w-full">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="p-1 sm:p-1.5 rounded-lg border flex items-center justify-center bg-zinc-200/10 text-zinc-100 border-zinc-400/30 shrink-0">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              </span>
              <span className="text-xs font-bold text-zinc-200 tracking-wide flex items-center gap-1.5">
                <span className="text-zinc-100 font-extrabold">🥈 10만 실버버튼</span>
                <span className="text-zinc-400 font-normal hidden xs:inline">크리에이터 마일스톤</span>
              </span>

              {/* Streak Badge Pill */}
              {streak.currentStreak > 0 && (
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-300 animate-in fade-in duration-300">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400 fill-orange-400" />
                  <span>{streak.currentStreak}일 연속</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span className="text-zinc-400 font-mono text-[10px] sm:text-xs">
                현재 <strong>{currentSubs.toLocaleString()}</strong>명 / <strong>100,000</strong>명
              </span>
              <span className="text-[9px] sm:text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700">
                고정
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
            <span className="text-xl sm:text-3xl font-black text-white tracking-tight">
              {targetSubs.toLocaleString()}명 달성까지
            </span>
            <span className="text-xs sm:text-base font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 sm:px-2.5 py-0.5 rounded-xl">
              {remainingSubs > 0 ? `${remainingSubs.toLocaleString()}명 남음` : '🎉 10만 실버버튼 달성!'}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-zinc-300 font-mono">
              ({progressPct.toFixed(1)}% 달성)
            </span>
          </div>

          {/* Progress bar - Restored to vibrant glowing gradient without hazard stripes */}
          <div className="w-full bg-zinc-950 rounded-full h-3.5 sm:h-4 p-0.5 border border-zinc-800/90 mt-2 sm:mt-2.5 relative overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{ 
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #dc2626 0%, #f43f5e 45%, #fbbf24 100%)',
                boxShadow: '0 0 16px rgba(244, 63, 94, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.45)'
              }}
            >
              {/* Glossy top glass reflection */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-full pointer-events-none" />
              {/* Glowing spark pulse at leading tip */}
              <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white rounded-full blur-[1px] shadow-[0_0_10px_#fff] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Pace projection & Next Target Card */}
        <div className="w-full lg:w-auto shrink-0">
          <div className="flex items-center gap-3 bg-zinc-950/90 border border-zinc-800/80 p-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs shadow-inner">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-zinc-400 flex items-center gap-1 font-medium text-[11px] sm:text-xs">
                <span>최근 7일 일평균</span>
                <strong className="text-emerald-400 font-bold">+{avgDailyGain}명</strong>
                <span className="hidden xs:inline">성장 속도</span>
              </div>
              <div className="text-white font-semibold mt-0.5 sm:mt-1 flex items-center gap-1.5 flex-wrap text-xs sm:text-sm">
                <span className="text-zinc-400 text-[11px] sm:text-xs">10만 달성 예상:</span>
                <span className="text-amber-300 font-bold font-mono text-xs sm:text-sm">
                  {daysToTarget > 0 ? `D-${daysToTarget}일 (${projectedDateStr})` : '마일스톤 달성! 🏆'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Sub-Milestones Section (Feature 4: 찍어야만 다시 보기가 생기는 실전 마일스톤) */}
      <div className="pt-3 border-t border-zinc-800/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>실버버튼 중간 정복 마일스톤</span>
            </span>
            <span className="text-[11px] text-zinc-500">
              다음 기착지: <strong className="text-amber-300">{nextMilestone.label}</strong> ({Math.max(0, nextMilestone.target - currentSubs).toLocaleString()}명 남음)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSubMilestones(!showSubMilestones)}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{showSubMilestones ? '접기' : '단계 보기'}</span>
              {showSubMilestones ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showSubMilestones && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-in fade-in duration-200">
            {SUB_MILESTONES.map((milestone) => {
              const isCompleted = currentSubs >= milestone.target;
              const isCurrentTarget = !isCompleted && nextMilestone.target === milestone.target;
              const diff = milestone.target - currentSubs;
              const subPct = Math.min(100, Math.max(0, (currentSubs / milestone.target) * 100));

              // Card styling depending on achieved status
              const cardClass = isCompleted
                ? milestone.theme === 'gold'
                  ? 'bg-amber-950/25 border-amber-500/40 card-gold-glow hover:border-amber-400 cursor-pointer'
                  : milestone.theme === 'peak'
                    ? 'bg-emerald-950/25 border-emerald-500/40 card-peak-glow hover:border-emerald-400 cursor-pointer'
                    : milestone.theme === 'rocket'
                      ? 'bg-rose-950/25 border-rose-500/40 card-rocket-glow hover:border-rose-400 cursor-pointer'
                      : 'bg-indigo-950/25 border-indigo-300/40 card-silver-glow hover:border-indigo-300 cursor-pointer'
                : isCurrentTarget
                  ? 'bg-zinc-900/80 border-amber-500/40 ring-1 ring-amber-500/30 shadow-md shadow-amber-500/10'
                  : 'bg-zinc-950/60 border-zinc-800/80 opacity-60';

              return (
                <div
                  key={milestone.target}
                  onClick={() => {
                    // 실제로 목표를 달성했을 때에만 다시보기 활성화
                    if (isCompleted) {
                      setIsReplayMode(true);
                      setSelectedCelebration(milestone);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden select-none ${isCompleted ? 'cursor-pointer' : 'cursor-default'} ${cardClass}`}
                >
                  {/* Subtle sheen on cards */}
                  <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-sheen pointer-events-none" />

                  {/* Top: Badge & Status */}
                  <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
                    <span className="text-[11px] font-bold text-zinc-300 truncate">
                      {milestone.badge}
                    </span>

                    {isCompleted ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        달성
                      </span>
                    ) : isCurrentTarget ? (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-md shadow-sm">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                        </span>
                        목표
                      </span>
                    ) : (
                      <Lock className="w-3 h-3 text-zinc-600" />
                    )}
                  </div>

                  {/* Center: Milestone Target */}
                  <div className="my-1 relative z-10">
                    <div className="text-base font-black text-white font-mono tracking-tight flex items-center gap-1.5">
                      <span>{milestone.label}</span>
                      {isCurrentTarget && (
                        <Sparkles className="w-3 h-3 text-amber-400 animate-float-sparkle" />
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                      {isCompleted ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <span>정복 완료 🏆</span>
                        </span>
                      ) : (
                        <span>
                          <strong className="text-zinc-200">{diff.toLocaleString()}명</strong> 남음
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Progress Bar */}
                  <div className="w-full bg-zinc-900/90 rounded-full h-1.5 mt-2.5 overflow-hidden border border-zinc-800/80 relative z-10">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${milestone.progressGradient}`}
                      style={{ width: `${subPct}%` }}
                    />
                  </div>

                  {/* 실제로 달성했을 때에만 나타나는 [🎬 컷신 다시 보기] 버튼 */}
                  {isCompleted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsReplayMode(true);
                        setSelectedCelebration(milestone);
                      }}
                      className="mt-2.5 w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/35 hover:to-orange-500/35 border border-amber-500/40 hover:border-amber-400/60 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer relative z-10"
                      title="달성 컷신 다시 보기"
                    >
                      <PartyPopper className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                      <span>🎬 컷신 다시 보기</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 📮 10만 실버버튼 타임캡슐 섹션 (10만 찍기 전 절대 열람 불가) */}
      {!timeCapsule || !timeCapsule.isSealed ? (
          <div className="mt-3.5 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-zinc-200 flex items-center gap-2">
                  <span>📮 10만 실버버튼 타임캡슐</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                    10만 돌파 시 자동 개봉
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  100,000명을 달성할 미래의 나에게 편지를 봉인해보세요. 10만을 실제로 찍기 전까지는 절대로 열어볼 수 없습니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCapsuleModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600 text-white border border-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 flex-shrink-0 shadow-sm cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>타임캡슐 작성 및 봉인</span>
            </button>
          </div>
        ) : currentSubs < 100000 ? (
          /* 10만 달성 전: 굳게 닫힌 왁스 실링 절대 봉인 카드 */
          <div 
            onClick={() => setIsCapsuleModalOpen(true)}
            className="mt-3.5 p-4 rounded-2xl bg-gradient-to-r from-rose-950/25 via-zinc-950/90 to-zinc-950/90 border border-rose-500/30 hover:border-rose-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-all cursor-pointer group shadow-sm"
            title="10만 달성 전까지 절대 열람할 수 없습니다"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                <Lock className="w-4 h-4 text-rose-400 animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-zinc-200 flex items-center gap-2">
                  <span>📮 10만 실버버튼 타임캡슐</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-extrabold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> 절대 봉인 중
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  봉인 시점: {timeCapsule.writtenAt} ({timeCapsule.writtenSubs.toLocaleString()}명 시절) • 
                  <strong className="text-rose-400 font-normal"> 10만 달성 전까지 절대 열람 불가 (남은 {(100000 - currentSubs).toLocaleString()}명)</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCapsuleModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-900/90 group-hover:bg-zinc-800 text-zinc-300 group-hover:text-white border border-zinc-800 group-hover:border-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>🔒 봉인 상태 확인</span>
            </button>
          </div>
        ) : (
          /* 10만 달성 완료: 영광의 봉인 해제 카드 */
          <div 
            onClick={() => setIsCapsuleModalOpen(true)}
            className="mt-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-950/90 to-zinc-950/90 border-2 border-amber-500/50 hover:border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/10 group"
            title="10만 실버버튼 타임캡슐 개봉"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex-shrink-0 animate-bounce">
                <Mail className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="font-bold text-amber-200 flex items-center gap-2">
                  <span>📮 10만 실버버튼 타임캡슐</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> 봉인 해제 완료!
                  </span>
                </div>
                <p className="text-zinc-300 text-[11px] mt-0.5">
                  {timeCapsule.writtenSubs.toLocaleString()}명 시절 과거의 내가 보낸 편지가 도착했습니다!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCapsuleModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>📜 타임캡슐 편지 읽기</span>
            </button>
          </div>
        )}

        {/* Grand Milestone Celebration Modal (찍었을 때 & 다시 보기 눌렀을 때 이펙트 팍팍 터뜨리는 모달) */}
      <MilestoneCelebrationModal
        isOpen={Boolean(selectedCelebration)}
        onClose={() => setSelectedCelebration(null)}
        milestone={selectedCelebration}
        currentSubs={currentSubs}
        channelName={profile.channelName || '게임덩어리'}
        isReplay={isReplayMode}
        timeCapsule={timeCapsule}
        onOpenTimeCapsule={() => setIsCapsuleModalOpen(true)}
      />

      {/* 10만 타임캡슐 모달 (10만 찍기 전까지는 절대 봉인되어 본문 열람 불가) */}
      <TimeCapsuleModal
        isOpen={isCapsuleModalOpen}
        onClose={() => setIsCapsuleModalOpen(false)}
        capsule={timeCapsule}
        currentSubs={currentSubs}
        onSaveCapsule={handleSaveCapsule}
        onResetCapsule={handleResetCapsule}
      />

    </div>
  );
};
