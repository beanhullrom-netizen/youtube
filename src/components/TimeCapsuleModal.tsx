import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Mail, 
  Sparkles, 
  Trophy, 
  AlertTriangle, 
  CheckCircle2, 
  Gift, 
  Heart,
  ShieldAlert,
  Flame,
  RotateCcw
} from 'lucide-react';
import { TimeCapsule100k } from '../types';

interface TimeCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  capsule: TimeCapsule100k | null;
  currentSubs: number;
  onSaveCapsule: (capsule: TimeCapsule100k) => void;
  onResetCapsule: () => void;
  initialMode?: 'write' | 'locked' | 'revealed';
}

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({
  isOpen,
  onClose,
  capsule,
  currentSubs,
  onSaveCapsule,
  onResetCapsule,
  initialMode,
}) => {
  // Determine mode
  // Rule: If currentSubs < 100000, it is STRICTLY FORBIDDEN to show revealed mode.
  const is100kAchieved = currentSubs >= 100000;

  const [mode, setMode] = useState<'write' | 'locked' | 'revealed'>('write');
  const [title, setTitle] = useState('10만의 나에게 보내는 편지');
  const [message, setMessage] = useState('');
  const [rewardPromise, setRewardPromise] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (!capsule || !capsule.isSealed) {
      setMode('write');
      setTitle('10만의 나에게 보내는 편지');
      setMessage('');
      setRewardPromise('');
    } else if (!is100kAchieved) {
      // 10만 달성 전: 무조건 'locked' (절대 열람 불가)
      setMode('locked');
    } else {
      // 10만 달성 완료: 'revealed'
      setMode('revealed');
    }
    setConfirmReset(false);
  }, [isOpen, capsule, is100kAchieved]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSealCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('미래의 나에게 보낼 편지 내용을 작성해주세요!');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const newCapsule: TimeCapsule100k = {
      isSealed: true,
      writtenAt: todayStr,
      writtenSubs: currentSubs,
      title: title.trim() || '10만의 나에게 보내는 편지',
      message: message.trim(),
      rewardPromise: rewardPromise.trim() || undefined,
    };

    onSaveCapsule(newCapsule);
    onClose();
  };

  const handleStartReset = () => {
    if (confirm('정말로 기존 편지를 파기하시겠습니까?\n내용을 열람하지 못한 채 완전히 삭제되며, 새로운 편지를 작성하게 됩니다.')) {
      onResetCapsule();
      setMessage('');
      setRewardPromise('');
      setMode('write');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[94dvh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
              <Mail className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 flex-wrap">
              <span>10만 실버버튼 타임캡슐</span>
              {mode === 'locked' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5">
                  <Lock className="w-3 h-3" /> 절대 봉인 중
                </span>
              )}
              {mode === 'revealed' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                  <Unlock className="w-3 h-3" /> 개봉 완료
                </span>
              )}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body depending on Mode */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* ========================================================= */}
          {/* CASE 1: WRITE MODE (작성 및 왁스 실링 봉인) */}
          {/* ========================================================= */}
          {mode === 'write' && (
            <form onSubmit={handleSealCapsule} className="space-y-4">
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>미래의 10만 나에게 보내는 타임캡슐</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  지금(현재 <strong>{currentSubs.toLocaleString()}명</strong>)의 고민, 열정, 그리고 마침내 10만 실버버튼을 달성했을 미래의 나에게 전하고 싶은 한마디를 적어보세요.
                </p>
                <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>⚠️ 봉인 후 100,000명을 실제로 달성하기 전까지는 본인이라도 절대 열람할 수 없습니다!</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  타임캡슐 제목
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 10만의 나에게 보내는 편지"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  편지 본문 (10만을 달성한 나에게) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="예: 지금 87,300명에서 하루하루 일지 쓰며 달려오느라 진짜 고생 많았지? 슬럼프도 있었고 지친 날도 있었지만 결국 10만을 찍어냈구나! 처음 채널을 열었을 때의 그 초심 잃지 말고, 앞으로도 시청자들과 오래오래 함께하자..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span>10만 달성 시 나 자신에게 주는 선물 / 약속 (선택)</span>
                </label>
                <input
                  type="text"
                  value={rewardPromise}
                  onChange={(e) => setRewardPromise(e.target.value)}
                  placeholder="예: 가족들과 한우 오마카세 파티, 최신 카메라 렌즈 구매, 3일간의 온전한 휴가"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-2.5 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-center"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>타임캡슐 왁스 실링 & 절대 봉인하기</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* CASE 2: LOCKED MODE (10만 달성 전 열람 시도 시 강력 차단 화면) */}
          {/* ========================================================= */}
          {mode === 'locked' && capsule && (
            <div className="py-4 px-2 text-center space-y-6">
              {/* Heavy Animated Lock & Wax Seal Graphic */}
              <div className="relative inline-flex items-center justify-center my-2">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-950 via-zinc-900 to-zinc-900 border-2 border-rose-500/50 flex items-center justify-center shadow-2xl relative shadow-rose-950/50">
                  <Lock className="w-10 h-10 text-rose-400 animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-rose-600 text-white shadow-md">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>

              {/* Strict Security Explanations */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-400 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                  🔒 보안 등급: 10만 실버버튼 절대 봉인
                </span>
                <h3 className="text-xl font-black text-white tracking-tight pt-1">
                  100,000명 달성 전까지 열 수 없습니다!
                </h3>
                <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                  이 타임캡슐은 <strong>100,000명을 실제로 돌파하는 바로 그 순간</strong>,<br />
                  10만 달성 공식 축하 컷신과 함께 봉인이 풀리며 화려하게 개봉됩니다.
                </p>
                <p className="text-[11px] text-zinc-500 italic pt-1">
                  ※ 작성자 본인이라도 10만을 찍기 전까지는 절대 내용을 열람할 수 없습니다.
                </p>
              </div>

              {/* Status Details Box (편지 내용은 일체 노출되지 않음!) */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-xs max-w-md mx-auto divide-y divide-zinc-800/80">
                <div className="pb-2.5 flex items-center justify-between text-zinc-400">
                  <span>작성 시점</span>
                  <span className="font-semibold text-zinc-200">
                    {capsule.writtenAt} (당시 {capsule.writtenSubs.toLocaleString()}명)
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-zinc-400">
                  <span>현재 구독자</span>
                  <span className="font-bold text-amber-400">
                    {currentSubs.toLocaleString()}명
                  </span>
                </div>
                <div className="pt-2.5 flex items-center justify-between text-zinc-400">
                  <span>개봉 조건 (남은 구독자)</span>
                  <span className="font-black text-rose-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    {(100000 - currentSubs).toLocaleString()}명 남음
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600 text-white text-xs font-bold shadow-sm transition-all"
                >
                  확인 (10만 향해 계속 달리기)
                </button>
                <button
                  type="button"
                  onClick={handleStartReset}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  title="기존 내용을 보지 않고 완전히 새로 덮어쓰기"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>편지 파기하고 새로 작성하기</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CASE 3: REVEALED MODE (10만 달성 시 영광의 편지 개봉) */}
          {/* ========================================================= */}
          {mode === 'revealed' && capsule && (
            <div className="py-2 space-y-6">
              {/* Broken Seal Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>100,000명 달성으로 타임캡슐 봉인 해제</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  📮 과거의 내가 보낸 편지가 도착했습니다
                </h3>
                <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-3 font-mono">
                  <span>작성: {capsule.writtenAt} ({capsule.writtenSubs.toLocaleString()}명 시절)</span>
                  <span>•</span>
                  <span className="text-amber-300">개봉: {currentSubs.toLocaleString()}명 달성 시점</span>
                </div>
              </div>

              {/* Luxury Letter Body */}
              <div className="bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden space-y-4">
                {/* Subtle paper grain & sheen */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

                <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                  <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{capsule.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    SEAL BROKEN AT 100K
                  </span>
                </div>

                {/* Letter Text */}
                <div className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed font-sans py-2">
                  {capsule.message}
                </div>

                {/* Promised Reward */}
                {capsule.rewardPromise && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5">
                    <Gift className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-amber-300 block">
                        나 자신과의 약속 (10만 달성 포상)
                      </span>
                      <p className="text-xs text-zinc-200">
                        {capsule.rewardPromise}
                      </p>
                    </div>
                  </div>
                )}

                {/* Final Stamp */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 text-[11px]">
                    포기하지 않고 끝까지 달려온 당신을 진심으로 축하합니다.
                  </span>
                  <span className="font-extrabold text-amber-400 text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> 실버버튼 크리에이터
                  </span>
                </div>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 text-xs font-black shadow-lg transition-all"
                >
                  확인 (편지 간직하기)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
