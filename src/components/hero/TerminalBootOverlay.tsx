'use client';

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type RefObject,
} from 'react';
import { Cpu, ShieldCheck, Terminal, Zap } from 'lucide-react';
import type { BootSequenceState } from '@/lib/bootSequence';

let supportsDisplayTransitionCache: boolean | undefined;

const subscribeNoop = () => () => {};
const getServerDisplayTransitionFallback = () => false;

/**
 * Runtime probe verifying whether the browser actually animates `display`
 * under `transition-behavior: allow-discrete` (guards Firefox bug 1882408).
 */
export function canTransitionDisplay(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  if (supportsDisplayTransitionCache !== undefined) {
    return supportsDisplayTransitionCache;
  }
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    supportsDisplayTransitionCache = false;
    return false;
  }

  const probe = document.createElement('div');
  probe.style.cssText =
    'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransitionCache = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransitionCache;
}

/**
 * Formats a single deterministic telemetry status line for the boot HUD.
 */
export function formatBootTelemetryLine(state: BootSequenceState): string {
  return `${state.phase} // ${state.progressPercent}% // ${state.statusHeadline}`;
}

/**
 * Resolves `[hidden]` vs `[data-closing]` attributes so native discrete-display
 * browsers transition `hidden` directly while fallback browsers keep display open
 * until opacity/translate complete.
 */
export function resolveOverlayAttributes(
  isVisible: boolean,
  isClosing: boolean,
  supportsDisplayTransition: boolean
): { hidden: boolean; closing: boolean } {
  if (isVisible) {
    return { hidden: false, closing: false };
  }
  if (isClosing) {
    return {
      hidden: supportsDisplayTransition,
      closing: true,
    };
  }
  return { hidden: true, closing: false };
}

export interface TerminalBootOverlayProps {
  state: BootSequenceState;
  isVisible: boolean;
  isClosing: boolean;
  onSkip: () => void;
  overlayRef?: RefObject<HTMLDivElement | null>;
}

export interface KineticBeatSpec {
  index: 0 | 1 | 2 | 3;
  word: string;
  subtag: string;
  bgHex: string;
  inkHex: string;
  accentBadge: string;
}

export interface KineticSlamState {
  clampedProgress: number;
  activeBeat: KineticBeatSpec;
  shockwaveScale: number;
  curtainSplit01: number;
}

/**
 * Four WCAG 2.3.1-safe high-contrast poster beats cycling at ~1.8 Hz (< 3 Hz)
 * across the 2200ms boot sequence.
 */
export const KINETIC_SLAM_BEATS: readonly KineticBeatSpec[] = [
  {
    index: 0,
    word: 'BUILD.',
    subtag: '01 // FULL-STACK ARCHITECTURE',
    bgHex: '#FFE600',
    inkHex: '#0A0A0A',
    accentBadge: 'NODE_01 // INIT',
  },
  {
    index: 1,
    word: 'GEO_AI.',
    subtag: '02 // GISTDA THEOS SATELLITE PIPELINES',
    bgHex: '#00F5D4',
    inkHex: '#0A0A0A',
    accentBadge: 'NODE_02 // CALVAL',
  },
  {
    index: 2,
    word: 'DEFEND.',
    subtag: '03 // KBTG REAL-TIME RISK FORENSICS',
    bgHex: '#FF5D8F',
    inkHex: '#0A0A0A',
    accentBadge: 'NODE_03 // SHIELD',
  },
  {
    index: 3,
    word: 'GUSTO_OS',
    subtag: '04 // 60FPS WEBGL CORE READY',
    bgHex: '#050B14',
    inkHex: '#00F5D4',
    accentBadge: 'v2.6 // ONLINE',
  },
] as const;

function resolveKineticBeat(clampedProgress: number): KineticBeatSpec {
  if (clampedProgress < 0.28) return KINETIC_SLAM_BEATS[0];
  if (clampedProgress < 0.56) return KINETIC_SLAM_BEATS[1];
  if (clampedProgress < 0.82) return KINETIC_SLAM_BEATS[2];
  return KINETIC_SLAM_BEATS[3];
}

/**
 * Pure deterministic calculator mapping normalized boot progress into
 * the active Kinetic Brutalist Slam beat, shockwave scale, and curtain split ratio.
 */
export function computeKineticSlamFrame(progress01: number): KineticSlamState {
  const clampedProgress = Number.isFinite(progress01)
    ? Math.min(1, Math.max(0, progress01))
    : 0;
  const activeBeat = resolveKineticBeat(clampedProgress);
  const finale01 =
    clampedProgress < 0.85 ? 0 : (clampedProgress - 0.85) / 0.15;

  return {
    clampedProgress,
    activeBeat,
    shockwaveScale: Number((1 + finale01 * 2.4).toFixed(3)),
    curtainSplit01: Number(finale01.toFixed(3)),
  };
}

/**
 * Strictly <= 3.0s `GUSTO_OS v2.6` Kinetic Brutalist Slam Intro synchronized with
 * the Pure Three.js wireframe-to-solid procedural sculpture assembly.
 */
export function TerminalBootOverlay({
  state,
  isVisible,
  isClosing,
  onSkip,
  overlayRef,
}: TerminalBootOverlayProps) {
  const skipButtonRef = useRef<HTMLButtonElement | null>(null);
  const supportsDisplayTransition = useSyncExternalStore(
    subscribeNoop,
    canTransitionDisplay,
    getServerDisplayTransitionFallback
  );

  useEffect(() => {
    if (!isVisible || isClosing) return;

    const rafId = window.requestAnimationFrame(() => {
      skipButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, isClosing, onSkip]);

  const { hidden, closing } = resolveOverlayAttributes(
    isVisible,
    isClosing,
    supportsDisplayTransition
  );

  const slam = computeKineticSlamFrame(state.progress01);
  const { activeBeat, shockwaveScale, curtainSplit01 } = slam;
  const latestLog = state.visibleLogs[state.visibleLogs.length - 1];

  const overlayStyle = {
    '--boot-progress-01': String(slam.clampedProgress),
    '--kinetic-bg': activeBeat.bgHex,
    '--kinetic-ink': activeBeat.inkHex,
    '--kinetic-shockwave-scale': String(shockwaveScale),
    '--kinetic-split-01': String(curtainSplit01),
  } as CSSProperties;

  const isFinaleBeat = activeBeat.index === 3;
  const isSplitting = curtainSplit01 > 0 || closing;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="gusto-boot-title"
      hidden={hidden}
      data-closing={closing ? '' : undefined}
      data-beat-index={activeBeat.index}
      data-splitting={isSplitting ? 'true' : 'false'}
      style={overlayStyle}
      className="neo-boot-overlay fixed inset-0 z-50 m-0 flex flex-col justify-between overflow-hidden"
    >
      {/* Left & Right Brutalist Split Curtains (compositor translate3d) */}
      <div
        aria-hidden="true"
        className="neo-kinetic-curtain neo-kinetic-curtain-left absolute inset-y-0 left-0 w-[calc(50%+1px)] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="neo-kinetic-curtain neo-kinetic-curtain-right absolute inset-y-0 right-0 w-[calc(50%+1px)] pointer-events-none"
      />

      {/* Expanding Finale Shockwave Ring */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="neo-kinetic-shockwave size-48 sm:size-64 border-4 border-[#00F5D4]" />
      </div>

      {/* Top High-Contrast Telemetry & Skip Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b-4 border-[#0A0A0A] bg-[#0A0A0A] px-4 py-3 text-[#F4F3EE] sm:px-6">
        <div className="flex items-center gap-2.5 font-mono text-xs font-bold uppercase tracking-wider">
          <Zap className="size-4 text-[#FFE600]" aria-hidden="true" />
          <span>KINETIC_OVERCLOCK_SLAM // GUSTO_OS v2.6</span>
        </div>

        <button
          ref={skipButtonRef}
          type="button"
          onClick={onSkip}
          className="neo-btn-tactile inline-flex items-center justify-center gap-2 bg-[#FFE600] text-[#0A0A0A] px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <span aria-hidden="true">[</span>
          <span>SKIP INTRO</span>
          <span aria-hidden="true">-&gt;]</span>
        </button>
      </div>

      {/* Center Kinetic Typography Poster */}
      <div className="neo-kinetic-poster relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center sm:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <span
            className={
              isFinaleBeat
                ? 'border-2 border-[#00F5D4] bg-[#FFE600] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#0A0A0A]'
                : 'border-2 border-[#0A0A0A] bg-[#0A0A0A] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#FFE600]'
            }
          >
            {activeBeat.accentBadge}
          </span>

          <div
            aria-hidden="true"
            className="flex items-center gap-1.5 border-2 border-[#0A0A0A] bg-[#FFFFFF] px-2.5 py-1"
          >
            {KINETIC_SLAM_BEATS.map((beat) => (
              <span
                key={beat.index}
                className={
                  beat.index <= activeBeat.index
                    ? 'inline-block size-2.5 border border-[#0A0A0A] bg-[#0A0A0A]'
                    : 'inline-block size-2.5 border border-[#0A0A0A] bg-transparent'
                }
              />
            ))}
          </div>
        </div>

        <h2
          id="gusto-boot-title"
          className={
            isFinaleBeat
              ? 'neo-kinetic-word border-4 border-[#00F5D4] bg-[#050B14] px-6 py-2 sm:px-10 sm:py-4 font-sans font-black uppercase tracking-tighter select-none neo-shadow-lg'
              : 'neo-kinetic-word font-sans font-black uppercase tracking-tighter select-none'
          }
          style={{ color: activeBeat.inkHex }}
        >
          {activeBeat.word}
        </h2>

        <p
          className={
            isFinaleBeat
              ? 'mt-5 border-4 border-[#00F5D4] bg-[#FFE600] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0A0A0A] neo-shadow-sm sm:text-sm'
              : 'mt-5 border-4 border-[#0A0A0A] bg-[#0A0A0A] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#F4F3EE] neo-shadow-sm sm:text-sm'
          }
        >
          {activeBeat.subtag}
        </p>
      </div>

      {/* Bottom Accessible Progress & Telemetry Strip */}
      <div className="relative z-10 border-t-4 border-[#0A0A0A] bg-[#0A0A0A] px-4 py-3 text-[#F4F3EE] sm:px-6">
        <div className="mx-auto max-w-4xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs font-bold">
            <label
              htmlFor="gusto-boot-progress"
              className="inline-flex items-center gap-1.5 text-[#00F5D4]"
            >
              <Cpu className="size-3.5" aria-hidden="true" />
              <span>3D_WIREFRAME_ASSEMBLY: {state.progressPercent}%</span>
            </label>

            <span className="inline-flex items-center gap-1.5 text-[#FFE600]">
              <Terminal className="size-3.5" aria-hidden="true" />
              <span>{latestLog?.subsystem ?? 'KERNEL_BOOT // GUSTO_OS v2.6'}</span>
            </span>
          </div>

          <progress
            id="gusto-boot-progress"
            max={100}
            value={state.progressPercent}
            className="visually-hidden"
          />

          <div
            aria-hidden="true"
            className="h-3 w-full overflow-hidden border-2 border-[#00F5D4] bg-[#050B14] p-0.5"
          >
            <div className="neo-boot-progress-fill h-full w-full bg-[#FFE600]" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#B8C4D4]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#00F5D4]" aria-hidden="true" />
              <span>{formatBootTelemetryLine(state)}</span>
            </span>
            <span>ESC OR CLICK TOP-RIGHT TO SKIP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
