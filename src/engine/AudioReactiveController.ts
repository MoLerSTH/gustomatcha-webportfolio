export interface AudioFrequencySnapshot {
  bass: number;
  mid: number;
  high: number;
  overall: number;
  isActive: boolean;
}

const ZERO_SNAPSHOT: AudioFrequencySnapshot = {
  bass: 0,
  mid: 0,
  high: 0,
  overall: 0,
  isActive: false,
};

/**
 * Web Audio API reactive pulse synthesizer and frequency analyzer.
 * Strictly opt-in (starts disabled per WCAG 1.4.2 Audio Control) and degrades
 * gracefully to deterministic harmonic envelopes when AudioContext is unavailable.
 */
export class AudioReactiveController {
  private enabled = false;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private carrierOsc: OscillatorNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private frequencyBuffer: Uint8Array<ArrayBuffer> | null = null;
  private transientBoost = 0;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public async toggle(): Promise<boolean> {
    if (this.enabled) {
      this.stop();
      return false;
    }
    return this.start();
  }

  public async start(): Promise<boolean> {
    this.enabled = true;

    if (typeof window === 'undefined') {
      return true;
    }

    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioCtxClass) {
      return true;
    }

    try {
      if (!this.ctx) {
        this.ctx = new AudioCtxClass();
      }
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      if (!this.carrierOsc) {
        this.setupAmbientGraph(this.ctx);
      } else if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.08);
      }
    } catch {
      // Keep enabled=true so mathematical fallback pulse still drives the 3D scene
    }

    return true;
  }

  private setupAmbientGraph(ctx: AudioContext): void {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.78;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, ctx.currentTime);

    const carrier = ctx.createOscillator();
    carrier.type = 'triangle';
    carrier.frequency.setValueAtTime(82.41, ctx.currentTime); // Deep E2 ambient drone

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(2.0, ctx.currentTime); // 120 BPM pulse modulation

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(140, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    carrier.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    carrier.start();
    lfo.start();

    this.analyser = analyser;
    this.masterGain = masterGain;
    this.carrierOsc = carrier;
    this.lfoOsc = lfo;
    this.lfoGain = lfoGain;
    this.frequencyBuffer = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  }

  public stop(): void {
    this.enabled = false;
    this.transientBoost = 0;

    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
      } catch {
        // Ignore audio context state errors during teardown
      }
    }
  }

  public triggerSynthPulse(
    frequencyHz = 220,
    durationSec = 0.24,
    waveform: OscillatorType = 'sawtooth'
  ): void {
    this.transientBoost = Math.min(1, this.transientBoost + 0.55);

    if (typeof window === 'undefined') {
      return;
    }

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtxClass) {
        return;
      }
      try {
        this.ctx = new AudioCtxClass();
      } catch {
        return;
      }
    }

    const ctx = this.ctx;
    if (ctx.state === 'suspended') {
      void ctx
        .resume()
        .then(() => {
          if (this.ctx === ctx && ctx.state === 'running') {
            this.scheduleOneShotTone(ctx, frequencyHz, durationSec, waveform);
          }
        })
        .catch(() => {
          // Ignore resume errors prior to user interaction
        });
      return;
    }

    if (ctx.state !== 'running') {
      return;
    }

    this.scheduleOneShotTone(ctx, frequencyHz, durationSec, waveform);
  }

  private scheduleOneShotTone(
    ctx: AudioContext,
    frequencyHz: number,
    durationSec: number,
    waveform: OscillatorType
  ): void {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = waveform;
      osc.frequency.setValueAtTime(frequencyHz, now);

      noteGain.gain.setValueAtTime(0.08, now);
      noteGain.gain.exponentialRampToValueAtTime(0.0008, now + durationSec);

      osc.connect(noteGain);
      if (this.analyser) {
        noteGain.connect(this.analyser);
      } else {
        noteGain.connect(ctx.destination);
      }

      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch {
      // Ignore if browser blocks audio synthesis prior to user gesture
    }
  }

  public sampleFrequencies(elapsedSeconds = 0): AudioFrequencySnapshot {
    if (!this.enabled) {
      return ZERO_SNAPSHOT;
    }

    this.transientBoost = Math.max(0, this.transientBoost * 0.9);

    // Deterministic 120 BPM harmonic envelope guarantees responsive visual beat
    const beatPhase = elapsedSeconds * Math.PI * 4;
    const synthBass = Math.pow(0.5 + 0.5 * Math.sin(beatPhase), 2) * 0.68;
    const synthMid = (0.5 + 0.5 * Math.sin(beatPhase * 1.5 + 0.8)) * 0.52;
    const synthHigh = (0.5 + 0.5 * Math.cos(beatPhase * 2.5)) * 0.4;

    if (this.analyser && this.frequencyBuffer) {
      this.analyser.getByteFrequencyData(this.frequencyBuffer);
      const binCount = this.frequencyBuffer.length;
      if (binCount > 0) {
        let lowSum = 0;
        let midSum = 0;
        let highSum = 0;
        const lowEnd = Math.max(1, Math.floor(binCount * 0.2));
        const midEnd = Math.max(lowEnd + 1, Math.floor(binCount * 0.6));

        for (let i = 0; i < binCount; i++) {
          const normalized = this.frequencyBuffer[i] / 255;
          if (i < lowEnd) lowSum += normalized;
          else if (i < midEnd) midSum += normalized;
          else highSum += normalized;
        }

        const measuredBass = lowSum / lowEnd;
        const measuredMid = midSum / (midEnd - lowEnd);
        const measuredHigh = highSum / Math.max(1, binCount - midEnd);

        const bass = Math.min(1, Math.max(measuredBass, synthBass) + this.transientBoost * 0.5);
        const mid = Math.min(1, Math.max(measuredMid, synthMid) + this.transientBoost * 0.35);
        const high = Math.min(1, Math.max(measuredHigh, synthHigh) + this.transientBoost * 0.25);
        const overall = Number(((bass * 0.5 + mid * 0.3 + high * 0.2)).toFixed(4));

        return { bass, mid, high, overall, isActive: true };
      }
    }

    const bass = Math.min(1, Number((synthBass + this.transientBoost * 0.5).toFixed(4)));
    const mid = Math.min(1, Number((synthMid + this.transientBoost * 0.35).toFixed(4)));
    const high = Math.min(1, Number((synthHigh + this.transientBoost * 0.25).toFixed(4)));
    const overall = Number(((bass * 0.5 + mid * 0.3 + high * 0.2)).toFixed(4));

    return { bass, mid, high, overall, isActive: true };
  }

  public dispose(): void {
    this.stop();
    try {
      this.carrierOsc?.stop();
      this.carrierOsc?.disconnect();
      this.lfoOsc?.stop();
      this.lfoOsc?.disconnect();
      this.lfoGain?.disconnect();
      this.masterGain?.disconnect();
      this.analyser?.disconnect();
      if (this.ctx && this.ctx.state !== 'closed') {
        void this.ctx.close();
      }
    } catch {
      // Ignore errors during disposal
    } finally {
      this.carrierOsc = null;
      this.lfoOsc = null;
      this.lfoGain = null;
      this.masterGain = null;
      this.analyser = null;
      this.ctx = null;
      this.frequencyBuffer = null;
    }
  }
}
