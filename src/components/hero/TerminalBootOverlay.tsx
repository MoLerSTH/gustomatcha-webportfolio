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

export const PIXEL_SHATTER_COLS = 8;
export const PIXEL_SHATTER_ROWS = 6;

const SHATTER_START_01 = 0.84;
const SHATTER_STAGGER_01 = 0.06;
const SHATTER_TILE_SPAN_01 = 0.095;

export interface KineticPixelTile {
  index: number;
  row: number;
  col: number;
  threshold01: number;
  offsetXpx: number;
  offsetYpx: number;
  rotateDeg: number;
  scale: number;
  opacity: number;
  isCracking: boolean;
}

export interface KineticSlamState {
  clampedProgress: number;
  activeBeat: KineticBeatSpec;
  shockwaveScale: number;
  shockwaveOpacity: number;
  shatterProgress01: number;
  hudOpacity: number;
  canvasTiles: KineticPixelTile[];
  topBarTiles: KineticPixelTile[];
  bottomBarTiles: KineticPixelTile[];
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

function clampProgress01(progress01: number): number {
  return Number.isFinite(progress01)
    ? Math.min(1, Math.max(0, progress01))
    : 0;
}

/**
 * Applies a smooth quadratic ease-out curve (`1 - (1 - t)^2`) for the bottom
 * progress indicator so it launches briskly and decelerates cleanly into 100%.
 */
export function computeEaseOutProgress01(progress01: number): number {
  const clamped = clampProgress01(progress01);
  return Number((1 - Math.pow(1 - clamped, 2)).toFixed(4));
}

function buildShatterBand(options: {
  rows: number;
  cols: number;
  bandBiasY: number;
  seedOffset: number;
  clampedProgress: number;
  forceBandY?: number;
}): KineticPixelTile[] {
  const { rows, cols, bandBiasY, seedOffset, clampedProgress, forceBandY } = options;
  const maxDist = Math.hypot(0.5, 0.5);
  const tiles: KineticPixelTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      const nx = (col + 0.5) / cols - 0.5;
      const ny = forceBandY ?? (row + 0.5) / rows - 0.5;

      // Deterministic integer hashes keep SSR markup identical to client hydration.
      const hashA = ((index * 73 + row * 37 + col * 19 + seedOffset * 53) % 97) / 96;
      const hashB = ((index * 41 + row * 61 + col * 83 + seedOffset * 29) % 89) / 88;
      const dist01 = Math.min(1, Math.hypot(nx, ny) / maxDist);

      const threshold01 = Number(
        (SHATTER_START_01 + dist01 * (SHATTER_STAGGER_01 * 0.72) + hashA * (SHATTER_STAGGER_01 * 0.28)).toFixed(4)
      );
      const localU = clampProgress01((clampedProgress - threshold01) / SHATTER_TILE_SPAN_01);
      const moveEase = 1 - Math.pow(1 - localU, 3);
      const opacity =
        localU <= 0 ? 1 : localU >= 1 ? 0 : Number((1 - Math.pow(localU, 1.35)).toFixed(3));

      const offsetXpx = Number(((nx * 240 + (hashA - 0.5) * 64) * moveEase).toFixed(2));
      const offsetYpx = Number(((ny * 180 + bandBiasY + (hashB - 0.5) * 40) * moveEase).toFixed(2));
      const rotateDeg = Number(((nx * 42 + (hashB - 0.5) * 28) * moveEase).toFixed(2));
      const scale = Number((1.02 - 0.84 * moveEase).toFixed(3));

      tiles.push({
        index,
        row,
        col,
        threshold01,
        offsetXpx,
        offsetYpx,
        rotateDeg,
        scale,
        opacity,
        isCracking: localU > 0 && localU < 1,
      });
    }
  }

  return tiles;
}

/**
 * Pure deterministic calculator mapping normalized boot progress into
 * the active Kinetic Brutalist Slam beat, shockwave ring, and full-viewport
 * pixel shatter + top/bottom bar scatter physics.
 */
export function computeKineticSlamFrame(progress01: number): KineticSlamState {
  const clampedProgress = clampProgress01(progress01);
  const activeBeat = resolveKineticBeat(clampedProgress);

  const shockU = clampProgress01((clampedProgress - 0.82) / 0.14);
  const shockEase = 1 - Math.pow(1 - shockU, 3);
  const shockwaveScale = Number((1 + shockEase * 2.4).toFixed(3));
  const shockwaveOpacity =
    clampedProgress < 0.82 ? 0 : Number(((1 - shockU) * 0.9).toFixed(3));

  const shatterProgress01 = Number(
    clampProgress01((clampedProgress - SHATTER_START_01) / (1 - SHATTER_START_01)).toFixed(3)
  );
  const hudFadeU = clampProgress01((clampedProgress - SHATTER_START_01) / 0.085);
  const hudOpacity = Number(Math.pow(1 - hudFadeU, 3).toFixed(3));

  return {
    clampedProgress,
    activeBeat,
    shockwaveScale,
    shockwaveOpacity,
    shatterProgress01,
    hudOpacity,
    canvasTiles: buildShatterBand({
      rows: PIXEL_SHATTER_ROWS,
      cols: PIXEL_SHATTER_COLS,
      bandBiasY: 0,
      seedOffset: 1,
      clampedProgress,
    }),
    topBarTiles: buildShatterBand({
      rows: 1,
      cols: PIXEL_SHATTER_COLS,
      bandBiasY: -105,
      seedOffset: 7,
      clampedProgress,
      forceBandY: -0.45,
    }),
    bottomBarTiles: buildShatterBand({
      rows: 1,
      cols: PIXEL_SHATTER_COLS,
      bandBiasY: 105,
      seedOffset: 13,
      clampedProgress,
      forceBandY: 0.45,
    }),
  };
}

function buildPixelTileStyle(
  tile: KineticPixelTile,
  backgroundColor: string
): CSSProperties {
  const accentColor = (tile.row + tile.col) % 2 === 0 ? '#00F5D4' : '#FFE600';
  return {
    backgroundColor,
    opacity: tile.opacity,
    transform: `translate3d(${tile.offsetXpx}px, ${tile.offsetYpx}px, 0) scale(${tile.scale}) rotate(${tile.rotateDeg}deg)`,
    borderColor: tile.isCracking ? accentColor : 'transparent',
  };
}

/**
 * 5.0s `GUSTO_OS v2.6` Kinetic Brutalist Slam Intro with full-viewport
 * pixel shatter + top/bottom bar scatter fade synchronized with Three.js assembly.
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
  const {
    activeBeat,
    shockwaveScale,
    shockwaveOpacity,
    shatterProgress01,
    hudOpacity,
    canvasTiles,
    topBarTiles,
    bottomBarTiles,
  } = slam;
  const easedBar01 = computeEaseOutProgress01(slam.clampedProgress);
  const easedBarPercent = Math.min(100, Math.max(0, Math.round(easedBar01 * 100)));
  const latestLog = state.visibleLogs[state.visibleLogs.length - 1];

  const overlayStyle = {
    '--boot-progress-01': String(easedBar01),
    '--kinetic-bg': activeBeat.bgHex,
    '--kinetic-ink': activeBeat.inkHex,
    '--kinetic-shockwave-scale': String(shockwaveScale),
    '--kinetic-shockwave-opacity': String(shockwaveOpacity),
  } as CSSProperties;

  const isFinaleBeat = activeBeat.index === 3;
  const isShattering = shatterProgress01 > 0 || closing;
  const hudShiftRatio = 1 - hudOpacity;

  const topHudStyle = {
    opacity: hudOpacity,
    transform: `translate3d(0, ${Number((-10 * hudShiftRatio).toFixed(2))}px, 0)`,
  } as CSSProperties;

  const centerHudStyle = {
    opacity: hudOpacity,
    transform: `scale(${Number((1 + 0.06 * hudShiftRatio).toFixed(3))})`,
  } as CSSProperties;

  const bottomHudStyle = {
    opacity: hudOpacity,
    transform: `translate3d(0, ${Number((10 * hudShiftRatio).toFixed(2))}px, 0)`,
  } as CSSProperties;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="gusto-boot-title"
      hidden={hidden}
      data-closing={closing ? '' : undefined}
      data-beat-index={activeBeat.index}
      data-shattering={isShattering ? 'true' : 'false'}
      style={overlayStyle}
      className="neo-boot-overlay fixed inset-0 z-50 m-0 flex flex-col justify-between overflow-hidden"
    >
      {/* Full-Viewport 8x6 Pixel Shatter Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none"
      >
        {canvasTiles.map((tile) => (
          <div
            key={tile.index}
            data-shatter-canvas-tile={tile.index}
            style={buildPixelTileStyle(tile, activeBeat.bgHex)}
            className="neo-kinetic-pixel h-full w-full"
          />
        ))}
      </div>

      {/* Expanding Finale Shockwave Ring */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="neo-kinetic-shockwave size-48 sm:size-64 border-4 border-[#00F5D4]" />
      </div>

      {/* Top High-Contrast Telemetry Bar + 8 Shattering Top-Band Pixels */}
      <div className="relative z-10 px-4 py-3 text-[#F4F3EE] sm:px-6">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-8 pointer-events-none"
        >
          {topBarTiles.map((tile) => (
            <div
              key={tile.index}
              data-shatter-top-tile={tile.index}
              style={buildPixelTileStyle(tile, '#0A0A0A')}
              className="neo-kinetic-pixel h-full w-full"
            />
          ))}
        </div>

        <div
          style={topHudStyle}
          className="neo-kinetic-hud relative z-10 flex flex-wrap items-center justify-between gap-3"
        >
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
      </div>

      {/* Center Kinetic Typography Poster */}
      <div
        style={centerHudStyle}
        className="neo-kinetic-hud neo-kinetic-poster relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center sm:px-8"
      >
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

      {/* Bottom Accessible Progress Bar + 8 Shattering Bottom-Band Pixels */}
      <div className="relative z-10 px-4 py-3 text-[#F4F3EE] sm:px-6">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-8 pointer-events-none"
        >
          {bottomBarTiles.map((tile) => (
            <div
              key={tile.index}
              data-shatter-bottom-tile={tile.index}
              style={buildPixelTileStyle(tile, '#0A0A0A')}
              className="neo-kinetic-pixel h-full w-full"
            />
          ))}
        </div>

        <div
          style={bottomHudStyle}
          className="neo-kinetic-hud relative z-10 mx-auto max-w-4xl space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs font-bold">
            <label
              htmlFor="gusto-boot-progress"
              className="inline-flex items-center gap-1.5 text-[#00F5D4]"
            >
              <Cpu className="size-3.5" aria-hidden="true" />
              <span>3D_WIREFRAME_ASSEMBLY: {easedBarPercent}%</span>
            </label>

            <span className="inline-flex items-center gap-1.5 text-[#FFE600]">
              <Terminal className="size-3.5" aria-hidden="true" />
              <span>{latestLog?.subsystem ?? 'KERNEL_BOOT // GUSTO_OS v2.6'}</span>
            </span>
          </div>

          <progress
            id="gusto-boot-progress"
            max={100}
            value={easedBarPercent}
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
