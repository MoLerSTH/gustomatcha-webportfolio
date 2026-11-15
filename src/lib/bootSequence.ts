import type { AccentColor } from '@/data/portfolioData';

export const BOOT_SESSION_STORAGE_KEY = 'gusto_os_booted_v26';
export const BOOT_TOTAL_DURATION_MS = 2200;
export const BOOT_EXIT_TRANSITION_MS = 250;

export type BootPhase =
  | 'WIREFRAME_INIT'
  | 'SHADER_COMPILE'
  | 'ORBITAL_LOCK'
  | 'READY';

export interface BootLogStep {
  id: string;
  threshold01: number;
  timestampLabel: string;
  subsystem: string;
  message: string;
  status: 'INIT' | 'OK' | 'SYNC' | 'READY';
  accent: AccentColor;
}

export const GUSTO_BOOT_LOGS: BootLogStep[] = [
  {
    id: 'kernel-boot',
    threshold01: 0,
    timestampLabel: '0.00s',
    subsystem: 'KERNEL_BOOT // GUSTO_OS v2.6',
    message: 'Mounting Neo-Brutalist architectural canvas & typography tokens...',
    status: 'INIT',
    accent: 'yellow',
  },
  {
    id: 'webgl-stage',
    threshold01: 0.18,
    timestampLabel: '0.40s',
    subsystem: 'WEBGL_STAGE // PURE_THREEJS_GLSL',
    message: 'Allocating procedural icosahedron wireframe & cel-shader uniforms...',
    status: 'OK',
    accent: 'cobalt',
  },
  {
    id: 'node-gistda',
    threshold01: 0.38,
    timestampLabel: '0.84s',
    subsystem: 'NODE_01 // GISTDA_THEOS_CALVAL',
    message: 'Binding THEOS-1/2 geospatial telemetry node (FastAPI + GDAL + PG)...',
    status: 'OK',
    accent: 'yellow',
  },
  {
    id: 'node-kbtg',
    threshold01: 0.58,
    timestampLabel: '1.28s',
    subsystem: 'NODE_02 // KBTG_RISK_ENGINE',
    message: 'Syncing K PLUS real-time anti-scam risk forensics node (iLoveKBTG)...',
    status: 'SYNC',
    accent: 'mint',
  },
  {
    id: 'node-assignier',
    threshold01: 0.78,
    timestampLabel: '1.72s',
    subsystem: 'NODE_03 // ROPA2077_ASSIGNIER_AI',
    message: 'Calibrating Typhoon OCR + local Ollama grading node...',
    status: 'SYNC',
    accent: 'coral',
  },
  {
    id: 'system-lock',
    threshold01: 0.95,
    timestampLabel: '2.10s',
    subsystem: 'SYSTEM_LOCK // 60FPS_NEO_BRUTAL_READY',
    message: 'Solidifying geometry shell. All interactive telemetry channels online.',
    status: 'READY',
    accent: 'mint',
  },
];

export interface BootSequenceState {
  elapsedMs: number;
  progress01: number;
  progressPercent: number;
  phase: BootPhase;
  statusHeadline: string;
  visibleLogs: BootLogStep[];
  isComplete: boolean;
}

const PHASE_HEADLINES: Record<BootPhase, string> = {
  WIREFRAME_INIT: 'ALLOCATING WIREFRAME TOPOLOGY',
  SHADER_COMPILE: 'COMPILING NEO-BRUTALIST GLSL SHADERS',
  ORBITAL_LOCK: 'LOCKING 3 SATELLITE PROJECT NODES',
  READY: 'GUSTO_OS v2.6 // ONLINE @ 60 FPS',
};

function resolveBootPhase(progress01: number): BootPhase {
  if (progress01 >= 1) return 'READY';
  if (progress01 >= 0.72) return 'ORBITAL_LOCK';
  if (progress01 >= 0.35) return 'SHADER_COMPILE';
  return 'WIREFRAME_INIT';
}

/**
 * Pure deterministic boot-sequence mapper translating elapsed milliseconds
 * into normalized [0..1] 3D assembly progress, active phase, and visible logs.
 */
export function computeBootSequenceState(
  elapsedMs: number,
  totalDurationMs = BOOT_TOTAL_DURATION_MS
): BootSequenceState {
  const effectiveDuration = Number.isFinite(totalDurationMs)
    ? totalDurationMs
    : BOOT_TOTAL_DURATION_MS;

  if (effectiveDuration <= 0) {
    return {
      elapsedMs: 0,
      progress01: 1,
      progressPercent: 100,
      phase: 'READY',
      statusHeadline: PHASE_HEADLINES.READY,
      visibleLogs: GUSTO_BOOT_LOGS,
      isComplete: true,
    };
  }

  const safeElapsed =
    Number.isFinite(elapsedMs) && elapsedMs > 0
      ? Math.min(elapsedMs, effectiveDuration)
      : 0;

  const progress01 = Number((safeElapsed / effectiveDuration).toFixed(4));
  const progressPercent = Math.min(100, Math.max(0, Math.round(progress01 * 100)));
  const phase = resolveBootPhase(progress01);

  return {
    elapsedMs: safeElapsed,
    progress01,
    progressPercent,
    phase,
    statusHeadline: PHASE_HEADLINES[phase],
    visibleLogs: GUSTO_BOOT_LOGS.filter((step) => progress01 >= step.threshold01),
    isComplete: progress01 >= 1,
  };
}

function getDefaultSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Checks whether the current browser session has already completed or skipped
 * the <= 3.0s intro sequence. Never throws in SSR or restricted storage contexts.
 */
export function hasSessionBooted(
  storage: Pick<Storage, 'getItem'> | null = getDefaultSessionStorage()
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(BOOT_SESSION_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Marks the current session as booted so repeat page visits bypass the intro.
 */
export function markSessionBooted(
  storage: Pick<Storage, 'setItem'> | null = getDefaultSessionStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(BOOT_SESSION_STORAGE_KEY, '1');
  } catch {
    // Ignore storage quota/security restrictions in sandboxed environments.
  }
}

/**
 * Clears the persisted session boot marker (used for explicit diagnostics/replay).
 */
export function clearSessionBooted(
  storage: Pick<Storage, 'removeItem'> | null = getDefaultSessionStorage()
): void {
  if (!storage) return;
  try {
    storage.removeItem(BOOT_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage security restrictions.
  }
}
