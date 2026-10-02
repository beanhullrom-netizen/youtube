import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, FastForward } from 'lucide-react';
import { cutsceneAudio } from '../utils/cutsceneAudio';

interface SummitConquestCutsceneProps {
  channelName: string;
  onComplete: () => void;
  onSkip: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  length?: number;
  rotation?: number;
  rotSpeed?: number;
  color?: string;
}

export const SummitConquestCutscene: React.FC<SummitConquestCutsceneProps> = ({
  channelName,
  onComplete,
  onSkip,
  isMuted,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [elapsed, setElapsed] = useState<number>(0);
  const [currentScene, setCurrentScene] = useState<number>(1);
  const [isWhiteFlash, setIsWhiteFlash] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasHeartbeatPulsed, setHasHeartbeatPulsed] = useState<boolean>(false);
  const [emblemImpact, setEmblemImpact] = useState<boolean>(false);

  // Particles for canvas
  const blizzardSnow = useRef<Particle[]>([]);
  const rockShards = useRef<Particle[]>([]);
  const goldenEmbers = useRef<Particle[]>([]);
  const breathPuffs = useRef<Particle[]>([]);
  const shockwaveRadius = useRef<number>(0);

  // Initialize blizzard snow particles
  const initParticles = useCallback((w: number, h: number) => {
    blizzardSnow.current = [];
    for (let i = 0; i < 220; i++) {
      blizzardSnow.current.push({
        x: Math.random() * (w + 400) - 200,
        y: Math.random() * (h + 200) - 100,
        vx: -(12 + Math.random() * 16), // Whipping left
        vy: 8 + Math.random() * 12,    // Whipping down
        size: 1.5 + Math.random() * 3,
        length: 8 + Math.random() * 22,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }

    goldenEmbers.current = [];
    for (let i = 0; i < 65; i++) {
      goldenEmbers.current.push({
        x: Math.random() * w,
        y: h + Math.random() * 80,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(1.2 + Math.random() * 2.5),
        size: 1.5 + Math.random() * 3.5,
        alpha: 0.4 + Math.random() * 0.6,
        color: ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff'][Math.floor(Math.random() * 4)],
      });
    }
  }, []);

  // Keyboard navigation (ESC to skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cutsceneAudio.stopAll();
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  // Main Animation & Scene Director Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Start Foley audio timeline precisely
    cutsceneAudio.playSummitConquestScript();

    startTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const t = (now - startTimeRef.current) / 1000;
      setElapsed(t);

      const w = canvas.width;
      const h = canvas.height;

      // Scene Switching Timeline
      if (t < 3.0) {
        setCurrentScene(1);
      } else if (t < 4.5) {
        setCurrentScene(2);
      } else if (t < 6.5) {
        setCurrentScene(3);
      } else {
        setCurrentScene(4);
      }

      // ---------------------------------------------------------------------
      // Scene 2 Heartbeat Pulse at 3.8s
      // ---------------------------------------------------------------------
      if (t >= 3.8 && t < 4.1 && !hasHeartbeatPulsed) {
        setHasHeartbeatPulsed(true);
      }

      // ---------------------------------------------------------------------
      // Scene 3 Impact at 4.5s (Whiteout Flash, Violent Shake, Rock Shards)
      // ---------------------------------------------------------------------
      if (t >= 4.5 && t < 4.6 && !isWhiteFlash) {
        setIsWhiteFlash(true);
        setTimeout(() => setIsWhiteFlash(false), 90);

        // Generate 360 degree rock fragments
        rockShards.current = [];
        const impactX = w / 2;
        const impactY = h * 0.72;
        shockwaveRadius.current = 10;

        for (let i = 0; i < 45; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 6 + Math.random() * 18;
          rockShards.current.push({
            x: impactX,
            y: impactY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 4, // slight upward kick
            size: 4 + Math.random() * 9,
            alpha: 1,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.4,
            color: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'][Math.floor(Math.random() * 5)],
          });
        }
      }

      // Camera shake during Scene 3 impact
      if (t >= 4.5 && t < 5.3) {
        const decay = 1 - (t - 4.5) / 0.8;
        const mag = 18 * Math.max(0, decay);
        setScreenShake({
          x: (Math.random() - 0.5) * mag,
          y: (Math.random() - 0.5) * mag,
        });
      } else if (t >= 7.8 && t < 8.1) {
        // Micro shake on emblem strike at 7.8s
        if (!emblemImpact) setEmblemImpact(true);
        const decay = 1 - (t - 7.8) / 0.3;
        setScreenShake({
          x: (Math.random() - 0.5) * 8 * decay,
          y: (Math.random() - 0.5) * 8 * decay,
        });
      } else {
        setScreenShake({ x: 0, y: 0 });
      }

      // ---------------------------------------------------------------------
      // RENDER CANVAS
      // ---------------------------------------------------------------------
      ctx.clearRect(0, 0, w, h);

      // SCENE 1 & 2: Dark blizzard sky
      if (t < 4.5) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Snowstorm particle streaks
        ctx.save();
        blizzardSnow.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -100) p.x = w + 100;
          if (p.y > h + 50) p.y = -50;

          ctx.strokeStyle = `rgba(226, 232, 240, ${p.alpha})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.length!, p.y + p.length! * 0.7);
          ctx.stroke();
        });
        ctx.restore();

        // Fog drifting
        const fogGrad = ctx.createRadialGradient(w * 0.3, h * 0.6, 50, w * 0.3, h * 0.6, w * 0.6);
        fogGrad.addColorStop(0, 'rgba(148, 163, 184, 0.15)');
        fogGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // SCENE 3: Shockwave & Dispersal
      else if (t < 6.5) {
        // Sky transitioning from stormy dark to clearing
        const prog = (t - 4.5) / 2.0;
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(0.7, '#1e1b4b');
        bgGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Expanding shockwave ring
        if (shockwaveRadius.current > 0) {
          shockwaveRadius.current += 34; // Rapid expansion
          const impactX = w / 2;
          const impactY = h * 0.72;

          ctx.save();
          ctx.beginPath();
          ctx.arc(impactX, impactY, shockwaveRadius.current, 0, Math.PI * 2);
          const alpha = Math.max(0, 1 - shockwaveRadius.current / (w * 1.2));
          ctx.strokeStyle = `rgba(52, 211, 153, ${alpha * 0.8})`;
          ctx.lineWidth = 14 * alpha;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 30;
          ctx.stroke();

          // Second outer sonic ring
          ctx.beginPath();
          ctx.arc(impactX, impactY, shockwaveRadius.current * 0.75, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
          ctx.lineWidth = 4 * alpha;
          ctx.stroke();
          ctx.restore();
        }

        // Flying rock debris with physics
        ctx.save();
        rockShards.current.forEach((r) => {
          r.x += r.vx;
          r.y += r.vy;
          r.vy += 0.45; // gravity
          r.rotation! += r.rotSpeed!;
          r.alpha = Math.max(0, r.alpha - 0.012);

          ctx.save();
          ctx.translate(r.x, r.y);
          ctx.rotate(r.rotation!);
          ctx.fillStyle = r.color!;
          ctx.globalAlpha = r.alpha;
          ctx.beginPath();
          ctx.moveTo(-r.size, -r.size);
          ctx.lineTo(r.size * 1.2, -r.size * 0.5);
          ctx.lineTo(r.size * 0.8, r.size);
          ctx.lineTo(-r.size * 0.5, r.size * 0.8);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
        ctx.restore();

        // Blizzard snow particles blown away radially
        blizzardSnow.current.forEach((p) => {
          const dx = p.x - w / 2;
          const dy = p.y - h * 0.72;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          p.x += (dx / dist) * 28;
          p.y += (dy / dist) * 28;
          p.alpha = Math.max(0, p.alpha - 0.025);

          ctx.fillStyle = `rgba(226, 232, 240, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // SCENE 4: Glorious Golden Sea of Clouds (운해) & Sunset/Sunrise
      else {
        // Panoramic Golden Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#1e1b4b');   // Deep twilight indigo
        skyGrad.addColorStop(0.35, '#831843'); // Crimson rose
        skyGrad.addColorStop(0.6, '#b45309');  // Warm amber
        skyGrad.addColorStop(0.78, '#f59e0b'); // Radiant gold
        skyGrad.addColorStop(1, '#fef08a');    // Horizon sunlight
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Volumetric God Rays (빛줄기) piercing skyward
        ctx.save();
        for (let ray = -3; ray <= 3; ray++) {
          const rayGrad = ctx.createLinearGradient(w / 2, h * 0.7, w / 2 + ray * 220, 0);
          rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
          rayGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.08)');
          rayGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(w / 2 - 40, h * 0.75);
          ctx.lineTo(w / 2 + ray * 280 - 60, 0);
          ctx.lineTo(w / 2 + ray * 280 + 60, 0);
          ctx.lineTo(w / 2 + 40, h * 0.75);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Rolling Golden Cloud Sea Waves (운해)
        const cloudY = h * 0.68;
        for (let layer = 0; layer < 3; layer++) {
          const lOffset = layer * 40;
          const waveSpeed = t * 0.3 + layer * 10;
          ctx.save();
          ctx.fillStyle = layer === 0 ? 'rgba(253, 230, 138, 0.85)' : layer === 1 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(180, 83, 9, 0.95)';
          ctx.beginPath();
          ctx.moveTo(0, h);
          ctx.lineTo(0, cloudY + lOffset);
          for (let x = 0; x <= w; x += 40) {
            const y = cloudY + lOffset + Math.sin((x * 0.005) + waveSpeed) * 16 + Math.cos((x * 0.012) + waveSpeed * 0.7) * 10;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Floating Golden Embers & Dust
        ctx.save();
        goldenEmbers.current.forEach((e) => {
          e.y += e.vy;
          e.x += e.vx + Math.sin(t * 2 + e.y * 0.02) * 0.5;
          if (e.y < -20) {
            e.y = h + 20;
            e.x = Math.random() * w;
          }
          ctx.fillStyle = e.color || '#fbbf24';
          ctx.globalAlpha = e.alpha;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // Check for completion (~10.5 seconds)
      if (t >= 10.5) {
        onComplete();
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initParticles, onComplete, isWhiteFlash, hasHeartbeatPulsed, emblemImpact]);

  // Handle explicit Skip
  const handleSkip = () => {
    cutsceneAudio.stopAll();
    onSkip();
  };

  // Formatted timer string
  const formatTime = (secs: number) => {
    const s = Math.min(10, Math.floor(secs));
    return `00:${s.toString().padStart(2, '0')} / 00:10`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black overflow-hidden select-none flex flex-col justify-between"
      style={{
        transform: `translate(${screenShake.x}px, ${screenShake.y}px)`,
        transition: 'transform 0.04s linear',
      }}
    >
      {/* Blinding White Flash at 4.5s Impact */}
      {isWhiteFlash && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none animate-whiteout-flash" />
      )}

      {/* Background Interactive Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* ===================================================================== */}
      {/* 1. TOP CINEMATIC BAR (헤더 / 시간 / 사운드 / 스킵) */}
      {/* ===================================================================== */}
      <div className="relative z-40 h-14 bg-black/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 sm:px-8">
        {/* Left: Scene Status */}
        <div className="flex items-center gap-3 font-mono text-xs sm:text-sm">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
          </span>
          <span className="text-zinc-200 font-extrabold tracking-wider uppercase">
            {currentScene === 1 && 'SCENE 1: 한계 돌파 (극한의 사투)'}
            {currentScene === 2 && 'SCENE 2: 폭풍전야와 정적 (무음 & 심장 박동)'}
            {currentScene === 3 && 'SCENE 3: 격돌과 충격파 (깃발 완착 & 지진)'}
            {currentScene === 4 && 'SCENE 4: 시야 개방과 정복 엠블럼 (황금빛 운해)'}
          </span>
        </div>

        {/* Center / Right: Time + Controls */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block font-mono text-xs text-amber-400 font-bold bg-zinc-900/90 px-3 py-1 rounded-full border border-zinc-700/80">
            ⏱️ {formatTime(elapsed)}
          </span>

          {/* Mute Button */}
          <button
            type="button"
            onClick={onToggleMute}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isMuted ? '음소거' : '사운드 ON'}</span>
          </button>

          {/* Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-black text-xs font-mono transition-all shadow-md active:scale-95 cursor-pointer"
            title="컷신 스킵하고 결과 카드 바로 보기 (ESC)"
          >
            <span>스킵 (SKIP)</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. THEATER STAGE: SCENE-BY-SCENE CINEMATIC ACTING */}
      {/* ===================================================================== */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
        {/* ----------------------------------------------------------------- */}
        {/* [SCENE 1: 한계 돌파] (00:00 ~ 00:03) */}
        {/* 카메라 구도: 지면 밀착 로우 앵글 */}
        {/* 아이젠 등산화 쾅 딛기, 튀는 돌가루, 하얀 입김 김, 거친 손아귀 */}
        {/* ----------------------------------------------------------------- */}
        {currentScene === 1 && (
          <div className="relative w-full h-full flex flex-col items-center justify-end pb-12 animate-in fade-in duration-500">
            {/* Height glimpse behind: Sheer cliff drops into bottomless cloud void (2.2s ~ 2.9s) */}
            {elapsed >= 2.2 && (
              <div className="absolute inset-0 flex items-center justify-center opacity-40 transition-opacity duration-500">
                <div className="text-center font-mono text-xs text-slate-400 tracking-widest uppercase">
                  [ ELEVATION 89,950M • DESCENT VERTICAL CLIFFS BEYOND ]
                </div>
              </div>
            )}

            {/* Low-Angle Jagged Rock Ridge Silhouette */}
            <div className="relative w-full max-w-4xl h-72 flex items-end justify-center">
              <svg className="absolute bottom-0 w-full h-56" viewBox="0 0 1000 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="rockBaseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="40%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#090d16" />
                  </linearGradient>
                  <linearGradient id="iceCrack" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#93c5fd" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
                <polygon points="0,300 120,180 280,240 450,110 520,130 680,80 820,210 1000,160 1000,300" fill="url(#rockBaseGrad)" />
                <polyline points="450,110 470,140 500,160 520,130" stroke="url(#iceCrack)" strokeWidth="3" fill="none" opacity="0.8" />
              </svg>

              {/* Mountaineer's Heavy Boot with Steel Crampons (아이젠 찰착 등산화) */}
              <div 
                className="absolute bottom-16 left-[42%] flex flex-col items-center transition-all duration-300"
                style={{
                  transform: elapsed < 1.0 
                    ? 'translateY(-60px) rotate(-12deg) scale(1.15)' 
                    : 'translateY(0px) rotate(0deg) scale(1)',
                }}
              >
                {/* Cold White Breath Steam Puff Pumping Outwards */}
                <div 
                  className="absolute -top-24 -left-12 pointer-events-none"
                  style={{
                    opacity: elapsed >= 0.7 && elapsed <= 2.8 ? 0.85 : 0,
                    transform: `scale(${1 + (elapsed % 1.0) * 1.5}) translateY(-${(elapsed % 1.0) * 40}px)`,
                    filter: 'blur(8px)',
                  }}
                >
                  <div className="w-32 h-20 rounded-full bg-white/40 blur-md" />
                </div>

                {/* SVG Boot Silhouette with Sharp Spikes */}
                <svg width="220" height="150" viewBox="0 0 220 150" className="drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
                  {/* Thick Leg in Heavy Gore-Tex Pants */}
                  <path d="M 60,0 L 110,0 L 105,75 L 55,75 Z" fill="#0f172a" stroke="#334155" strokeWidth="3" />
                  {/* Boot Upper Body */}
                  <path d="M 50,70 L 115,70 L 130,95 L 185,100 L 195,125 L 35,125 L 40,85 Z" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
                  {/* Heavy Ankle Strap & Buckles */}
                  <rect x="52" y="80" width="55" height="10" rx="3" fill="#e2e8f0" opacity="0.8" />
                  <rect x="58" y="100" width="60" height="8" rx="2" fill="#f59e0b" />
                  {/* Steel Sole Platform */}
                  <rect x="30" y="125" width="170" height="12" rx="2" fill="#020617" stroke="#64748b" strokeWidth="1.5" />
                  {/* Sharp Steel Crampons (아이젠 가시 쇠촉) */}
                  <polygon points="38,137 45,149 52,137" fill="#e2e8f0" stroke="#94a3b8" />
                  <polygon points="70,137 77,149 84,137" fill="#e2e8f0" stroke="#94a3b8" />
                  <polygon points="120,137 127,150 134,137" fill="#e2e8f0" stroke="#94a3b8" />
                  <polygon points="155,137 163,151 171,137" fill="#e2e8f0" stroke="#94a3b8" />
                  <polygon points="182,137 194,148 198,137" fill="#e2e8f0" stroke="#94a3b8" />
                </svg>

                {/* Impact dust cloud upon landing at 1.0s */}
                {elapsed >= 1.0 && (
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center pointer-events-none">
                    <div className="w-48 h-8 rounded-full bg-slate-300/30 blur-md animate-pulse" />
                  </div>
                )}
              </div>

              {/* Hand in leather glove gripping flag staff */}
              <div className="absolute top-2 right-[28%] flex items-center">
                <div className="w-3 h-64 bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-600 rounded-full shadow-2xl rotate-6" />
                <div className="w-16 h-14 -ml-8 rounded-2xl bg-amber-900 border-2 border-amber-950 shadow-inner flex items-center justify-center text-xs font-black text-amber-200">
                  ✊
                </div>
              </div>
            </div>

            {/* Cinematic Subtitle */}
            <div className="mt-4 px-6 py-2 rounded-full bg-black/80 border border-zinc-800 text-center">
              <p className="text-sm sm:text-base font-black text-zinc-100 font-mono tracking-wider">
                [ 한계 돌파 ] 영하 38℃의 돌풍과 데스존을 딛고 마지막 능선에 도달합니다.
              </p>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* [SCENE 2: 폭풍전야와 정적] (00:03 ~ 00:04.5) */}
        {/* 카메라 구도: 하이 앵글 -> 캐릭터 정면 실루엣 타이트 샷 */}
        {/* 완전한 무음 (Silence), 깃대 높이 들기, 심장 박동 1회 (쿵--) */}
        {/* ----------------------------------------------------------------- */}
        {currentScene === 2 && (
          <div 
            className="relative w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-700"
            style={{
              // Dark vignette tightening on screen edges
              boxShadow: 'inset 0 0 160px rgba(0,0,0,0.95), inset 0 0 80px rgba(0,0,0,0.95)',
            }}
          >
            {/* Heartbeat Radial Shock Ring at 3.8s */}
            {elapsed >= 3.8 && (
              <div className="absolute w-72 h-72 rounded-full border-2 border-red-500/60 animate-ping pointer-events-none" />
            )}

            {/* Lone Climber on the Pinnacle Knife-Edge */}
            <div 
              className="relative flex flex-col items-center"
              style={{
                transform: elapsed >= 4.0 ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.4s ease-out',
              }}
            >
              {/* Fluttering Crimson Flag Overhead */}
              <div 
                className="relative -mb-6 z-20 flex flex-col items-center"
                style={{
                  transform: elapsed >= 3.8 ? 'translateY(-18px) rotate(-8deg)' : 'translateY(0px)',
                  transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                {/* Crimson Flag Cloth with sine fluttering effect */}
                <div className="relative flex items-start">
                  <div className="w-2.5 h-44 bg-gradient-to-b from-zinc-200 via-slate-400 to-zinc-700 rounded-full shadow-2xl" />
                  <div 
                    className="w-36 sm:w-44 h-24 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-r-2xl shadow-[0_0_30px_rgba(220,38,38,0.7)] flex flex-col justify-center px-4 text-white font-black font-mono border-y-2 border-r-2 border-red-400 -ml-1 animate-pulse"
                    style={{
                      clipPath: 'polygon(0% 0%, 100% 12%, 88% 50%, 100% 88%, 0% 100%)',
                    }}
                  >
                    <span className="text-[10px] tracking-widest text-red-200 font-extrabold">SUMMIT 90,000</span>
                    <span className="text-sm tracking-wider font-mono font-black text-yellow-300">★ {channelName} ★</span>
                  </div>
                </div>

                {/* Steel Spear Tip at the highest point */}
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[18px] border-b-white -mt-44 filter drop-shadow-[0_0_8px_#ffffff]" />
              </div>

              {/* Climber Silhouette Lifting Flagpole with Both Hands */}
              <div className="text-7xl sm:text-8xl select-none filter drop-shadow-[0_0_35px_rgba(0,0,0,1)] z-10">
                🧗
              </div>

              {/* Pinnacle Summit Rock */}
              <div className="w-56 sm:w-72 h-16 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-t-full border-t-2 border-zinc-600 shadow-2xl -mt-4 z-0" />
            </div>

            {/* Cinematic Subtitle: Complete Silence */}
            <div className="mt-8 px-6 py-2.5 rounded-full bg-black/90 border border-red-900/60 text-center shadow-lg">
              <p className="text-sm sm:text-base font-mono font-bold text-red-400 tracking-widest animate-pulse">
                [ 폭풍전야와 정적 ] 귓가의 돌풍이 멎고, 오직 단 한 번의 심장 박동만이 울려 퍼집니다.
              </p>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* [SCENE 3: 격돌과 충격파] (00:04.5 ~ 00:06.5) */}
        {/* 깃발 내리꽂기, 십자 균열, 360도 충격파, 블리자드 청산, RGB 글리치 */}
        {/* ----------------------------------------------------------------- */}
        {currentScene === 3 && (
          <div 
            className="relative w-full h-full flex flex-col items-center justify-center animate-in zoom-in-105 duration-200"
            style={{
              // Chromatic aberration / color split glitch
              filter: 'drop-shadow(-4px 0 rgba(239, 68, 68, 0.7)) drop-shadow(4px 0 rgba(6, 182, 212, 0.7))',
            }}
          >
            {/* Massive Planted Flagpole Embedded in Summit Bedrock */}
            <div className="relative flex flex-col items-center z-10">
              {/* Fluttering Crimson Flag planted firmly */}
              <div className="relative flex items-start -mb-2">
                <div className="w-3.5 h-64 bg-gradient-to-b from-white via-zinc-300 to-zinc-600 rounded-full shadow-[0_0_20px_#ffffff]" />
                <div 
                  className="w-48 sm:w-60 h-28 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-r-3xl shadow-[0_0_40px_rgba(239,68,68,0.9)] flex flex-col justify-center px-6 text-white font-mono border-2 border-red-300 -ml-1"
                  style={{
                    clipPath: 'polygon(0% 0%, 100% 10%, 88% 50%, 100% 90%, 0% 100%)',
                  }}
                >
                  <span className="text-xs tracking-widest text-red-200 font-extrabold">ELEVATION 90,000M</span>
                  <span className="text-lg font-black tracking-wider text-yellow-300">🚩 {channelName} 🚩</span>
                  <span className="text-[10px] text-zinc-200 font-mono tracking-widest">SUMMIT CONQUERED</span>
                </div>
              </div>

              {/* Climber Silhouette standing triumphant next to flag */}
              <div className="text-6xl sm:text-7xl select-none filter drop-shadow-[0_0_30px_rgba(0,0,0,1)] -mt-16 z-20">
                🧍
              </div>

              {/* Shattered Bedrock with Glowing Cross Cracks */}
              <div className="relative w-80 sm:w-96 h-28 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 rounded-t-[40px] border-t-2 border-emerald-400 shadow-2xl flex items-center justify-center overflow-hidden">
                {/* Center impact epicenter flare */}
                <div className="w-16 h-16 rounded-full bg-emerald-400/80 blur-xl animate-ping" />
                <div className="w-6 h-6 rounded-full bg-white shadow-[0_0_25px_#ffffff]" />

                {/* Jagged cross fracture lines cracking outward */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 120">
                  <path d="M 200,30 L 140,80 L 80,100" stroke="#34d399" strokeWidth="3" fill="none" />
                  <path d="M 200,30 L 260,75 L 340,95" stroke="#34d399" strokeWidth="3" fill="none" />
                  <path d="M 200,30 L 210,110" stroke="#67e8f9" strokeWidth="2.5" fill="none" />
                  <path d="M 200,30 L 170,115" stroke="#67e8f9" strokeWidth="2" fill="none" />
                  <path d="M 140,80 L 110,60" stroke="#a7f3d0" strokeWidth="2" fill="none" />
                  <path d="M 260,75 L 300,55" stroke="#a7f3d0" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>

            {/* Shockwave Resonance Subtitle */}
            <div className="mt-6 px-6 py-2 rounded-full bg-zinc-950/90 border border-emerald-500/70 text-center shadow-lg">
              <p className="text-sm sm:text-base font-black text-emerald-400 font-mono tracking-wider">
                [ 격돌과 충격파 ] 깃대가 바위에 꽂히며 360도 충격파가 눈보라와 먹구름을 밀어냅니다!
              </p>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* [SCENE 4: 시야 개방과 정복 엠블럼] (00:06.5 ~ 00:10.5) */}
        {/* 황금빛 운해, 펄럭이는 깃발, 앤빌 타격음과 함께 쿵 찍히는 금속 엠블럼 */}
        {/* ----------------------------------------------------------------- */}
        {currentScene === 4 && (
          <div className="relative w-full h-full flex flex-col items-center justify-between py-10 px-4 animate-in fade-in duration-700">
            {/* Top Panorama Tag */}
            <div className="flex items-center gap-2 px-5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/60 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-mono font-black text-amber-300 tracking-widest uppercase">
                ★ 90,000 고지 정상 정복 완착 공식 선포 ★
              </span>
            </div>

            {/* Center: The Massive 3D Metallic Conquest Emblem */}
            <div 
              className="relative z-30 flex flex-col items-center text-center my-auto transition-all duration-300"
              style={{
                transform: elapsed >= 7.8 
                  ? 'scale(1) translateY(0px)' 
                  : 'scale(1.8) translateY(-40px)',
                opacity: elapsed >= 7.6 ? 1 : 0,
                transition: 'transform 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.2s ease-out',
              }}
            >
              {/* Floating Crown above emblem */}
              <div className="text-4xl sm:text-5xl -mb-2 select-none filter drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-bounce">
                👑
              </div>

              {/* The Heavy Metallic Emblem Plaque */}
              <div 
                className="w-full max-w-lg px-8 py-6 rounded-3xl bg-gradient-to-b from-zinc-900/95 via-zinc-950/98 to-black border-2 border-amber-400/90 shadow-[0_0_60px_rgba(245,158,11,0.5),inset_0_0_30px_rgba(245,158,11,0.2)] relative overflow-hidden backdrop-blur-xl"
              >
                {/* Mirror Sheen Light Sweep across emblem */}
                <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent animate-sheen pointer-events-none" />

                <div className="space-y-2">
                  <div className="text-[11px] sm:text-xs font-mono font-black tracking-widest text-amber-400 uppercase">
                    OFFICIAL CREATOR CONQUEST SEAL
                  </div>

                  {/* Main Title: [ 90,000 고지 점령 ] */}
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 font-mono drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                    [ 90,000 고지 점령 ]
                  </h1>

                  {/* Subtitle: ELEVATION : 90,000 / GOAL ACHIEVED */}
                  <div className="text-xs sm:text-sm font-mono font-bold tracking-widest text-zinc-300">
                    ELEVATION : 90,000 / GOAL ACHIEVED
                  </div>

                  {/* Creator Channel Tag */}
                  <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono font-extrabold text-amber-300">
                    <span>크리에이터</span>
                    <strong className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-200">
                      '{channelName}'
                    </strong>
                    <span>정상 완착 완료 🚩</span>
                  </div>
                </div>

                {/* Corner decorative rivets */}
                <span className="absolute top-3 left-3 text-[10px] text-amber-400 font-bold">✦</span>
                <span className="absolute top-3 right-3 text-[10px] text-amber-400 font-bold">✦</span>
                <span className="absolute bottom-3 left-3 text-[10px] text-amber-400 font-bold">✦</span>
                <span className="absolute bottom-3 right-3 text-[10px] text-amber-400 font-bold">✦</span>
              </div>
            </div>

            {/* Bottom Panorama Landscape Silhouette (Climber back shot overlooking cloud sea) */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-end gap-3 text-4xl sm:text-5xl select-none filter drop-shadow-[0_0_20px_rgba(0,0,0,1)]">
                <span>🧍‍♂️</span>
                <span className="text-5xl sm:text-6xl -ml-2">🚩</span>
              </div>
              <div className="w-72 sm:w-96 h-10 bg-black/90 rounded-t-full -mt-2" />

              <p className="text-xs text-amber-200/90 font-serif italic mt-2 drop-shadow">
                "험난한 데스존을 뚫고 깃발을 꽂은 자만이, 10만 실버버튼의 영광을 마주합니다."
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. BOTTOM CINEMATIC LETTERBOX BAR */}
      {/* ===================================================================== */}
      <div className="relative z-40 h-14 bg-black/90 backdrop-blur-md border-t border-zinc-800 flex items-center justify-between px-4 sm:px-8">
        <span className="text-[11px] sm:text-xs text-zinc-400 font-mono tracking-wider">
          CHAPTER 2 : 9만 고지 정상 깃발 완착 • 10-SECOND CINEMATIC CUTSCENE
        </span>

        {/* Progress Bar through 10.5 seconds */}
        <div className="w-36 sm:w-56 bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-700/80">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-100 ease-linear rounded-full"
            style={{
              width: `${Math.min(100, (elapsed / 10.5) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
