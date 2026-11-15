# Phase 2: Pure Three.js Procedural Engine (`GustoWorldEngine.ts`) & 4-Way Interactivity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 100% procedural, decoupled Pure Three.js 3D engine (`GustoWorldEngine`) with adaptive device tiering, custom GLSL shaders, 4-way interactivity (mouse parallax/velocity, GSAP `ScrollTrigger` camera/mesh choreography, raycasting satellite project triggers, and Web Audio API frequency pulse), and complete WebGL resource disposal on unmount.

**Architecture:** The 3D subsystem is strictly decoupled from React's render cycle inside `src/engine/`: `AdaptivePerformanceManager.ts` computes hardware tier settings (`devicePixelRatio <= 2`, icosahedron subdivision, ring segments, reduced-motion clamping), `proceduralShaders.ts` defines the custom Neo-Brutalist GLSL vertex/fragment shaders, `AudioReactiveController.ts` encapsulates the Web Audio API synthesizer + `AnalyserNode` frequency extractor, and `GustoWorldEngine.ts` orchestrates the Three.js `Scene`, `PerspectiveCamera`, `WebGLRenderer`, raycaster, GSAP `ScrollTrigger` timelines, and deterministic `dispose()` lifecycle. A lightweight React host component (`src/components/three/GustoCanvasStage.tsx`) mounts the engine via `useRef`, provides keyboard-accessible satellite node trigger buttons for WCAG parity, and displays live engine telemetry & selected project feedback.

**Tech Stack:** Pure Three.js (`three` v0.187), Custom GLSL (`ShaderMaterial`), GSAP + `ScrollTrigger` (`gsap`, `gsap/ScrollTrigger`), Web Audio API (`AudioContext`, `AnalyserNode`, `OscillatorNode`, `GainNode`), React 19 (`useRef`, `useEffect`), TypeScript 6 strict mode, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-gusto-3d-portfolio-design.md`

## Global Constraints

- **100% Procedural Pure Three.js:** Use `class GustoWorldEngine` mounted via `useRef`, zero React-Three-Fiber, locked 60 FPS target, and complete geometry/material/renderer/listener disposal on unmount.
- **Adaptive Device Tiering:** Detect `navigator.hardwareConcurrency`, viewport width, WebGL renderer hints, and `prefers-reduced-motion` to dynamically scale `devicePixelRatio` (capped at `2`), geometry detail, and animation intensity.
- **Hero Procedural Abstract Sculpture:** Multi-layered procedural core (morphing icosahedron custom GLSL core + pitch-black wireframe cage + floating orbital rings + 3 satellite-inspired project nodes for `gistda-calval`, `kbtg-anti-scam`, and `ropa2077-assignier`).
- **4-Way Full Interactivity:**
  1. Mouse Parallax & Velocity vertex deformation (caching bounding rect on resize/scroll to avoid layout thrashing).
  2. Scroll-Driven Choreography via GSAP `ScrollTrigger`.
  3. Raycasting Project Triggers on the 3 orbiting satellite nodes + 5x rapid click detector on the central core (ready for Phase 5 Overclock Easter Egg).
  4. Optional Audio-Reactive Pulse via `[AUDIO_SYNC: ON/OFF]` using Web Audio API.
- **Modern Web Guidance Compliance:** Pause WebGL loop when off-screen or hidden (`contentvisibilityautostatechange` / `IntersectionObserver` / `visibilitychange`), apply `contain: layout style paint` on the canvas stage, never auto-play audio without explicit user toggle, and provide keyboard-reachable equivalents for 3D raycast targets.

## Review Focus

1. **WebGL Memory & Listener Leaks on Unmount:** Calling `engine.dispose()` must cancel `requestAnimationFrame`, kill GSAP `ScrollTrigger` instances, remove all window/canvas event listeners, disconnect observers, stop Web Audio nodes, and call `.dispose()` on every `BufferGeometry`, `Material`, and `WebGLRenderer`.
2. **SSR & Headless Test Safety:** `AdaptivePerformanceManager`, `AudioReactiveController`, and `GustoWorldEngine` helper methods must guard `window`/`navigator`/`AudioContext` so Next.js SSR prerendering (`next build`) and Node Vitest tests never crash.
3. **Layout Thrashing on Pointer Move (INP):** Pointer move handlers must read cached canvas rect bounds updated via `ResizeObserver` / passive scroll listener instead of invoking `getBoundingClientRect()` on every pointer frame.
4. **Raycasting & Keyboard Accessibility Parity:** Clicking or hovering any of the 3 satellite nodes (`gistda-calval`, `kbtg-anti-scam`, `ropa2077-assignier`) must resolve to the exact `ProjectItem` in `FEATURED_PROJECTS`, and keyboard users must be able to trigger the same node selection via HUD buttons.
5. **Theme Reactivity in 3D Scene:** Switching `data-theme="overclock"` must immediately update the 3D engine's wireframe, lighting, and shader uniforms to match the Blueprint/Wireframe aesthetic.

---

### Task 1: Adaptive Performance & Device Tiering Manager (`src/engine/AdaptivePerformanceManager.ts`)

**Files:**
- Create: `src/engine/AdaptivePerformanceManager.ts`
- Test: `src/engine/__tests__/AdaptivePerformanceManager.test.ts`

**Interfaces:**
- Produces:
  - `export type PerformanceTier = 'low' | 'medium' | 'high'`
  - `export interface DeviceCapabilityInput { hardwareConcurrency?: number; screenWidth?: number; devicePixelRatio?: number; prefersReducedMotion?: boolean; gpuRenderer?: string; }`
  - `export interface EngineQualityProfile { tier: PerformanceTier; pixelRatio: number; coreSubdivisions: number; wireframeSubdivisions: number; torusTubularSegments: number; particleCount: number; enableVertexDisplacement: boolean; motionScale: number; }`
  - `export function computeQualityProfile(input?: DeviceCapabilityInput): EngineQualityProfile`
  - `export class RollingFpsMonitor { constructor(sampleSize?: number); recordFrame(deltaMs: number): void; getAverageFps(): number; shouldDowngrade(): boolean; reset(): void; }`

- [ ] **Step 1: Write the failing unit tests in `src/engine/__tests__/AdaptivePerformanceManager.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  computeQualityProfile,
  RollingFpsMonitor,
} from '../AdaptivePerformanceManager';

describe('AdaptivePerformanceManager', () => {
  it('caps devicePixelRatio strictly at 2 even on 3x/4x displays', () => {
    const profile = computeQualityProfile({
      hardwareConcurrency: 12,
      screenWidth: 1920,
      devicePixelRatio: 3.5,
      prefersReducedMotion: false,
    });
    expect(profile.tier).toBe('high');
    expect(profile.pixelRatio).toBe(2);
    expect(profile.coreSubdivisions).toBeGreaterThanOrEqual(4);
  });

  it('assigns low tier with reduced geometry subdivisions on mobile/low-core devices', () => {
    const profile = computeQualityProfile({
      hardwareConcurrency: 2,
      screenWidth: 390,
      devicePixelRatio: 2,
      prefersReducedMotion: false,
    });
    expect(profile.tier).toBe('low');
    expect(profile.pixelRatio).toBeLessThanOrEqual(1.25);
    expect(profile.coreSubdivisions).toBeLessThan(4);
  });

  it('dampens motionScale when prefersReducedMotion is enabled', () => {
    const profile = computeQualityProfile({
      hardwareConcurrency: 8,
      screenWidth: 1440,
      devicePixelRatio: 2,
      prefersReducedMotion: true,
    });
    expect(profile.motionScale).toBeLessThanOrEqual(0.2);
  });

  it('detects sustained sub-42 FPS frame times in RollingFpsMonitor', () => {
    const monitor = new RollingFpsMonitor(5);
    for (let i = 0; i < 5; i++) {
      monitor.recordFrame(33.3); // ~30 FPS
    }
    expect(monitor.getAverageFps()).toBeLessThan(35);
    expect(monitor.shouldDowngrade()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/engine/__tests__/AdaptivePerformanceManager.test.ts`
Expected: FAIL with cannot find module `../AdaptivePerformanceManager`

- [ ] **Step 3: Implement `src/engine/AdaptivePerformanceManager.ts`**

Implement deterministic tier detection (`low`, `medium`, `high`), `devicePixelRatio` clamping (`Math.min(dpr, 2)` on high, `1.5` on medium, `1.25` on low), geometry subdivision scaling, and `RollingFpsMonitor`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/engine/__tests__/AdaptivePerformanceManager.test.ts`
Expected: PASS (`4 passed`)

---

### Task 2: Custom Neo-Brutalist GLSL Shaders & Orbital Node Metadata (`src/engine/proceduralShaders.ts`)

**Files:**
- Create: `src/engine/proceduralShaders.ts`
- Test: `src/engine/__tests__/proceduralShaders.test.ts`

**Interfaces:**
- Produces:
  - `export const CORE_VERTEX_SHADER: string`
  - `export const CORE_FRAGMENT_SHADER: string`
  - `export interface SatelliteNodeSpec { projectId: string; highlightOrder: 1 | 2 | 3; label: string; colorHex: string; orbitRadius: number; orbitSpeed: number; orbitTilt: number; phaseOffset: number; geometryType: 'octahedron' | 'dodecahedron' | 'tetrahedron'; }`
  - `export const SATELLITE_NODE_SPECS: SatelliteNodeSpec[]`
  - `export function computeSatelliteWorldPosition(spec: SatelliteNodeSpec, elapsedSeconds: number, expansionScale?: number): { x: number; y: number; z: number }`

- [ ] **Step 1: Write the failing unit tests in `src/engine/__tests__/proceduralShaders.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  CORE_VERTEX_SHADER,
  CORE_FRAGMENT_SHADER,
  SATELLITE_NODE_SPECS,
  computeSatelliteWorldPosition,
} from '../proceduralShaders';
import { FEATURED_PROJECTS } from '@/data/portfolioData';

describe('proceduralShaders & Satellite Node Specs', () => {
  it('defines GLSL vertex and fragment shaders with required reactive uniforms', () => {
    expect(CORE_VERTEX_SHADER).toContain('uniform float uTime;');
    expect(CORE_VERTEX_SHADER).toContain('uniform float uPointerVelocity;');
    expect(CORE_VERTEX_SHADER).toContain('uniform float uAudioPulse;');
    expect(CORE_VERTEX_SHADER).toContain('uniform float uShockwave;');
    expect(CORE_FRAGMENT_SHADER).toContain('uniform vec3 uPrimaryColor;');
    expect(CORE_FRAGMENT_SHADER).toContain('uniform float uOverclockMode;');
  });

  it('maps all 3 satellite nodes to the exact Top 3 Featured Project IDs', () => {
    expect(SATELLITE_NODE_SPECS).toHaveLength(3);
    expect(SATELLITE_NODE_SPECS.map((s) => s.projectId)).toEqual(
      FEATURED_PROJECTS.map((p) => p.id)
    );
  });

  it('computes finite orbital 3D coordinates across time and scroll expansion', () => {
    const pos0 = computeSatelliteWorldPosition(SATELLITE_NODE_SPECS[0], 0, 1);
    const pos1 = computeSatelliteWorldPosition(SATELLITE_NODE_SPECS[0], 2.5, 1.4);
    expect(Number.isFinite(pos0.x)).toBe(true);
    expect(Number.isFinite(pos0.y)).toBe(true);
    expect(Number.isFinite(pos0.z)).toBe(true);
    expect(pos0.x).not.toBe(pos1.x);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/engine/__tests__/proceduralShaders.test.ts`
Expected: FAIL with cannot find module `../proceduralShaders`

- [ ] **Step 3: Implement `src/engine/proceduralShaders.ts`**

Author `CORE_VERTEX_SHADER` (simplex/trigonometric multi-frequency normal displacement driven by `uTime`, `uPointerVelocity`, `uAudioPulse`, `uShockwave`, and `uAssemblyProgress`) and `CORE_FRAGMENT_SHADER` (stepped cel-band Neo-Brutalist lighting with hard ink rim outline `#0A0A0A` in daylight mode and glowing `#00F5D4` / `#FFE600` vector scanlines in Overclock mode), plus `SATELLITE_NODE_SPECS` and `computeSatelliteWorldPosition`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/engine/__tests__/proceduralShaders.test.ts`
Expected: PASS (`3 passed`)

---

### Task 3: Web Audio API Reactive Pulse Controller (`src/engine/AudioReactiveController.ts`)

**Files:**
- Create: `src/engine/AudioReactiveController.ts`
- Test: `src/engine/__tests__/AudioReactiveController.test.ts`

**Interfaces:**
- Produces:
  - `export interface AudioFrequencySnapshot { bass: number; mid: number; high: number; overall: number; isActive: boolean; }`
  - `export class AudioReactiveController { isEnabled(): boolean; toggle(): Promise<boolean>; start(): Promise<boolean>; stop(): void; sampleFrequencies(elapsedSeconds?: number): AudioFrequencySnapshot; triggerSynthPulse(frequencyHz?: number, durationSec?: number): void; dispose(): void; }`

- [ ] **Step 1: Write the failing unit tests in `src/engine/__tests__/AudioReactiveController.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { AudioReactiveController } from '../AudioReactiveController';

describe('AudioReactiveController', () => {
  it('starts disabled by default to respect WCAG 1.4.2 no-autoplay and returns zeroed telemetry', () => {
    const controller = new AudioReactiveController();
    expect(controller.isEnabled()).toBe(false);
    const snap = controller.sampleFrequencies(1.0);
    expect(snap.isActive).toBe(false);
    expect(snap.overall).toBe(0);
    controller.dispose();
  });

  it('produces normalized [0..1] frequency bands when active in headless/fallback synth mode', async () => {
    const controller = new AudioReactiveController();
    await controller.start();
    expect(controller.isEnabled()).toBe(true);
    const snap = controller.sampleFrequencies(0.5);
    expect(snap.isActive).toBe(true);
    expect(snap.bass).toBeGreaterThanOrEqual(0);
    expect(snap.bass).toBeLessThanOrEqual(1);
    expect(snap.overall).toBeGreaterThan(0);
    controller.stop();
    expect(controller.isEnabled()).toBe(false);
    controller.dispose();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/engine/__tests__/AudioReactiveController.test.ts`
Expected: FAIL with cannot find module `../AudioReactiveController`

- [ ] **Step 3: Implement `src/engine/AudioReactiveController.ts`**

Build a Web Audio API ambient beat/pulse generator (`AudioContext` + `OscillatorNode` + `BiquadFilterNode` + `GainNode` + `AnalyserNode`) that only starts on explicit user gesture, extracts normalized `bass`, `mid`, `high`, and `overall` bands (`0..1`), gracefully falls back to deterministic mathematical harmonic envelopes when `AudioContext` is unavailable (e.g. headless test environments), and exposes `triggerSynthPulse(frequencyHz)` ready for Phase 5's playable synthesizer.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/engine/__tests__/AudioReactiveController.test.ts`
Expected: PASS (`2 passed`)

---

### Task 4: Decoupled Pure Three.js Procedural Engine (`src/engine/GustoWorldEngine.ts`)

**Files:**
- Create: `src/engine/GustoWorldEngine.ts`
- Test: `src/engine/__tests__/GustoWorldEngine.test.ts`

**Interfaces:**
- Consumes: `AdaptivePerformanceManager`, `proceduralShaders`, `AudioReactiveController`
- Produces:
  - `export interface GustoEngineCallbacks { onSelectProject?: (projectId: string) => void; onHoverProject?: (projectId: string | null) => void; onCoreRapidClick?: () => void; onTelemetryUpdate?: (telemetry: EngineTelemetrySnapshot) => void; }`
  - `export interface EngineTelemetrySnapshot { fps: number; tier: PerformanceTier; activeNodeId: string | null; scrollProgress: number; audioLevel: number; overclockMode: boolean; }`
  - `export class GustoWorldEngine` with methods:
    - `constructor(container: HTMLElement, callbacks?: GustoEngineCallbacks)`
    - `setAssemblyProgress(progress01: number): void`
    - `setOverclockMode(enabled: boolean): void`
    - `setAudioPulseLevel(level01: number): void`
    - `triggerShockwave(accentHex?: string): void`
    - `focusProjectNode(projectId: string | null): void`
    - `pause(): void` / `resume(): void`
    - `dispose(): void`

- [ ] **Step 1: Write the failing unit tests for engine state, rapid core click detection, and scroll interpolation in `src/engine/__tests__/GustoWorldEngine.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import {
  RapidClickDetector,
  computeScrollChoreographyState,
} from '../GustoWorldEngine';

describe('GustoWorldEngine Pure Logic Helpers', () => {
  it('fires onRapidTrigger when 5 clicks occur within the time window', () => {
    const spy = vi.fn();
    const detector = new RapidClickDetector(5, 1800, spy);
    detector.registerClick(100);
    detector.registerClick(300);
    detector.registerClick(600);
    detector.registerClick(900);
    expect(spy).not.toHaveBeenCalled();
    detector.registerClick(1200);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('computes smooth camera & disassembly choreography across scroll [0..1]', () => {
    const start = computeScrollChoreographyState(0);
    const mid = computeScrollChoreographyState(0.5);
    const end = computeScrollChoreographyState(1);

    expect(start.ringExpansion).toBe(1);
    expect(mid.ringExpansion).toBeGreaterThan(start.ringExpansion);
    expect(end.cameraZ).not.toBe(start.cameraZ);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/engine/__tests__/GustoWorldEngine.test.ts`
Expected: FAIL with cannot find module `../GustoWorldEngine`

- [ ] **Step 3: Implement `src/engine/GustoWorldEngine.ts`**

Build the complete Pure Three.js `GustoWorldEngine` class:
- Scene graph:
  - Central procedural `IcosahedronGeometry` with custom GLSL `ShaderMaterial`
  - Counter-rotating outer brutalist wireframe cage (`EdgesGeometry` + `LineSegments`)
  - 3 tilted gyroscopic `TorusGeometry` orbital rings + procedural telemetry point cloud
  - 3 distinct satellite project nodes (`octahedron`, `dodecahedron`, `tetrahedron` with orbital solar/radar/cube sub-meshes) tagged with `userData.projectId`
- 4-Way Interactivity:
  - Cached bounding rect pointer tracking (`ResizeObserver` + passive scroll rect refresh) driving smoothed pointer parallax & vertex velocity uniform
  - GSAP `ScrollTrigger` timeline scrubbed to page scroll updating `scrollProgress`, camera position/angle, and orbital ring expansion
  - `THREE.Raycaster` hit-testing the 3 satellite nodes + central core (including `RapidClickDetector` for 5x rapid clicks)
  - Audio pulse uniform modulation
- Modern Web Guidance lifecycle:
  - Pauses animation loop on `contentvisibilityautostatechange` (`event.skipped`), `IntersectionObserver` off-screen fallback, and `document.visibilitychange`
  - Traverses and disposes every geometry, material, texture, and renderer resource on `dispose()`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/engine/__tests__/GustoWorldEngine.test.ts`
Expected: PASS (`2 passed`)

---

### Task 5: Interactive 3D Stage Component, Audio Sync Integration & Autonomous Verification

**Files:**
- Create: `src/components/three/GustoCanvasStage.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `GustoWorldEngine`, `AudioReactiveController`, `FEATURED_PROJECTS`, `useBlueprintTheme`

- [ ] **Step 1: Implement `src/components/three/GustoCanvasStage.tsx`**

Mount `GustoWorldEngine` via `useRef`, wire `[AUDIO_SYNC: ON/OFF]` and `[BLUEPRINT: ON/OFF]`, provide accessible keyboard HUD buttons for each of the 3 Satellite Project Nodes (`NODE_01 // THEOS_CALVAL`, `NODE_02 // RISK_ENGINE`, `NODE_03 // ASSIGNIER_AI`), and display an interactive Neo-Brutalist Project Inspector card when a 3D satellite node is clicked or selected.

- [ ] **Step 2: Integrate `GustoCanvasStage` into `src/app/page.tsx` and synchronize navbar `[AUDIO_SYNC: ON/OFF]`**

Replace the Phase 1 placeholder slot in `src/app/page.tsx` with the live interactive 3D stage and connect the top navbar's `[AUDIO_SYNC: ON/OFF]` button to `AudioReactiveController`.

- [ ] **Step 3: Run full verification gate (`npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`)**

Run:
```powershell
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```
Expected: All Vitest tests pass (`18/18`), `tsc --noEmit` exits `0`, `eslint .` exits `0` with 0 warnings, and `next build` succeeds with exit code `0`.
