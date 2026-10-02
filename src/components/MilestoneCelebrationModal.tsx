import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Trophy, 
  PartyPopper, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight,
  Flame, 
  Award, 
  Zap, 
  Mail, 
  FastForward,
  Volume2,
  VolumeX,
  FileText,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { TimeCapsule100k } from '../types';
import { cutsceneAudio } from '../utils/cutsceneAudio';
import { SummitConquestCutscene } from './SummitConquestCutscene';

export interface MilestoneCelebrationData {
  target: number;
  label: string;
  badge: string;
  desc: string;
  theme: 'gold' | 'peak' | 'rocket' | 'silver';
  cheerTitle: string;
  cheerMsg: string;
  tag: string;
}

export interface FireworkParticle {
  id: number;
  originX: number;
  originY: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
  isEmoji: boolean;
  content: string;
  delay: number;
}

interface MilestoneCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: MilestoneCelebrationData | null;
  currentSubs: number;
  channelName?: string;
  isReplay?: boolean;
  timeCapsule?: TimeCapsule100k | null;
  onOpenTimeCapsule?: () => void;
}

export const MilestoneCelebrationModal: React.FC<MilestoneCelebrationModalProps> = ({
  isOpen,
  onClose,
  milestone,
  currentSubs,
  channelName = '게임덩어리',
  isReplay = false,
  timeCapsule,
  onOpenTimeCapsule,
}) => {
  const [burstCount, setBurstCount] = useState(1);
  const [isPlayingCutscene, setIsPlayingCutscene] = useState(true);
  const [cutsceneStep, setCutsceneStep] = useState(0); // 0: intro, 1: zoom-in action, 2: climax impact, 3: grand finale
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [isWhiteoutFlash, setIsWhiteoutFlash] = useState(false);
  const [isMuted, setIsMuted] = useState(() => cutsceneAudio.getIsMuted());
  const [activeViewTab, setActiveViewTab] = useState<'card' | 'certificate'>('card');
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [clickFireworks, setClickFireworks] = useState<FireworkParticle[]>([]);

  // Safe close handler that stops all playing Foley audio immediately
  const handleClose = () => {
    cutsceneAudio.stopAll();
    onClose();
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Audio trigger helper based on milestone theme
  const playThemeAudio = (theme?: string) => {
    if (!theme) return;
    switch (theme) {
      case 'gold':
        cutsceneAudio.playSlotMachineJackpot();
        break;
      case 'peak':
        cutsceneAudio.playSummitConquest();
        break;
      case 'rocket':
        cutsceneAudio.playRocketLaunch();
        break;
      case 'silver':
        cutsceneAudio.playSilverButtonGrandCeremony();
        break;
      default:
        break;
    }
  };

  // Cutscene sequenced timeline playback with camera & sound
  useEffect(() => {
    if (!isOpen || !milestone) {
      setIsPlayingCutscene(true);
      setCutsceneStep(0);
      setIsScreenShaking(false);
      setIsWhiteoutFlash(false);
      return;
    }

    // Initialize cinema sequence
    setIsPlayingCutscene(true);
    setCutsceneStep(0);
    setIsScreenShaking(false);
    setIsWhiteoutFlash(false);
    setActiveViewTab('card');

    // 🏔️ 90,000 고지 (peak theme)의 경우 SummitConquestCutscene가 독립적인 10초 타임라인을 직접 감독함
    if (milestone.theme === 'peak') {
      return;
    }

    // Trigger audio theme immediately for other milestones
    playThemeAudio(milestone.theme);

    // Timeline Step 1: Camera zoom-in & Action phase (at 700ms)
    const t1 = setTimeout(() => {
      setCutsceneStep(1);
    }, 700);

    // Timeline Step 2: Climax Impact, Whiteout Flash & Screen Shake (at 2350ms)
    const t2 = setTimeout(() => {
      setCutsceneStep(2);
      setIsWhiteoutFlash(true);
      setIsScreenShaking(true);
      setBurstCount(prev => prev + 1);

      // Flash fades quickly
      setTimeout(() => {
        setIsWhiteoutFlash(false);
      }, 250);
    }, 2350);

    // Timeline Step 3: Grand Reveal & Finale (at 2800ms)
    const t3 = setTimeout(() => {
      setCutsceneStep(3);
      setIsScreenShaking(false);
    }, 2800);

    // Timeline Step 4: Seamless transition to Results Card (at 4400ms)
    const t4 = setTimeout(() => {
      setIsPlayingCutscene(false);
      setIsScreenShaking(false);
      setIsWhiteoutFlash(false);
    }, 4400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, milestone?.target]);

  if (!isOpen || !milestone) return null;

  const handleToggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextMuted = cutsceneAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleSkipCutscene = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    cutsceneAudio.stopAll();
    setIsPlayingCutscene(false);
    setIsScreenShaking(false);
    setIsWhiteoutFlash(false);
  };

  const handleReplayCutscene = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingCutscene(true);
    setCutsceneStep(0);
    setIsScreenShaking(false);
    setIsWhiteoutFlash(false);
    setActiveViewTab('card');

    if (milestone.theme === 'peak') {
      return;
    }

    playThemeAudio(milestone.theme);

    setTimeout(() => setCutsceneStep(1), 700);
    setTimeout(() => {
      setCutsceneStep(2);
      setIsWhiteoutFlash(true);
      setIsScreenShaking(true);
      setBurstCount(prev => prev + 1);
      setTimeout(() => setIsWhiteoutFlash(false), 250);
    }, 2350);
    setTimeout(() => {
      setCutsceneStep(3);
      setIsScreenShaking(false);
    }, 2800);
    setTimeout(() => {
      setIsPlayingCutscene(false);
      setIsScreenShaking(false);
      setIsWhiteoutFlash(false);
    }, 4400);
  };

  // If 90,000 Summit Conquered cutscene is playing, render full 10-second cinematic theater!
  if (isPlayingCutscene && milestone.theme === 'peak') {
    return (
      <SummitConquestCutscene
        channelName={channelName}
        onComplete={() => setIsPlayingCutscene(false)}
        onSkip={handleSkipCutscene}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    );
  }

  // High-visibility explosive radial firework with sparks & emojis
  const triggerFireworkAt = (x: number, y: number) => {
    cutsceneAudio.playClickFirework();

    const colors = [
      '#ffd700', // Gold
      '#facc15', // Neon Yellow
      '#ff0055', // Electric Crimson
      '#00f0ff', // Cyber Cyan
      '#00ff88', // Bright Emerald
      '#bf5af2', // Neon Purple
      '#ffffff', // Diamond White
      '#ff9500', // Bright Orange
    ];

    const emojis = config.particles || ['✨', '🎉', '⭐', '💎', '🏆', '🪙'];

    // 24 radial sparks bursting 360 degrees outward
    const sparkCount = 24;
    const newSparks: FireworkParticle[] = [];

    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * 2 * Math.PI + (Math.random() - 0.5) * 0.35;
      const distance = 90 + Math.random() * 160; // 90px ~ 250px burst radius
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const isEmoji = i % 2 === 0;
      const color = colors[i % colors.length];

      newSparks.push({
        id: Date.now() + i + Math.random(),
        originX: x,
        originY: y,
        tx,
        ty,
        color,
        size: isEmoji ? 28 : 12 + Math.random() * 8,
        isEmoji,
        content: isEmoji ? emojis[i % emojis.length] : '',
        delay: Math.random() * 0.04,
      });
    }

    setClickFireworks(prev => [...prev.slice(-48), ...newSparks]);

    setTimeout(() => {
      setClickFireworks(prev => prev.filter(item => !newSparks.some(s => s.id === item.id)));
    }, 850);
  };

  const handleStageClick = (e: React.MouseEvent) => {
    if (isPlayingCutscene) return;
    triggerFireworkAt(e.clientX, e.clientY);
  };

  const handleFireworkBarrage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const w = window.innerWidth;
    const h = window.innerHeight;
    triggerFireworkAt(w * 0.3, h * 0.45);
    setTimeout(() => {
      triggerFireworkAt(w * 0.7, h * 0.45);
    }, 120);
    setTimeout(() => {
      triggerFireworkAt(w * 0.5, h * 0.35);
    }, 240);
  };

  // Copy share announcement text for social media / community
  const handleCopyShareText = () => {
    const text = `🎉 [유튜브 크리에이터 공식 마일스톤 달성!]
채널명: ${channelName}
달성 마일스톤: ${milestone.label} (${milestone.badge})
현재 총 구독자: ${currentSubs.toLocaleString()}명
고지 정복 메시지: "${config.heroTitle}"
함께 응원해 주신 구독자 여러분 진심으로 감사드립니다! 🚀✨`;
    
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  // Concept-specific cutscene configuration
  const getCutsceneConfig = () => {
    switch (milestone.theme) {
      case 'gold':
        return {
          glowColor: 'rgba(245, 158, 11, 0.45)',
          borderClass: 'border-amber-400/80',
          gradientBg: 'from-amber-950/50 via-yellow-950/20 to-black',
          badgeClass: 'bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-300 border-amber-400/60 shadow-amber-500/20',
          sunburstColor: 'rgba(245, 158, 11, 0.25)',
          shockwaveColor: 'border-amber-400/50',
          bigEmoji: '🍀',
          targetNumeral: '8 8 , 8 8 8',
          cutsceneTitle: 'LUCKY GOLD NUMBER',
          chapterTitle: 'CHAPTER 1 : 행운의 황금 슬롯 잭팟',
          heroTitle: '행운의 골드넘버 88,888 정복!',
          subtitle: '트리플 8의 황금빛 대박 기운이 채널을 가득 뒤덮습니다! 🍀✨',
          quote: '"황금빛 기운을 타고 9만 고지를 향해 직행합니다!"',
          particles: ['✨', '🌟', '💰', '🍀', '💫', '🎉', '🪙'],
          certificateTitle: 'GOLD NUMBER 88,888 CONQUEST',
          certificateCode: `CDS-2026-GOLD-88888`,
        };
      case 'peak':
        return {
          glowColor: 'rgba(16, 185, 129, 0.45)',
          borderClass: 'border-emerald-400/80',
          gradientBg: 'from-emerald-950/50 via-teal-950/20 to-black',
          badgeClass: 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border-emerald-400/60 shadow-emerald-500/20',
          sunburstColor: 'rgba(16, 185, 129, 0.25)',
          shockwaveColor: 'border-emerald-400/50',
          bigEmoji: '🏔️',
          targetNumeral: '9 0 , 0 0 0',
          cutsceneTitle: '90,000 SUMMIT CONQUERED',
          chapterTitle: 'CHAPTER 2 : 9만 고지 정상 깃발 완착',
          heroTitle: '9만 고지 정상 정복 완료!',
          subtitle: '앞자리 9만 돌파! 이제 10만 실버버튼 정상이 눈앞에 선명히 보입니다! 🚩',
          quote: '"고지를 정복한 자만이 실버버튼의 영광을 마주합니다!"',
          particles: ['🏔️', '🚩', '⭐', '✨', '💎', '🎊', '🧗'],
          certificateTitle: 'SUMMIT 90,000 MASTER CONQUEST',
          certificateCode: `CDS-2026-SUMMIT-90000`,
        };
      case 'rocket':
        return {
          glowColor: 'rgba(249, 115, 22, 0.5)',
          borderClass: 'border-orange-500/80',
          gradientBg: 'from-rose-950/50 via-orange-950/20 to-black',
          badgeClass: 'bg-gradient-to-r from-rose-500/25 to-orange-500/25 text-orange-300 border-orange-400/60 shadow-orange-500/20',
          sunburstColor: 'rgba(239, 68, 68, 0.25)',
          shockwaveColor: 'border-orange-500/50',
          bigEmoji: '🚀',
          targetNumeral: '9 5 , 0 0 0',
          cutsceneTitle: 'FINAL COUNTDOWN 95,000',
          chapterTitle: 'CHAPTER 3 : 실버버튼 궤도 초고속 진입',
          heroTitle: '실버버튼 파이널 카운트다운 돌입!',
          subtitle: `엔진 최대 출력 풀가동! 실버버튼까지 단 ${Math.max(0, 100000 - currentSubs).toLocaleString()}명 남았습니다! 🔥⚡`,
          quote: '"마지막 5천 명, 아무도 이 질주를 멈출 수 없습니다!"',
          particles: ['🚀', '🔥', '⚡', '💥', '✨', '🎉', '🌌'],
          certificateTitle: 'FINAL COUNTDOWN 95,000 ORBIT',
          certificateCode: `CDS-2026-WARP-95000`,
        };
      case 'silver':
      default:
        return {
          glowColor: 'rgba(226, 232, 240, 0.65)',
          borderClass: 'border-slate-200/90',
          gradientBg: 'from-slate-400/25 via-indigo-950/35 to-black',
          badgeClass: 'bg-gradient-to-r from-slate-200/25 to-indigo-300/25 text-white border-slate-300/70 shadow-slate-300/20',
          sunburstColor: 'rgba(255, 255, 255, 0.35)',
          shockwaveColor: 'border-slate-200/60',
          bigEmoji: '🥈',
          targetNumeral: '1 0 0 , 0 0 0',
          cutsceneTitle: '100,000 SILVER PLAY BUTTON',
          chapterTitle: 'FINAL CHAPTER : 영광의 실버버튼 대관식',
          heroTitle: '영광의 10만 실버버튼 정복 완료!',
          subtitle: '대한민국 상위 크리에이터 등극! 모든 크리에이터의 영광스러운 꿈을 이뤄냈습니다! 🏆',
          quote: '"유튜브 본사에서 날아오는 은빛 트로피의 진정한 주인공입니다!"',
          particles: ['🥈', '👑', '🏆', '✨', '🎉', '🌟', '💎'],
          certificateTitle: '100,000 SILVER PLAY BUTTON MASTER',
          certificateCode: `CDS-2026-SILVER-100000`,
        };
    }
  };

  const config = getCutsceneConfig();

  // Next milestone calculation
  const getNextTargetInfo = () => {
    if (milestone.target === 88888) {
      const remainingToNext = Math.max(0, 90000 - currentSubs);
      return {
        label: '다음 기착지 (9만 고지)',
        value: `${remainingToNext.toLocaleString()}명 남음`,
        subtext: '9만 고지 정복 눈앞! 🚩',
        colorClass: 'text-amber-300'
      };
    }
    if (milestone.target === 90000) {
      const remainingToNext = Math.max(0, 95000 - currentSubs);
      return {
        label: '다음 기착지 (9.5만 파이널)',
        value: `${remainingToNext.toLocaleString()}명 남음`,
        subtext: '실버버튼 가시권 진입 🚀',
        colorClass: 'text-emerald-300'
      };
    }
    if (milestone.target === 95000) {
      const remainingTo100k = Math.max(0, 100000 - currentSubs);
      return {
        label: '최종 목표 (10만 실버버튼)',
        value: `${remainingTo100k.toLocaleString()}명 남음`,
        subtext: '마지막 5천 명 결승선 돌진! 🔥',
        colorClass: 'text-rose-400'
      };
    }
    return {
      label: '최종 10만 실버버튼',
      value: '🏆 정복 완료!',
      subtext: '모든 마일스톤 완수 ✨',
      colorClass: 'text-yellow-300 font-extrabold'
    };
  };

  const nextInfo = getNextTargetInfo();

  // 22 High-visibility glowing tumbling metallic confetti ribbons
  const confettiPieces = [
    { color: '#ffd700', left: '3%', delay: '0s', size: 'w-4 h-6', duration: '2.8s', isStar: true },
    { color: '#ff0055', left: '7%', delay: '0.35s', size: 'w-4.5 h-7', duration: '3.2s', isStar: false },
    { color: '#00f0ff', left: '12%', delay: '0.1s', size: 'w-5 h-5', duration: '2.6s', isStar: true },
    { color: '#facc15', left: '16%', delay: '0.5s', size: 'w-3.5 h-6', duration: '3.4s', isStar: false },
    { color: '#10b981', left: '21%', delay: '0.2s', size: 'w-6 h-3.5', duration: '2.9s', isStar: false },
    { color: '#bf5af2', left: '26%', delay: '0.7s', size: 'w-4 h-8', duration: '3.1s', isStar: true },
    { color: '#ffffff', left: '30%', delay: '0.05s', size: 'w-4 h-6', duration: '2.7s', isStar: false },
    { color: '#ff9500', left: '35%', delay: '0.4s', size: 'w-5 h-5', duration: '3.3s', isStar: false },
    { color: '#f43f5e', left: '39%', delay: '0.85s', size: 'w-4.5 h-7', duration: '3.0s', isStar: true },
    { color: '#ffd700', left: '44%', delay: '0.15s', size: 'w-3.5 h-6', duration: '2.8s', isStar: false },
    { color: '#00ff88', left: '48%', delay: '0.6s', size: 'w-6 h-3.5', duration: '3.5s', isStar: true },
    { color: '#38bdf8', left: '52%', delay: '0.25s', size: 'w-4 h-8', duration: '2.9s', isStar: false },
    { color: '#ec4899', left: '57%', delay: '0.9s', size: 'w-4 h-6', duration: '3.2s', isStar: false },
    { color: '#facc15', left: '61%', delay: '0.08s', size: 'w-5 h-5', duration: '2.7s', isStar: true },
    { color: '#ffffff', left: '66%', delay: '0.45s', size: 'w-4.5 h-7', duration: '3.1s', isStar: false },
    { color: '#bf5af2', left: '70%', delay: '0.75s', size: 'w-3.5 h-6', duration: '3.4s', isStar: false },
    { color: '#10b981', left: '75%', delay: '0.3s', size: 'w-6 h-3.5', duration: '2.8s', isStar: true },
    { color: '#ff0055', left: '79%', delay: '0.65s', size: 'w-4 h-8', duration: '3.0s', isStar: false },
    { color: '#00f0ff', left: '84%', delay: '0.18s', size: 'w-4 h-6', duration: '3.3s', isStar: false },
    { color: '#ffd700', left: '88%', delay: '0.55s', size: 'w-5 h-5', duration: '2.6s', isStar: true },
    { color: '#ff9500', left: '93%', delay: '0.35s', size: 'w-4.5 h-7', duration: '3.2s', isStar: false },
    { color: '#facc15', left: '97%', delay: '0.8s', size: 'w-4 h-6', duration: '2.9s', isStar: false },
  ];

  // =========================================================================
  // 🎬 BESPOKE CINEMATIC THEATER STAGE (풀 애니메이션 연출 무대)
  // =========================================================================
  const renderCinematicStage = (isCinemaScreen: boolean = false) => {
    switch (milestone.theme) {
      case 'peak':
        // 9만 고지: 산악 등반, 깃발 완착 & 하늘로 치솟는 에메랄드 오로라 빔
        return (
          <div className={`relative w-full ${isCinemaScreen ? 'max-w-xl h-64 sm:h-80' : 'max-w-sm h-36 sm:h-42'} my-2 flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-950/60 via-zinc-950 to-zinc-950 border-2 border-emerald-500/50 shadow-2xl transition-all`}>
            {/* Mountain SVG Silhouette */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none" 
              viewBox="0 0 320 140" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="peakBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#065f46" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#022c22" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="peakFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                  <stop offset="45%" stopColor="#059669" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#022c22" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="auroraBeam" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
                </linearGradient>
              </defs>

              <polygon points="20,140 90,45 170,140" fill="url(#peakBackGrad)" />
              <polygon points="150,140 240,55 315,140" fill="url(#peakBackGrad)" />
              <polygon points="50,140 160,22 270,140" fill="url(#peakFrontGrad)" stroke="#34d399" strokeWidth="1.5" />
              <polygon points="130,55 160,22 190,55 175,50 160,58 145,50" fill="url(#snowGrad)" />

              <path 
                d="M 75,135 Q 110,110 125,85 T 160,35" 
                fill="none" 
                stroke="#6ee7b7" 
                strokeWidth="2.5" 
                strokeDasharray="4 4" 
                opacity="0.8" 
              />
            </svg>

            {/* Northern Lights / Aurora Sky Glow */}
            <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-teal-500/20 via-emerald-500/10 to-transparent blur-xl pointer-events-none" />

            {/* Climber scaling up the ridge */}
            <div className={`absolute left-[36%] bottom-[42%] ${isCinemaScreen ? 'text-4xl' : 'text-xl'} select-none animate-climb drop-shadow-lg z-10`}>
              🧗
            </div>

            {/* Vertical Aurora Beacon of Light shooting up from summit on climax */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-full pointer-events-none overflow-hidden z-15">
              <div 
                className="w-full h-full animate-beacon-beam"
                style={{
                  background: 'linear-gradient(to top, rgba(52, 211, 153, 0.95), rgba(6, 182, 212, 0.6), transparent)',
                  filter: 'blur(3px)',
                }}
              />
            </div>

            {/* Glowing Summit Beacon of Light */}
            <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-emerald-400/30 blur-xl pointer-events-none animate-beacon-flare" />
            <div className="absolute top-[3%] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 border-emerald-300 animate-beacon-flare pointer-events-none" />

            {/* Planted Summit Flag (Strikes down with impact!) */}
            <div className="absolute top-[8%] left-1/2 -translate-x-1/2 flex items-center justify-center animate-flag-strike z-20">
              <span className={`${isCinemaScreen ? 'text-6xl sm:text-7xl' : 'text-4xl sm:text-5xl'} select-none filter drop-shadow-[0_0_20px_rgba(239,68,68,0.95)]`}>
                🚩
              </span>
            </div>

            {/* Floating mountain mist & sparkles */}
            <div className="absolute top-2 left-6 text-sm animate-float-sparkle opacity-80">✨</div>
            <div className="absolute top-3 right-8 text-sm animate-float-sparkle opacity-80" style={{ animationDelay: '0.6s' }}>⭐</div>
            <div className="absolute top-8 left-16 text-lg animate-float-slow opacity-60">☁️</div>
            <div className="absolute top-10 right-14 text-lg animate-float-slow opacity-60" style={{ animationDelay: '1s' }}>☁️</div>

            {/* Summit Conquest Stone Plaque */}
            <div className="absolute bottom-2 inset-x-3 py-1.5 px-3 rounded-xl bg-black/85 border border-emerald-500/50 text-[11px] font-mono font-bold text-emerald-300 flex items-center justify-between z-20 shadow-md">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                90,000M 정상 능선 정복
              </span>
              <span className="text-zinc-300 font-bold">🚩 깃발 완착 완료</span>
            </div>
          </div>
        );

      case 'silver':
        // 10만 실버버튼: 천상에서 강림하는 대형 실버버튼 & 레이저 채널명 각인
        return (
          <div className={`relative w-full ${isCinemaScreen ? 'max-w-xl h-64 sm:h-80' : 'max-w-sm h-36 sm:h-44'} my-2 flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/60 via-zinc-950 to-zinc-950 border-2 border-slate-300/60 shadow-2xl`}>
            {/* Twin Searchlights sweeping from heavens */}
            <div className="absolute -top-12 left-1/4 w-32 h-64 bg-gradient-to-b from-white/40 via-slate-300/15 to-transparent rotate-12 blur-sm pointer-events-none" />
            <div className="absolute -top-12 right-1/4 w-32 h-64 bg-gradient-to-b from-white/40 via-slate-300/15 to-transparent -rotate-12 blur-sm pointer-events-none" />

            {/* Descending Silver Play Button Plaque */}
            <div className="relative z-10 flex flex-col items-center animate-descent-drop">
              {/* Floating Crown above trophy */}
              <div className={`${isCinemaScreen ? 'text-4xl' : 'text-2xl'} -mb-1 animate-bounce select-none filter drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]`}>
                👑
              </div>

              {/* The Silver Play Button Plaque */}
              <div 
                className={`${isCinemaScreen ? 'w-64 sm:w-80 py-4 px-6' : 'w-52 sm:w-60 py-3 px-4'} rounded-2xl bg-gradient-to-tr from-slate-300 via-white to-slate-200 border-2 border-white shadow-2xl flex flex-col items-center justify-center relative overflow-hidden text-zinc-950`}
                style={{
                  boxShadow: '0 0 50px rgba(255, 255, 255, 0.8), inset 0 0 20px rgba(255,255,255,0.9)',
                }}
              >
                {/* Mirror Sheen Light Sweep */}
                <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-sheen pointer-events-none" />

                {/* Laser Engraving Beam Line */}
                <div className="absolute inset-x-0 bottom-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser-sweep pointer-events-none" />

                {/* Inset YouTube Play Triangle */}
                <div className={`${isCinemaScreen ? 'w-20 h-14' : 'w-14 h-10'} rounded-xl bg-gradient-to-b from-slate-700 via-slate-900 to-black border border-white/60 flex items-center justify-center shadow-inner my-1 relative`}>
                  <div className={`w-0 h-0 ${isCinemaScreen ? 'border-t-[10px] border-b-[10px] border-l-[18px]' : 'border-t-[8px] border-b-[8px] border-l-[14px]'} border-t-transparent border-b-transparent border-l-white ml-0.5 filter drop-shadow-md`} />
                </div>

                <div className="text-center mt-1 space-y-0.5">
                  <div className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase font-mono text-zinc-700">
                    YOUTUBE CREATOR AWARDS
                  </div>
                  {/* Laser-Engraved Channel Name */}
                  <div className="text-[12px] sm:text-[13px] font-black tracking-wider text-zinc-950 font-mono flex items-center justify-center gap-1">
                    <span>PRESENTED TO</span>
                    <strong className="text-blue-900 bg-blue-100/70 px-1 rounded">'{channelName}'</strong>
                  </div>
                  <div className="text-[11px] sm:text-[12px] font-extrabold tracking-wider text-zinc-800 font-mono">
                    FOR PASSING 100,000 SUBSCRIBERS
                  </div>
                </div>

                <span className="absolute top-1.5 left-2 text-[10px] text-amber-500 animate-ping">✦</span>
                <span className="absolute top-1.5 right-2 text-[10px] text-cyan-400 animate-ping" style={{ animationDelay: '0.4s' }}>✦</span>
              </div>

              <div className="w-40 h-2.5 rounded-full bg-white/50 blur-sm mt-1 animate-pulse" />
            </div>

            <div className="absolute top-3 left-6 text-sm animate-float-sparkle">✨</div>
            <div className="absolute top-3 right-6 text-sm animate-float-sparkle" style={{ animationDelay: '0.5s' }}>💎</div>
            <div className="absolute bottom-3 left-8 text-sm animate-float-sparkle" style={{ animationDelay: '0.8s' }}>⭐</div>
            <div className="absolute bottom-3 right-8 text-sm animate-float-sparkle" style={{ animationDelay: '1.2s' }}>✨</div>
          </div>
        );

      case 'gold':
        // 88,888: 5개 릴이 차례대로 걸리는 황금 슬롯머신 & 3D 코인 폭풍
        return (
          <div className={`relative w-full ${isCinemaScreen ? 'max-w-xl h-64 sm:h-80' : 'max-w-sm h-36 sm:h-42'} my-2 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-amber-950/60 via-zinc-950 to-zinc-950 border-2 border-amber-400/70 shadow-2xl p-3`}>
            {/* Falling Gold Coin Shower */}
            <div className="absolute -top-4 left-4 text-2xl animate-coin-fall select-none pointer-events-none">🪙</div>
            <div className="absolute -top-4 left-10 text-xl animate-coin-fall select-none pointer-events-none" style={{ animationDelay: '0.4s' }}>💰</div>
            <div className="absolute -top-4 right-4 text-2xl animate-coin-fall select-none pointer-events-none" style={{ animationDelay: '0.2s' }}>🪙</div>
            <div className="absolute -top-4 right-10 text-xl animate-coin-fall select-none pointer-events-none" style={{ animationDelay: '0.7s' }}>🍀</div>

            {/* Marquee Banner */}
            <div className="mb-2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-400/40 to-amber-500/25 border border-amber-400/80 text-[11px] font-black text-amber-200 font-mono tracking-widest flex items-center gap-1.5 animate-pulse">
              <span>⭐</span>
              <span>LUCKY 88,888 JACKPOT</span>
              <span>⭐</span>
            </div>

            {/* 5 Golden Reels Aligning [8] [8] [8] [8] [8] */}
            <div className="flex items-center justify-center gap-2 relative z-10">
              {['8', '8', '8', '8', '8'].map((digit, idx) => (
                <div 
                  key={idx}
                  className={`${isCinemaScreen ? 'w-14 h-20 sm:w-16 sm:h-24 text-4xl sm:text-5xl' : 'w-10 h-14 sm:w-11 sm:h-16 text-2xl sm:text-3xl'} rounded-2xl bg-gradient-to-b from-amber-300 via-yellow-200 to-amber-500 border-2 border-yellow-100 shadow-xl flex items-center justify-center font-black font-mono text-zinc-950 relative overflow-hidden animate-slot-roll`}
                  style={{
                    animationDelay: `${idx * 0.28}s`,
                    boxShadow: '0 0 25px rgba(245, 158, 11, 0.6)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-transparent to-black/25 pointer-events-none" />
                  <span className="relative z-10 filter drop-shadow">{digit}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 text-xs text-amber-300 font-bold flex items-center gap-1.5 font-mono">
              <span>💰</span>
              <span className="tracking-wider">황금빛 트리플 8 대박 잭팟 발동!</span>
              <span>💰</span>
            </div>
          </div>
        );

      case 'rocket':
        // 95,000: 3-2-1 디지털 카운트다운, 초고속 플라즈마 궤도 워프
        return (
          <div className={`relative w-full ${isCinemaScreen ? 'max-w-xl h-64 sm:h-80' : 'max-w-sm h-36 sm:h-42'} my-2 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-rose-950/50 via-zinc-950 to-zinc-950 border-2 border-orange-500/70 shadow-2xl p-3`}>
            {/* Warp speed lines */}
            <div className="absolute inset-0 flex justify-around pointer-events-none opacity-40">
              <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-orange-400 to-transparent animate-warp" />
              <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-red-500 to-transparent animate-warp" style={{ animationDelay: '0.3s' }} />
              <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-amber-300 to-transparent animate-warp" style={{ animationDelay: '0.7s' }} />
            </div>

            <div className="mb-2 px-3.5 py-0.5 rounded-full bg-red-500/25 border border-red-500/50 text-[10px] font-black text-rose-300 font-mono tracking-widest flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>STAGE 3 BURST • 95,000 KM/H</span>
            </div>

            {/* Roaring Rocket */}
            <div className="relative flex flex-col items-center animate-lift-off z-10">
              <div className={`${isCinemaScreen ? 'text-6xl sm:text-7xl' : 'text-4xl sm:text-5xl'} select-none filter drop-shadow-[0_0_20px_rgba(249,115,22,0.95)] animate-rocket-rumble`}>
                🚀
              </div>

              <div className="flex items-center gap-1.5 -mt-2 animate-flame-pulse">
                <div className={`${isCinemaScreen ? 'w-3.5 h-10' : 'w-2.5 h-7'} bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent rounded-full blur-[1px]`} />
                <div className={`${isCinemaScreen ? 'w-5 h-12' : 'w-3.5 h-9'} bg-gradient-to-b from-white via-amber-400 to-red-600 rounded-full blur-[1px]`} />
                <div className={`${isCinemaScreen ? 'w-3.5 h-10' : 'w-2.5 h-7'} bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent rounded-full blur-[1px]`} />
              </div>

              <div className="text-sm -mt-2 opacity-85 filter blur-[0.5px]">
                💨 💥 💨
              </div>
            </div>

            <div className="mt-1 text-[11px] text-orange-300 font-bold font-mono tracking-wider">
              10만 실버버튼 궤도 진입 완료 🔥
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300 select-none overflow-hidden ${
        isScreenShaking ? 'animate-screen-shake' : ''
      }`}
      onClick={handleStageClick}
    >
      {/* 0. Whiteout Flash Overlay (클라이맥스 순간 0.25초 눈부신 섬광) */}
      {isWhiteoutFlash && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none animate-whiteout-flash" />
      )}

      {/* 1. Cinematic Letterbox Bars (21:9 Aspect Ratio) */}
      <div className="absolute top-0 inset-x-0 h-11 sm:h-14 bg-black border-b border-zinc-800 z-40 flex items-center justify-between px-3 sm:px-6 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] tracking-widest text-zinc-400 font-mono uppercase truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
          <span className="truncate">{isPlayingCutscene ? '● CINEMATIC CUTSCENE' : 'MILESTONE ARCHIVE'}</span>
        </div>
        
        {/* Right header controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="text-[10px] hidden xs:inline">{isMuted ? '음소거' : '사운드 ON'}</span>
          </button>

          {/* Skip button if playing */}
          {isPlayingCutscene ? (
            <button
              type="button"
              onClick={handleSkipCutscene}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-amber-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              title="컷신 스킵하기"
            >
              <span className="text-[11px] sm:text-xs">스킵</span>
              <FastForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          ) : (
            <div className="text-[10px] sm:text-[11px] text-zinc-400 font-mono tracking-wider">
              ESC / 닫기
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-10 sm:h-14 bg-black border-t border-zinc-800 z-40 flex items-center justify-between px-3 sm:px-6 pointer-events-none">
        <span className="text-[9px] sm:text-[11px] text-zinc-500 font-mono tracking-widest uppercase truncate max-w-[200px] sm:max-w-none">
          {config.chapterTitle}
        </span>
        {isPlayingCutscene && (
          <span className="text-[9px] sm:text-[10px] font-mono text-amber-400 animate-pulse font-bold whitespace-nowrap">
            [ AUTO PLAYING ]
          </span>
        )}
      </div>

      {/* 2. Concept Atmosphere Background (Sunburst & Falling Confetti) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute inset-0 opacity-30 animate-sunburst flex items-center justify-center"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${config.sunburstColor} 0%, transparent 65%)`,
          }}
        >
          <div className="w-[850px] h-[850px] rounded-full border-2 border-white/5 opacity-40" />
          <div className="w-[650px] h-[650px] rounded-full border border-white/10 opacity-30" />
        </div>

        {/* Shockwave Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-80 h-80 rounded-full border-4 ${config.shockwaveColor} animate-shockwave`} />
          <div className={`w-96 h-96 rounded-full border-2 ${config.shockwaveColor} animate-shockwave`} style={{ animationDelay: '0.8s' }} />
        </div>

        {/* Falling Glowing Confetti (High-Visibility Metallic Pieces) */}
        {confettiPieces.map((p, idx) => (
          <div
            key={`${burstCount}-${idx}`}
            className={`absolute -top-12 ${p.size} rounded-sm animate-confetti-tumble pointer-events-none z-10 flex items-center justify-center`}
            style={{
              backgroundColor: p.color,
              left: p.left,
              animationDelay: p.delay,
              '--fall-duration': p.duration,
              filter: `drop-shadow(0 0 10px ${p.color})`,
              boxShadow: `0 0 14px ${p.color}`,
              opacity: 0.95,
            } as React.CSSProperties}
          >
            {p.isStar && (
              <span className="text-[11px] text-white font-black block text-center select-none filter drop-shadow">✦</span>
            )}
          </div>
        ))}

        {/* High-Visibility Radial Firework Particles with 360-degree Outward Burst */}
        {clickFireworks.map(pt => (
          <div
            key={pt.id}
            className="fixed pointer-events-none z-50 animate-radial-spark select-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${pt.originX}px`,
              top: `${pt.originY}px`,
              '--tx': `${pt.tx}px`,
              '--ty': `${pt.ty}px`,
              animationDelay: `${pt.delay}s`,
            } as React.CSSProperties}
          >
            {pt.isEmoji ? (
              <span 
                className="text-2xl sm:text-3xl filter select-none"
                style={{
                  filter: `drop-shadow(0 0 14px ${pt.color}) drop-shadow(0 0 26px ${pt.color})`,
                }}
              >
                {pt.content}
              </span>
            ) : (
              <div
                className="rounded-full select-none"
                style={{
                  width: `${pt.size}px`,
                  height: `${pt.size}px`,
                  backgroundColor: pt.color,
                  boxShadow: `0 0 18px ${pt.color}, 0 0 32px ${pt.color}`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 🎬 MODE 1: PURE UNINTERRUPTED GAME CUTSCENE (상호작용 잠금 영화 모드) */}
      {/* ========================================================================= */}
      {isPlayingCutscene ? (
        <div 
          className="relative z-20 flex flex-col items-center justify-center text-center max-w-2xl w-full px-4 animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Chapter Opening Header */}
          <div className="space-y-1 mb-3">
            <span className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase block animate-pulse">
              ★ MILESTONE SPECIAL CINEMATIC ★
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              {config.chapterTitle}
            </h1>
          </div>

          {/* Widescreen Full Cinema Stage with Cinematic Zoom */}
          <div className="w-full flex justify-center animate-cinematic-zoom">
            {renderCinematicStage(true)}
          </div>

          {/* Subtitle Message during cutscene */}
          <div className="mt-3 max-w-lg space-y-1 animate-in fade-in duration-300">
            <p className="text-base sm:text-lg font-black text-white font-mono tracking-wide drop-shadow">
              {cutsceneStep >= 2 ? config.heroTitle : config.subtitle}
            </p>
            <p className="text-xs text-amber-300/90 italic font-serif">
              {config.quote}
            </p>
          </div>

          {/* Auto Timeline Bar */}
          <div className="w-56 bg-zinc-900/90 rounded-full h-1 mt-4 overflow-hidden border border-zinc-800">
            <div className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 rounded-full animate-pulse w-full transition-all duration-3000 ease-linear" />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1">
            잠시 후 달성 기록 카드가 자동으로 공개됩니다...
          </span>
        </div>
      ) : (
        /* ========================================================================= */
        /* 🏆 MODE 2: GRAND RESULT & REWARD VIEW (결과 확인 / 공식 인증서 전환 뷰) */
        /* ========================================================================= */
        <div
          className={`bg-gradient-to-b ${config.gradientBg} border-2 ${config.borderClass} rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col items-center text-center p-4 sm:p-7 cursor-default z-20 animate-in zoom-in-90 duration-300 my-auto max-h-[88dvh] overflow-y-auto no-scrollbar`}
          style={{
            boxShadow: `0 0 70px ${config.glowColor}, inset 0 0 40px rgba(0,0,0,0.85)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button in corner */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2.5 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer z-30"
            title="스튜디오로 돌아가기 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* View Tab Switcher: [ 🏆 달성 결과 카드 ] | [ 📜 공식 명예 인증서 ] */}
          <div className="flex items-center bg-zinc-950/90 border border-zinc-700/80 p-1 rounded-2xl mb-3 z-30 shadow-md">
            <button
              type="button"
              onClick={() => setActiveViewTab('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeViewTab === 'card'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>달성 결과 카드</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('certificate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeViewTab === 'certificate'
                  ? 'bg-gradient-to-r from-slate-200 to-indigo-300 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>📜 공식 명예 인증서</span>
            </button>
          </div>

          {/* TAB 1: RESULT CARD VIEW */}
          {activeViewTab === 'card' ? (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
              {/* Mini Centerpiece Stage Preview */}
              {renderCinematicStage(false)}

              {/* Target Numeral Display */}
              <div className="my-1">
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-widest drop-shadow-md">
                  {config.targetNumeral}
                </div>
                <div className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-400 mt-1 font-mono">
                  {config.cutsceneTitle}
                </div>
              </div>

              {/* Hero Title & Subtitle */}
              <div className="space-y-1 mt-1">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {config.heroTitle}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-200 max-w-md mx-auto leading-relaxed">
                  {config.subtitle}
                </p>
              </div>

              {/* Stats Box (Current vs Next Station) */}
              <div className="w-full grid grid-cols-2 gap-3 my-3">
                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-left">
                  <div className="text-[10px] text-zinc-400 font-mono uppercase">현재 총 구독자</div>
                  <div className="text-base sm:text-lg font-black text-white font-mono mt-0.5">
                    {currentSubs.toLocaleString()}명
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                    {milestone.label} 달성 인증 완료 ✅
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-left">
                  <div className="text-[10px] text-zinc-400 font-mono uppercase">{nextInfo.label}</div>
                  <div className={`text-base sm:text-lg font-black font-mono mt-0.5 ${nextInfo.colorClass}`}>
                    {nextInfo.value}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    {nextInfo.subtext}
                  </div>
                </div>
              </div>

              {/* 100k Time Capsule Trigger if Silver Milestone */}
              {milestone.target === 100000 && timeCapsule && onOpenTimeCapsule && (
                <div className="w-full mb-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-5 h-5 text-amber-300 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5 flex-wrap">
                        <span>10만 타임캡슐 편지가 도착했습니다!</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300">봉인 해제</span>
                      </div>
                      <div className="text-[11px] text-zinc-300 mt-0.5">
                        {timeCapsule.writtenSubs.toLocaleString()}명 시절 내가 쓴 편지를 지금 바로 열어보세요.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenTimeCapsule}
                    className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black text-xs shrink-0 cursor-pointer shadow-md"
                  >
                    편지 읽기 📜
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: OFFICIAL CREATOR CERTIFICATE VIEW */
            <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
              <div 
                className="w-full p-4 sm:p-7 rounded-2xl bg-zinc-950 border-2 border-amber-400/80 shadow-2xl relative overflow-hidden text-center my-1"
                style={{
                  boxShadow: '0 0 35px rgba(245, 158, 11, 0.25), inset 0 0 25px rgba(0,0,0,0.9)',
                }}
              >
                {/* Guilloche Corner Accents */}
                <div className="absolute top-2 left-2 text-xs text-amber-400/70 font-mono">✦ ═════</div>
                <div className="absolute top-2 right-2 text-xs text-amber-400/70 font-mono">═════ ✦</div>
                <div className="absolute bottom-2 left-2 text-xs text-amber-400/70 font-mono">✦ ═════</div>
                <div className="absolute bottom-2 right-2 text-xs text-amber-400/70 font-mono">═════ ✦</div>

                <div className="text-[10px] font-mono tracking-widest text-amber-400/90 font-bold uppercase mb-1">
                  OFFICIAL CREATOR AWARDS • CREATOR DAILY STUDIO
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide font-serif mb-2">
                  명예 마일스톤 공식 인증서
                </h3>

                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-3" />

                {/* Recipient Channel */}
                <div className="my-2 space-y-0.5">
                  <div className="text-[11px] text-zinc-400">인증 크리에이터 채널</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                    "{channelName}"
                  </div>
                </div>

                {/* Achievement */}
                <div className="my-3 py-2 px-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-sans max-w-md mx-auto">
                  위 크리에이터는 끊임없는 열정으로 유튜브 <strong>{milestone.label}</strong> ({milestone.badge}) 고지를 정복하였기에, 크리에이터 스튜디오 명예의 전당 공식 인증서를 수여합니다.
                </div>

                {/* Footer Certificate Stamp & ID */}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-500">
                  <div className="text-left">
                    <div>발급: CREATOR DAILY STUDIO</div>
                    <div>일자: 2026.09.29</div>
                  </div>

                  {/* Slamming Gold Seal Stamp */}
                  <div className="p-2 rounded-full border-2 border-amber-400 bg-amber-500/20 text-amber-300 font-black text-[10px] animate-seal-stamp shadow-md">
                    ★ OFFICIAL VERIFIED ★
                  </div>

                  <div className="text-right">
                    <div>고유 번호</div>
                    <div className="text-zinc-400 font-bold">{config.certificateCode}</div>
                  </div>
                </div>
              </div>

              {/* Share & Copy Button */}
              <div className="flex items-center gap-2 mt-2 w-full justify-center">
                <button
                  type="button"
                  onClick={handleCopyShareText}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedNotice ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">자랑글 복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>SNS / 커뮤니티 자랑글 복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 w-full pt-3 mt-1 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={handleReplayCutscene}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>컷신 다시 보기 🎬</span>
            </button>

            <button
              type="button"
              onClick={handleFireworkBarrage}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>축포 터뜨리기 🎆</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>스튜디오로 가기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
