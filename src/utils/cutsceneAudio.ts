/**
 * Web Audio API Cinema Sound Synthesizer for Milestone Cutscenes
 * 100% native browser audio synthesis - engineered for deep cinema impacts,
 * majestic orchestral brass, cathedral bells, and authentic fireworks.
 * (Zero 8-bit retro arcade chirps / 뿅뿅 소리 완전 제거 및 웅장한 시네마 톤 구현)
 */

class CutsceneAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('creator_studio_audio_muted');
      this.isMuted = saved === 'true';
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && !this.noiseBuffer) {
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    }
    return this.ctx;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('creator_studio_audio_muted', String(muted));
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers for Cinematic Audio Elements
  // ---------------------------------------------------------------------------
  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2.5; // 2.5 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Massive Cinema Sub-Bass Boom (인셉션 스타일 저음 충격 쾅!)
   */
  private playCinematicSubBoom(time: number, volume = 0.55, startFreq = 85, endFreq = 25, duration = 1.6) {
    const ctx = this.ctx;
    if (!ctx) return;

    // Dual detuned sub oscillators for deep physical chest rumble
    [startFreq, startFreq * 0.98].forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, time);
      osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, time);
      filter.frequency.exponentialRampToValueAtTime(45, time + duration);

      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration + 0.1);
    });

    // Transient punch click
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      const nGain = ctx.createGain();
      const nFilter = ctx.createBiquadFilter();

      noise.buffer = this.noiseBuffer;
      nFilter.type = 'lowpass';
      nFilter.frequency.setValueAtTime(280, time);

      nGain.gain.setValueAtTime(volume * 0.7, time);
      nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(ctx.destination);

      noise.start(time);
      noise.stop(time + 0.15);
    }
  }

  /**
   * Movie Trailer Tension Riser (서서히 고조되는 웅장한 사운드)
   */
  private playTensionRiser(time: number, duration = 1.9, volume = 0.25) {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuffer) return;

    const noise = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    noise.buffer = this.noiseBuffer;

    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.5, time);
    filter.frequency.setValueAtTime(120, time);
    filter.frequency.exponentialRampToValueAtTime(1800, time + duration);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(volume, time + duration * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + duration + 0.1);
  }

  /**
   * Majestic Hans Zimmer Style Brass Horns (웅장한 오케스트라 브라스 화음)
   */
  private playMajesticBrassChords(time: number, notes: number[], duration = 1.8, volume = 0.3) {
    const ctx = this.ctx;
    if (!ctx) return;

    notes.forEach((freq) => {
      // Warm detuned sawtooth
      [-3, 3].forEach((detune) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        osc.detune.setValueAtTime(detune, time);

        // Low-pass filter to sound like rich warm French horns rather than digital buzz
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, time);
        filter.frequency.linearRampToValueAtTime(1400, time + 0.3);
        filter.frequency.exponentialRampToValueAtTime(500, time + duration);

        // Soft brass swell attack
        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(volume / notes.length, time + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + duration + 0.1);
      });
    });
  }

  /**
   * Cathedral Gong / Tubular Bell (영롱하고 깊은 대성당 종소리)
   */
  private playCathedralBell(time: number, freq: number, volume = 0.35, duration = 2.4) {
    const ctx = this.ctx;
    if (!ctx) return;

    // Harmonic overtone ratios of real bells: 1.0, 1.5, 2.76, 5.4
    const partials = [
      { f: freq, gain: volume },
      { f: freq * 1.503, gain: volume * 0.4 },
      { f: freq * 2.76, gain: volume * 0.25 },
      { f: freq * 5.4, gain: volume * 0.1 },
    ];

    partials.forEach(({ f, gain: partGain }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(partGain, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration + 0.1);
    });
  }

  // =========================================================================
  // 1. 🍀 88,888 골드넘버 잭팟 (중후한 금고 잠금 & 골든 징 & 웅장한 브라스)
  // =========================================================================
  public playSlotMachineJackpot() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // A. 텐션 라이저 (서서히 긴장감 고조)
    this.playTensionRiser(now + 0.2, 2.0, 0.22);

    // B. 5개의 릴이 육중하게 '철컥!' 체결되는 볼트 사운드 (at 0.35s, 0.68s, 1.01s, 1.34s, 1.67s)
    const lockPitches = [160, 200, 240, 290, 360];
    lockPitches.forEach((freq, idx) => {
      const t = now + 0.35 + idx * 0.33;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.1);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    });

    // C. 클라이맥스 (now + 2.35s): 초대형 서브 붐 + 골든 징 + 웅장한 잭팟 팡파레
    const climaxTime = now + 2.35;
    this.playCinematicSubBoom(climaxTime, 0.65, 80, 28, 2.2);
    this.playCathedralBell(climaxTime, 293.66, 0.45, 2.8); // D4 deep gong

    // 장엄한 황금 브라스 팡파레 (D major 코드: D4, F#4, A4, D5)
    this.playMajesticBrassChords(climaxTime + 0.15, [293.66, 369.99, 440.0, 587.33], 2.0, 0.4);

    // 쏟아지는 골드 코인 샤워 (묵직한 금화들이 바닥에 쏟아지는 메탈릭 찰랑 사운드)
    for (let c = 0; c < 16; c++) {
      const coinTime = climaxTime + 0.4 + Math.random() * 1.5;
      const coinPitch = 1400 + Math.random() * 1200;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(coinPitch, coinTime);

      gain.gain.setValueAtTime(0.12, coinTime);
      gain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(coinTime);
      osc.stop(coinTime + 0.15);
    }
  }

  // =========================================================================
  /**
   * Stop all playing audio instantly (e.g. on skip or modal close)
   */
  public stopAll(): void {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {
        // ignore
      }
      this.ctx = null;
      this.noiseBuffer = null;
    }
  }

  // =========================================================================
  // 2. 🏔️ 90,000 고지 정상 정복 (10초 전체 씬별 상세 콘티 완벽 사운드트랙)
  // Scene 1: 돌풍 + 거친 숨소리 + 아이젠 바위 쿵 (0~3초)
  // Scene 2: 칼 같은 무음(Silence) + 심장 박동 1회 쿵-- (3~4.5초)
  // Scene 3: 깃발 타격 쾅!! + 서브베이스 드롭 + 공명음 웅---- 지이이잉- (4.5~6.5초)
  // Scene 4: 웅장한 브라스/현악기 + 엠블럼 앤빌 타격음 챙- 쿵! (6.5~10초)
  // =========================================================================
  public playSummitConquest() {
    this.playSummitConquestScript();
  }

  public playSummitConquestScript() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // -----------------------------------------------------------------------
    // [Scene 1: 한계 돌파] (00:00 ~ 00:03) - 오직 환경음만 존재 (돌풍, 숨소리, 아이젠)
    // -----------------------------------------------------------------------
    if (this.noiseBuffer) {
      // 1) 귓가를 때리는 날카로운 돌풍 소리 (쉬이익-)
      const windSource = ctx.createBufferSource();
      const windGain = ctx.createGain();
      const windFilter = ctx.createBiquadFilter();

      windSource.buffer = this.noiseBuffer;
      windSource.loop = true;

      windFilter.type = 'bandpass';
      windFilter.Q.setValueAtTime(3.2, now);
      windFilter.frequency.setValueAtTime(380, now);
      // 바람이 불규칙하게 휘몰아치는 스윕
      windFilter.frequency.linearRampToValueAtTime(820, now + 1.2);
      windFilter.frequency.linearRampToValueAtTime(450, now + 2.1);
      windFilter.frequency.linearRampToValueAtTime(1100, now + 2.8);

      windGain.gain.setValueAtTime(0.05, now);
      windGain.gain.linearRampToValueAtTime(0.35, now + 0.8);
      windGain.gain.linearRampToValueAtTime(0.42, now + 2.4);
      // Scene 2 진입 순간: 칼로 자른 듯 3.0s에 급격한 컷오프
      windGain.gain.linearRampToValueAtTime(0.0001, now + 3.0);

      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(ctx.destination);

      windSource.start(now);
      windSource.stop(now + 3.05);

      // 2) 헬멧 안에서 울리는 무겁고 거친 날숨 소리 (Foley at 0.7s, 1.8s, 2.5s)
      [0.6, 1.6, 2.4].forEach((breathTime, idx) => {
        const bTime = now + breathTime;
        const bSource = ctx.createBufferSource();
        const bGain = ctx.createGain();
        const bFilter = ctx.createBiquadFilter();

        bSource.buffer = this.noiseBuffer;
        bFilter.type = 'lowpass';
        bFilter.frequency.setValueAtTime(320, bTime);
        bFilter.frequency.exponentialRampToValueAtTime(120, bTime + 0.45);

        bGain.gain.setValueAtTime(0.01, bTime);
        bGain.gain.linearRampToValueAtTime(0.22 + idx * 0.05, bTime + 0.15);
        bGain.gain.exponentialRampToValueAtTime(0.001, bTime + 0.5);

        bSource.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(ctx.destination);

        bSource.start(bTime);
        bSource.stop(bTime + 0.55);
      });
    }

    // 3) 아이젠을 찬 묵직한 등산화가 암벽 모서리를 쾅 딛는 소리 (at 1.0s)
    const stepTime = now + 1.0;
    const stepOsc = ctx.createOscillator();
    const stepGain = ctx.createGain();
    const stepFilter = ctx.createBiquadFilter();

    stepOsc.type = 'triangle';
    stepOsc.frequency.setValueAtTime(95, stepTime);
    stepOsc.frequency.exponentialRampToValueAtTime(30, stepTime + 0.22);

    stepFilter.type = 'lowpass';
    stepFilter.frequency.setValueAtTime(260, stepTime);

    stepGain.gain.setValueAtTime(0.55, stepTime);
    stepGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.28);

    stepOsc.connect(stepFilter);
    stepFilter.connect(stepGain);
    stepGain.connect(ctx.destination);

    stepOsc.start(stepTime);
    stepOsc.stop(stepTime + 0.3);

    // 얼음/돌가루 파편 튀는 마찰음
    if (this.noiseBuffer) {
      const crunch = ctx.createBufferSource();
      const crunchGain = ctx.createGain();
      const crunchFilter = ctx.createBiquadFilter();

      crunch.buffer = this.noiseBuffer;
      crunchFilter.type = 'bandpass';
      crunchFilter.frequency.setValueAtTime(1400, stepTime);
      crunchGain.gain.setValueAtTime(0.28, stepTime);
      crunchGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.18);

      crunch.connect(crunchFilter);
      crunchFilter.connect(crunchGain);
      crunchGain.connect(ctx.destination);

      crunch.start(stepTime);
      crunch.stop(stepTime + 0.2);
    }

    // -----------------------------------------------------------------------
    // [Scene 2: 폭풍전야와 정적] (00:03 ~ 00:04.5)
    // 3.0s ~ 3.75s: 완전한 무음 (Silence)
    // 3.8s: 심장 박동 딱 한 번 (쿵--) 울림 없이 메마르게 처리
    // -----------------------------------------------------------------------
    const heartTime = now + 3.8;
    const heartOsc = ctx.createOscillator();
    const heartGain = ctx.createGain();
    const heartFilter = ctx.createBiquadFilter();

    heartOsc.type = 'sine';
    heartOsc.frequency.setValueAtTime(54, heartTime);
    heartOsc.frequency.exponentialRampToValueAtTime(32, heartTime + 0.32);

    heartFilter.type = 'lowpass';
    heartFilter.frequency.setValueAtTime(110, heartTime);

    // 울림 없이 묵직하고 건조한(dry) 심장 고동
    heartGain.gain.setValueAtTime(0.85, heartTime);
    heartGain.gain.exponentialRampToValueAtTime(0.001, heartTime + 0.3);

    heartOsc.connect(heartFilter);
    heartFilter.connect(heartGain);
    heartGain.connect(ctx.destination);

    heartOsc.start(heartTime);
    heartOsc.stop(heartTime + 0.35);

    // -----------------------------------------------------------------------
    // [Scene 3: 격돌과 충격파] (00:04.5 ~ 00:06.5)
    // 4.5s: 쇠와 바위가 부딪히는 둔탁 타격음 (쾅!!) + 서브베이스 드롭
    // 4.6s ~ 6.0s: 공간이 흔들리는 공명음 (웅---- 지이이잉-)
    // -----------------------------------------------------------------------
    const strikeTime = now + 4.5;

    // 1) 쇠와 바위 타격음 (금속 쇠촉 쨍! + 바위 충격 쾅!)
    const metalPings = [1250, 2400, 3600];
    metalPings.forEach((freq, idx) => {
      const mOsc = ctx.createOscillator();
      const mGain = ctx.createGain();

      mOsc.type = 'sine';
      mOsc.frequency.setValueAtTime(freq, strikeTime);
      mGain.gain.setValueAtTime(0.35 / (idx + 1), strikeTime);
      mGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.25);

      mOsc.connect(mGain);
      mGain.connect(ctx.destination);

      mOsc.start(strikeTime);
      mOsc.stop(strikeTime + 0.28);
    });

    // 2) 깊은 저음의 서브베이스 드롭 (Bass Drop) 쾅!!
    this.playCinematicSubBoom(strikeTime, 0.95, 92, 18, 2.2);

    // 3) 공간이 흔들리는 공명음 (웅---- 지이이잉-)
    [-5, 5].forEach((detune) => {
      const droneOsc = ctx.createOscillator();
      const droneGain = ctx.createGain();
      const droneFilter = ctx.createBiquadFilter();

      droneOsc.type = 'sawtooth';
      droneOsc.frequency.setValueAtTime(55, strikeTime + 0.05); // A1 note
      droneOsc.detune.setValueAtTime(detune, strikeTime + 0.05);

      droneFilter.type = 'lowpass';
      droneFilter.Q.setValueAtTime(4.5, strikeTime + 0.05);
      droneFilter.frequency.setValueAtTime(140, strikeTime + 0.05);
      // 지이이잉- 공명 왜곡 스윕
      droneFilter.frequency.linearRampToValueAtTime(580, strikeTime + 0.6);
      droneFilter.frequency.exponentialRampToValueAtTime(90, strikeTime + 1.8);

      droneGain.gain.setValueAtTime(0.02, strikeTime + 0.05);
      droneGain.gain.linearRampToValueAtTime(0.32, strikeTime + 0.25);
      droneGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 1.9);

      droneOsc.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(ctx.destination);

      droneOsc.start(strikeTime + 0.05);
      droneOsc.stop(strikeTime + 2.0);
    });

    // -----------------------------------------------------------------------
    // [Scene 4: 시야 개방과 정복 엠블럼] (00:06.5 ~ 00:10.5)
    // 6.5s: 웅장한 브라스 & 오케스트라 현악기 찬가 터져 나옴
    // 7.8s: 엠블럼 텍스트 박힐 때 묵직한 앤빌(쇠 모루) 타격음 (챙- 쿵!)
    // -----------------------------------------------------------------------
    const brassTime = now + 6.5;

    // 1) 웅장한 승리의 오케스트라 브라스 팡파레
    // 코드 1: Bb 메이저 (Bb3, D4, F4, Bb4)
    this.playMajesticBrassChords(brassTime, [233.08, 293.66, 349.23, 466.16], 1.6, 0.48);
    // 코드 2: 영광의 클라이맥스 D 메이저 (D4, F#4, A4, D5)
    this.playMajesticBrassChords(brassTime + 1.3, [293.66, 369.99, 440.0, 587.33], 2.8, 0.55);

    // 2) 엠블럼 타격 순간 (at 7.8s): 묵직한 앤빌 타격음 (챙- 쿵!)
    const anvilTime = now + 7.8;

    // '챙-' (맑고 날카로운 고음 모루 공명음)
    const anvilHarmonics = [1760, 2640, 3520];
    anvilHarmonics.forEach((f, i) => {
      const aOsc = ctx.createOscillator();
      const aGain = ctx.createGain();

      aOsc.type = 'sine';
      aOsc.frequency.setValueAtTime(f, anvilTime);
      aGain.gain.setValueAtTime(0.4 / (i + 1), anvilTime);
      aGain.gain.exponentialRampToValueAtTime(0.001, anvilTime + 1.2);

      aOsc.connect(aGain);
      aGain.connect(ctx.destination);

      aOsc.start(anvilTime);
      aOsc.stop(anvilTime + 1.25);
    });

    // '쿵!' (육중한 쇠 덩어리 바닥 둔탁음)
    this.playCinematicSubBoom(anvilTime, 0.82, 85, 24, 1.8);
  }

  // =========================================================================
  // 3. 🚀 95,000 파이널 카운트 (중저음 시네마틱 펄스 & 지축을 울리는 로켓 굉음 & 워프)
  // =========================================================================
  public playRocketLaunch() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // A. 중저음 시네마틱 소나 펄스 카운트다운 (3, 2, 1)
    [0.3, 0.9, 1.5].forEach((offset, idx) => {
      const t = now + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Deep resonant sonar tone instead of beep
      osc.frequency.setValueAtTime(idx === 2 ? 380 : 260, t);
      osc.frequency.exponentialRampToValueAtTime(idx === 2 ? 220 : 140, t + 0.28);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });

    // B. 초거대 플라즈마 부스터 럼블 (지축을 울리는 굉음)
    const launchTime = now + 1.6;
    [-4, 4].forEach((detune) => {
      const rOsc = ctx.createOscillator();
      const rGain = ctx.createGain();
      const rFilter = ctx.createBiquadFilter();

      rOsc.type = 'sawtooth';
      rOsc.frequency.setValueAtTime(45, launchTime);
      rOsc.frequency.linearRampToValueAtTime(95, launchTime + 1.2);
      rOsc.detune.setValueAtTime(detune, launchTime);

      rFilter.type = 'lowpass';
      rFilter.frequency.setValueAtTime(160, launchTime);
      rFilter.frequency.linearRampToValueAtTime(400, launchTime + 1.0);

      rGain.gain.setValueAtTime(0.05, launchTime);
      rGain.gain.linearRampToValueAtTime(0.45, launchTime + 0.7);
      rGain.gain.exponentialRampToValueAtTime(0.001, launchTime + 2.0);

      rOsc.connect(rFilter);
      rFilter.connect(rGain);
      rGain.connect(ctx.destination);

      rOsc.start(launchTime);
      rOsc.stop(launchTime + 2.1);
    });

    // C. 클라이맥스 (now + 2.35s): 소닉붐 충격파 폭발 & 하이퍼스페이스 공간 도약
    const climaxTime = now + 2.35;
    this.playCinematicSubBoom(climaxTime, 0.7, 100, 20, 2.5);

    // 거대한 시네마틱 워프 도약 (필터 스윕)
    this.playTensionRiser(climaxTime, 1.5, 0.35);
    this.playMajesticBrassChords(climaxTime + 0.1, [261.63, 392.0, 523.25, 659.25], 1.9, 0.4);
  }

  // =========================================================================
  // 4. 🥈 100,000 영광의 실버버튼 대관식 (천상 오케스트라 패드, 트로피 도킹 쾅, 왕실 브라스)
  // =========================================================================
  public playSilverButtonGrandCeremony() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // A. 천상에서 내려오는 웅장한 스트링 패드 & 하프 (0.2s ~ 2.2s)
    const angelicNotes = [261.63, 329.63, 392.0, 493.88, 523.25, 659.25, 783.99]; // C major9
    angelicNotes.forEach((f, i) => {
      this.playCathedralBell(now + 0.2 + i * 0.22, f, 0.18, 2.2);
    });

    // B. 서서히 차오르는 시네마틱 라이저 (대관식 전야)
    this.playTensionRiser(now + 0.5, 1.8, 0.28);

    // C. 클라이맥스 (now + 2.35s): 묵직한 실버버튼 트로피 도킹 임팩트 쾅!
    const climaxTime = now + 2.35;
    this.playCinematicSubBoom(climaxTime, 0.8, 85, 20, 2.6);
    this.playCathedralBell(climaxTime, 261.63, 0.5, 3.2); // Massive Low C Cathedral Bell

    // D. 한스 짐머 스타일 장엄한 왕실 대관식 브라스 팡파레 (C - G - C - E - G)
    this.playMajesticBrassChords(climaxTime + 0.2, [261.63, 329.63, 392.0, 523.25, 659.25], 2.4, 0.55);

    // E. 연속 축포 포격음 (묵직한 대포 사운드 쿵! 쿵! 쿵!)
    [0.6, 1.0, 1.4, 1.8].forEach((offset) => {
      this.playCinematicSubBoom(climaxTime + offset, 0.45, 110, 30, 0.8);
    });
  }

  // =========================================================================
  // 5. 🎆 인터랙티브 축포 사운드 (진짜 폭죽처럼 묵직한 쾅! + 불꽃 파직 파티클)
  // =========================================================================
  public playClickFirework() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // A. 묵직한 폭죽 본체 폭발 (저음 쾅!)
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    const boomFilter = ctx.createBiquadFilter();

    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(110 + Math.random() * 40, now);
    boomOsc.frequency.exponentialRampToValueAtTime(28, now + 0.45);

    boomFilter.type = 'lowpass';
    boomFilter.frequency.setValueAtTime(260, now);

    boomGain.gain.setValueAtTime(0.5, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    boomOsc.connect(boomFilter);
    boomFilter.connect(boomGain);
    boomGain.connect(ctx.destination);

    boomOsc.start(now);
    boomOsc.stop(now + 0.55);

    // B. 불꽃 파직 크랙클 (노이즈 스파크)
    if (this.noiseBuffer) {
      const spark = ctx.createBufferSource();
      const sparkGain = ctx.createGain();
      const sparkFilter = ctx.createBiquadFilter();

      spark.buffer = this.noiseBuffer;
      sparkFilter.type = 'bandpass';
      sparkFilter.Q.setValueAtTime(4.0, now);
      sparkFilter.frequency.setValueAtTime(1800 + Math.random() * 800, now);

      sparkGain.gain.setValueAtTime(0.28, now);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      spark.connect(sparkFilter);
      sparkFilter.connect(sparkGain);
      sparkGain.connect(ctx.destination);

      spark.start(now);
      spark.stop(now + 0.3);
    }
  }
}

export const cutsceneAudio = new CutsceneAudioEngine();
