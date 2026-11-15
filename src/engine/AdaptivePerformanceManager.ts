export type PerformanceTier = 'low' | 'medium' | 'high';

export interface DeviceCapabilityInput {
  hardwareConcurrency?: number;
  screenWidth?: number;
  devicePixelRatio?: number;
  prefersReducedMotion?: boolean;
  gpuRenderer?: string;
}

export interface EngineQualityProfile {
  tier: PerformanceTier;
  pixelRatio: number;
  coreSubdivisions: number;
  wireframeSubdivisions: number;
  torusTubularSegments: number;
  particleCount: number;
  enableVertexDisplacement: boolean;
  motionScale: number;
}

const LOW_END_GPU_PATTERNS = /swiftshader|llvmpipe|software|mali-4|adreno\s*3|intel.*hd\s*graphics\s*[345]\d{2}/i;

/**
 * Evaluates client hardware & accessibility capabilities to select a locked-60FPS
 * Three.js quality profile while capping devicePixelRatio at <= 2.
 */
export function computeQualityProfile(
  input?: DeviceCapabilityInput
): EngineQualityProfile {
  const isBrowser = typeof window !== 'undefined';

  const cores =
    input?.hardwareConcurrency ??
    (isBrowser && typeof navigator !== 'undefined'
      ? navigator.hardwareConcurrency || 4
      : 4);

  const width =
    input?.screenWidth ?? (isBrowser ? window.innerWidth || 1280 : 1280);

  const rawDpr =
    input?.devicePixelRatio ??
    (isBrowser ? window.devicePixelRatio || 1 : 1);

  const reducedMotion =
    input?.prefersReducedMotion ??
    (isBrowser && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false);

  const gpuRenderer = input?.gpuRenderer ?? '';
  const isSoftwareOrLowGpu = LOW_END_GPU_PATTERNS.test(gpuRenderer);

  let tier: PerformanceTier = 'medium';
  if (isSoftwareOrLowGpu || cores <= 2 || width < 640) {
    tier = 'low';
  } else if (cores >= 8 && width >= 1024) {
    tier = 'high';
  }

  const cappedDpr = Math.max(1, Math.min(rawDpr, 2));
  const pixelRatio =
    tier === 'high'
      ? cappedDpr
      : tier === 'medium'
        ? Math.min(cappedDpr, 1.5)
        : Math.min(cappedDpr, 1.25);

  const motionScale = reducedMotion ? 0.12 : 1.0;

  if (tier === 'high') {
    return {
      tier: 'high',
      pixelRatio,
      coreSubdivisions: 4,
      wireframeSubdivisions: 2,
      torusTubularSegments: 96,
      particleCount: 140,
      enableVertexDisplacement: true,
      motionScale,
    };
  }

  if (tier === 'medium') {
    return {
      tier: 'medium',
      pixelRatio,
      coreSubdivisions: 3,
      wireframeSubdivisions: 2,
      torusTubularSegments: 64,
      particleCount: 84,
      enableVertexDisplacement: true,
      motionScale,
    };
  }

  return {
    tier: 'low',
    pixelRatio,
    coreSubdivisions: 2,
    wireframeSubdivisions: 1,
    torusTubularSegments: 40,
    particleCount: 42,
    enableVertexDisplacement: !reducedMotion,
    motionScale,
  };
}

/**
 * Rolling window frame-time monitor that flags sustained drops below 42 FPS
 * so the 3D engine can dynamically step down pixel ratio or detail.
 */
export class RollingFpsMonitor {
  private readonly sampleSize: number;
  private readonly frameDeltas: number[] = [];

  constructor(sampleSize = 45) {
    this.sampleSize = Math.max(3, sampleSize);
  }

  public recordFrame(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || deltaMs > 500) {
      return;
    }
    this.frameDeltas.push(deltaMs);
    if (this.frameDeltas.length > this.sampleSize) {
      this.frameDeltas.shift();
    }
  }

  public getAverageFps(): number {
    if (this.frameDeltas.length === 0) {
      return 60;
    }
    const avgDelta =
      this.frameDeltas.reduce((sum, val) => sum + val, 0) /
      this.frameDeltas.length;
    return Math.min(120, Math.round(1000 / Math.max(1, avgDelta)));
  }

  public shouldDowngrade(): boolean {
    if (this.frameDeltas.length < this.sampleSize) {
      return false;
    }
    return this.getAverageFps() < 42;
  }

  public reset(): void {
    this.frameDeltas.length = 0;
  }
}
