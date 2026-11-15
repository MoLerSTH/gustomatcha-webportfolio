# Phase 3: `<= 3.0s` Terminal Intro Sequence & Hero Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the strictly `<= 3.0s` high-speed `GUSTO_OS v2.6` Terminal Boot-up Intro Sequence synchronized with 3D wireframe-to-shaded sculpture assembly (`assemblyProgress: 0 -> 1`), an instant accessible `[SKIP INTRO ->]` control with `sessionStorage` repeat-visit bypass (`gusto_os_booted_v26`), and the full Friendly Neo-Brutalist Hero Section for Hattakorn Pongsawai (`Gusto | MoLerSTH`).

**Architecture:** A pure deterministic state machine (`src/lib/bootSequence.ts`) maps elapsed milliseconds (`0..2200ms`, leaving `250ms` for discrete exit transition = `2.45s <= 3.0s`) into normalized 3D assembly progress (`0..1`), subsystem boot logs, and `sessionStorage` persistence (`gusto_os_booted_v26`). `GustoWorldEngine` and `CORE_FRAGMENT_SHADER` interpolate the 3D sculpture from an exploded blueprint wireframe cage at `assemblyProgress = 0` into solid stepped Neo-Brutalist cel-shaded geometry at `assemblyProgress = 1`. The Hero Section (`src/components/hero/HeroSection.tsx`) renders the primary `<h1>` and CTA controls immediately in SSR HTML so Largest Contentful Paint (LCP) is never gated by JavaScript, while `TerminalBootOverlay.tsx` provides an isolated (`contain: layout style paint`), keyboard-accessible boot HUD with native `<progress>` semantics, `@starting-style` / `transition-behavior: allow-discrete` entry-exit transitions, and a Firefox discrete-display fallback (`[data-closing]`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict mode, Tailwind CSS v4, Pure Three.js (`three`), Custom GLSL (`ShaderMaterial`), Lucide React (`lucide-react`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-gusto-3d-portfolio-design.md`

## Global Constraints

- **Strict Intro Time Budget (`<= 3.0s`):** Total boot duration (`BOOT_TOTAL_DURATION_MS = 2200` + `250ms` exit transition = `2450ms`) must never exceed `3000ms`.
- **Instant Skip & Session Bypass:** Must include a corner `[SKIP INTRO ->]` `<button>` (also triggered by `Escape`) and persist `sessionStorage.getItem('gusto_os_booted_v26') === '1'` so repeat visits in the same session load instantaneously at `assemblyProgress = 1`.
- **3D Wireframe-to-Shaded Assembly Sync:** During the boot sequence, `GustoWorldEngine.setAssemblyProgress(progress01)` must morph the central procedural sculpture from raw wireframe lines (`0.0`) into solid Neo-Brutalist shaded geometry (`1.0`) and fire a completion shockwave when assembly locks at `1.0`.
- **Core Identity & Hero Copy (Zero Placeholders):**
  - Greeting: `Hi, I'm Gusto — Hattakorn Pongsawai`
  - Role Headline: `Backend & AI Systems Architect // Creative Technologist`
  - Education: `3rd-Year B.Eng. in Software Engineering (TEP/TEPE Program), Thammasat University`
  - Telemetry Strip: `SYSTEM_ROLE`, `ACADEMIC_NODE`, `GITHUB_UPLINK`, `RUNTIME_TARGET` from `GUSTO_PROFILE.telemetrySpecs`
- **Modern Web Guidance Compliance:**
  - **LCP & CRP (`performance`):** Hero `<h1>`, narrative lead, and CTA buttons render in initial SSR HTML without waiting for client boot state; boot overlay uses `contain: layout style paint`.
  - **Discrete Entry/Exit (`animate-element-entry-exit`):** Use `@starting-style` and a separate `transition-behavior: allow-discrete` rule (never inside the `transition` shorthand), paired with a `canTransitionDisplay()` runtime probe and `[data-closing]` fallback for browsers (like Firefox) that parse `allow-discrete` without transitioning `display`.
  - **Motion & Flash Safety (`motion`):** Keep transitions on compositor properties (`opacity`, `translate`, `scale`), never flash > 3 times per second (WCAG 2.3.1), and respect `prefers-reduced-motion: reduce` by bypassing spatial movement and completing assembly gently.
  - **Accessible Overlay & Progress (`accessibility`):** Use native `<progress>` (paired with `<label>`) instead of noisy `aria-live` log spam for interstitial loading states; focus `[SKIP INTRO ->]` when the overlay opens and move focus to `<h1 id="main-content" tabindex="-1">` when skipped.

## Review Focus

1. **SSR / `sessionStorage` SecurityError or Hydration Mismatch:** Accessing `window.sessionStorage` during SSR or inside sandboxed iframes where storage is blocked throws `ReferenceError` or `SecurityError`. All storage helpers in `src/lib/bootSequence.ts` must wrap reads/writes in `try / catch` and run only inside client effects/handlers.
2. **Negative, `NaN`, or Over-Budget Elapsed Timestamps:** `computeBootSequenceState(elapsedMs)` and `computeAssemblyVisualState(progress01)` must clamp non-finite, negative, or `> BOOT_TOTAL_DURATION_MS` inputs cleanly into `[0, 1]` and mark `isComplete: true` at `>= 1`.
3. **Firefox Discrete `display: none` Exit Cut-off:** Because Firefox parses `transition-behavior: allow-discrete` without actually delaying `display: none`, `canTransitionDisplay()` must probe computed style behavior and `TerminalBootOverlay` must apply `data-closing` before `[hidden]` when discrete display transitions are unsupported.
4. **Stuck Keyboard Focus on Overlay Dismissal:** When a keyboard user activates `[SKIP INTRO ->]` or presses `Escape`, focus must not vanish onto an unmounted/hidden button; it must deterministically transfer to `#main-content`.
5. **Reduced Motion Hang (`prefers-reduced-motion: reduce`):** When reduced motion is active, the intro sequence must not trap the user in a multi-second animation loop or wait for `transitionend` events that never fire (`element.getAnimations()` empty check + immediate completion fallback).

---

### Task 1: Terminal Boot Sequence State Machine & Session Persistence (`src/lib/bootSequence.ts`)

**Files:**
- Create: `src/lib/bootSequence.ts`
- Test: `src/lib/__tests__/bootSequence.test.ts`

**Interfaces:**
- Consumes: `AccentColor` from `src/data/portfolioData.ts`
- Produces:
  - `export const BOOT_SESSION_STORAGE_KEY = 'gusto_os_booted_v26'`
  - `export const BOOT_TOTAL_DURATION_MS = 2200`
  - `export const BOOT_EXIT_TRANSITION_MS = 250`
  - `export type BootPhase = 'WIREFRAME_INIT' | 'SHADER_COMPILE' | 'ORBITAL_LOCK' | 'READY'`
  - `export interface BootLogStep { id: string; threshold01: number; timestampLabel: string; subsystem: string; message: string; status: 'INIT' | 'OK' | 'SYNC' | 'READY'; accent: AccentColor; }`
  - `export const GUSTO_BOOT_LOGS: BootLogStep[]`
  - `export interface BootSequenceState { elapsedMs: number; progress01: number; progressPercent: number; phase: BootPhase; statusHeadline: string; visibleLogs: BootLogStep[]; isComplete: boolean; }`
  - `export function computeBootSequenceState(elapsedMs: number, totalDurationMs?: number): BootSequenceState`
  - `export function hasSessionBooted(storage?: Pick<Storage, 'getItem'> | null): boolean`
  - `export function markSessionBooted(storage?: Pick<Storage, 'setItem'> | null): void`
  - `export function clearSessionBooted(storage?: Pick<Storage, 'removeItem'> | null): void`

- [ ] **Step 1: Write the failing unit tests in `src/lib/__tests__/bootSequence.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  BOOT_SESSION_STORAGE_KEY,
  BOOT_TOTAL_DURATION_MS,
  BOOT_EXIT_TRANSITION_MS,
  GUSTO_BOOT_LOGS,
  computeBootSequenceState,
  hasSessionBooted,
  markSessionBooted,
  clearSessionBooted,
} from '../bootSequence';

describe('bootSequence state machine & sessionStorage persistence', () => {
  it('enforces a strict <= 3.0s (3000ms) total intro budget including exit transition', () => {
    expect(BOOT_TOTAL_DURATION_MS + BOOT_EXIT_TRANSITION_MS).toBeLessThanOrEqual(3000);
    expect(BOOT_SESSION_STORAGE_KEY).toBe('gusto_os_booted_v26');
    expect(GUSTO_BOOT_LOGS.length).toBeGreaterThanOrEqual(5);
  });

  it('clamps non-finite, negative, and over-budget timestamps into [0..1] progress', () => {
    const start = computeBootSequenceState(-50, 2200);
    expect(start.progress01).toBe(0);
    expect(start.progressPercent).toBe(0);
    expect(start.phase).toBe('WIREFRAME_INIT');
    expect(start.isComplete).toBe(false);
    expect(start.visibleLogs.length).toBe(1);

    const mid = computeBootSequenceState(1100, 2200);
    expect(mid.progress01).toBeCloseTo(0.5, 2);
    expect(mid.progressPercent).toBe(50);
    expect(mid.phase).toBe('SHADER_COMPILE');
    expect(mid.isComplete).toBe(false);

    const done = computeBootSequenceState(5000, 2200);
    expect(done.progress01).toBe(1);
    expect(done.progressPercent).toBe(100);
    expect(done.phase).toBe('READY');
    expect(done.isComplete).toBe(true);
    expect(done.visibleLogs).toHaveLength(GUSTO_BOOT_LOGS.length);

    const nanState = computeBootSequenceState(Number.NaN, 2200);
    expect(nanState.progress01).toBe(0);
  });

  it('reads, marks, and clears session boot state safely without throwing when storage fails', () => {
    const memory = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v);
      },
      removeItem: (k: string) => {
        memory.delete(k);
      },
    };

    expect(hasSessionBooted(mockStorage)).toBe(false);
    markSessionBooted(mockStorage);
    expect(hasSessionBooted(mockStorage)).toBe(true);
    clearSessionBooted(mockStorage);
    expect(hasSessionBooted(mockStorage)).toBe(false);

    const throwingStorage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(hasSessionBooted(throwingStorage)).toBe(false);
    expect(() => markSessionBooted(throwingStorage)).not.toThrow();
    expect(() => clearSessionBooted(throwingStorage)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/lib/__tests__/bootSequence.test.ts`
Expected: FAIL with cannot find module `../bootSequence`

- [ ] **Step 3: Implement `src/lib/bootSequence.ts`**

Implement `GUSTO_BOOT_LOGS` (covering `KERNEL_BOOT // GUSTO_OS v2.6`, `WEBGL_STAGE // PURE_THREEJS_GLSL`, `NODE_01 // GISTDA_THEOS_CALVAL`, `NODE_02 // KBTG_RISK_ENGINE`, `NODE_03 // ROPA2077_ASSIGNIER_AI`, and `SYSTEM_LOCK // 60FPS_NEO_BRUTAL_READY`), `computeBootSequenceState(elapsedMs, totalDurationMs)`, and try/catch-guarded `hasSessionBooted`, `markSessionBooted`, and `clearSessionBooted`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/lib/__tests__/bootSequence.test.ts`
Expected: PASS (`3 passed`)

- [ ] **Step 5: Commit**

```bash
git add src/lib/bootSequence.ts src/lib/__tests__/bootSequence.test.ts
git commit -m "feat(phase-3): add terminal boot sequence state machine and session persistence"
```

---

### Task 2: 3D Wireframe-to-Solid Assembly Choreography (`src/engine/proceduralShaders.ts` & `src/engine/GustoWorldEngine.ts`)

**Files:**
- Modify: `src/engine/proceduralShaders.ts`
- Modify: `src/engine/GustoWorldEngine.ts`
- Test: `src/engine/__tests__/GustoWorldEngine.test.ts`

**Interfaces:**
- Consumes: `CORE_VERTEX_SHADER`, `CORE_FRAGMENT_SHADER` from `src/engine/proceduralShaders.ts`
- Produces:
  - `export interface AssemblyVisualState { coreScale: number; wireframeExpansion: number; ringAssemblyScale: number; satelliteOrbitFactor: number; solidFillMix: number; }` in `src/engine/GustoWorldEngine.ts`
  - `export function computeAssemblyVisualState(assemblyProgress01: number): AssemblyVisualState` in `src/engine/GustoWorldEngine.ts`
  - Updated `EngineTelemetrySnapshot` adding `assemblyProgress: number`
  - Updated `CORE_FRAGMENT_SHADER` declaring `uniform float uAssemblyProgress;` so `uAssemblyProgress = 0` renders raw architectural wireframe scanlines and `uAssemblyProgress = 1` resolves to full solid Neo-Brutalist cel-shaded surfaces.

- [ ] **Step 1: Add failing unit tests for `computeAssemblyVisualState` and `uAssemblyProgress` in `src/engine/__tests__/GustoWorldEngine.test.ts` and `src/engine/__tests__/proceduralShaders.test.ts`**

In `src/engine/__tests__/GustoWorldEngine.test.ts`, add:
```typescript
import {
  RapidClickDetector,
  computeScrollChoreographyState,
  computeAssemblyVisualState,
} from '../GustoWorldEngine';

  it('interpolates 3D wireframe-to-solid assembly state across [0..1]', () => {
    const rawWireframe = computeAssemblyVisualState(0);
    const halfAssembled = computeAssemblyVisualState(0.5);
    const fullyAssembled = computeAssemblyVisualState(1);

    expect(rawWireframe.solidFillMix).toBe(0);
    expect(rawWireframe.wireframeExpansion).toBeGreaterThan(fullyAssembled.wireframeExpansion);
    expect(halfAssembled.coreScale).toBeGreaterThan(rawWireframe.coreScale);
    expect(fullyAssembled.coreScale).toBeCloseTo(1, 4);
    expect(fullyAssembled.wireframeExpansion).toBeCloseTo(1, 4);
    expect(fullyAssembled.satelliteOrbitFactor).toBeCloseTo(1, 4);
    expect(fullyAssembled.solidFillMix).toBeCloseTo(1, 4);
  });
```
And in `src/engine/__tests__/proceduralShaders.test.ts`, assert `expect(CORE_FRAGMENT_SHADER).toContain('uniform float uAssemblyProgress;');`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx.cmd vitest run src/engine/__tests__/GustoWorldEngine.test.ts src/engine/__tests__/proceduralShaders.test.ts`
Expected: FAIL (`computeAssemblyVisualState is not a function` / `uAssemblyProgress` missing in `CORE_FRAGMENT_SHADER`)

- [ ] **Step 3: Implement `uAssemblyProgress` fragment shading in `src/engine/proceduralShaders.ts` and `computeAssemblyVisualState` in `src/engine/GustoWorldEngine.ts`**

1. In `src/engine/proceduralShaders.ts`, add `uniform float uAssemblyProgress;` to `CORE_FRAGMENT_SHADER` and blend a crisp wireframe grid/scanline pattern (`step(0.62, fract(vWorldPosition.y * 9.0 + vWorldPosition.x * 9.0))`) into `surfaceColor` when `uAssemblyProgress < 1.0`.
2. In `src/engine/GustoWorldEngine.ts`, implement `computeAssemblyVisualState(assemblyProgress01: number): AssemblyVisualState` using smoothstep interpolation (`coreScale: 0.38 -> 1.0`, `wireframeExpansion: 1.55 -> 1.0`, `ringAssemblyScale: 0.55 -> 1.0`, `satelliteOrbitFactor: 1.45 -> 1.0`, `solidFillMix: 0 -> 1`), wire it into `renderFrame()`, and include `assemblyProgress` in `EngineTelemetrySnapshot`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx.cmd vitest run src/engine/__tests__/GustoWorldEngine.test.ts src/engine/__tests__/proceduralShaders.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/proceduralShaders.ts src/engine/GustoWorldEngine.ts src/engine/__tests__/GustoWorldEngine.test.ts src/engine/__tests__/proceduralShaders.test.ts
git commit -m "feat(phase-3): synchronize 3D wireframe-to-solid assembly choreography"
```

---

### Task 3: Accessible `<= 3.0s` Terminal Boot Overlay & Discrete Entry/Exit CSS (`src/components/hero/TerminalBootOverlay.tsx` & `src/app/globals.css`)

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/hero/TerminalBootOverlay.tsx`
- Test: `src/components/hero/__tests__/TerminalBootOverlay.test.ts`

**Interfaces:**
- Consumes: `BootSequenceState` from `src/lib/bootSequence.ts`, `NeoBadge`, `NeoButton`, `NeoCard` from `src/components/ui/NeoBrutalPrimitives.tsx`
- Produces:
  - `export function canTransitionDisplay(): boolean`
  - `export interface TerminalBootOverlayProps { state: BootSequenceState; isVisible: boolean; isClosing: boolean; onSkip: () => void; }`
  - `export function TerminalBootOverlay(props: TerminalBootOverlayProps): JSX.Element`

- [ ] **Step 1: Write the failing unit tests in `src/components/hero/__tests__/TerminalBootOverlay.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  canTransitionDisplay,
  formatBootTelemetryLine,
} from '../TerminalBootOverlay';
import { computeBootSequenceState } from '@/lib/bootSequence';

describe('TerminalBootOverlay helpers & discrete display probe', () => {
  it('returns false safely in non-DOM / SSR environments for canTransitionDisplay()', () => {
    expect(canTransitionDisplay()).toBe(false);
  });

  it('formats deterministic terminal boot telemetry summary for current assembly phase', () => {
    const midState = computeBootSequenceState(1100, 2200);
    const line = formatBootTelemetryLine(midState);
    expect(line).toContain('50%');
    expect(line).toContain('SHADER_COMPILE');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/components/hero/__tests__/TerminalBootOverlay.test.ts`
Expected: FAIL with cannot find module `../TerminalBootOverlay`

- [ ] **Step 3: Add `.neo-boot-overlay` discrete entry/exit rules to `src/app/globals.css` and implement `src/components/hero/TerminalBootOverlay.tsx`**

1. In `src/app/globals.css`, add `.neo-boot-overlay` inside `@layer components`:
   - Uses `contain: layout style paint`, `opacity: 1`, `translate: 0`, `transition: display, opacity 240ms ease-out, translate 240ms ease-out;` followed by a separate `transition-behavior: allow-discrete;` declaration.
   - Includes `@starting-style { .neo-boot-overlay { opacity: 0; translate: 0 12px; } }`.
   - Includes `.neo-boot-overlay:where([hidden], [data-closing]) { opacity: 0; translate: 0 -12px; pointer-events: none; }` and `.neo-boot-overlay[hidden] { display: none; }`.
   - Includes `@media (prefers-reduced-motion: reduce)` setting `translate: none` and `transition-duration: 80ms`.
2. In `src/components/hero/TerminalBootOverlay.tsx`:
   - Implement `canTransitionDisplay()` probing whether a temporary element's computed `display` stays `'block'` during `transition: display 1s allow-discrete !important` (guarded for SSR).
   - Render the `GUSTO_OS v2.6 // KERNEL BOOT SEQUENCE` Neo-Brutalist overlay dialog (`role="dialog"`, `aria-modal="false"`, `aria-labelledby="gusto-boot-title"`) with:
     - Corner `[SKIP INTRO ->]` `<NeoButton>` that receives initial focus on open and triggers `onSkip` on click or `Escape` keydown.
     - Native `<label htmlFor="gusto-boot-progress">` + `<progress id="gusto-boot-progress" max={100} value={state.progressPercent}>` + visual Neo-Brutalist progress bar showing wireframe-to-shaded assembly percentage (`0% -> 100%`).
     - Live terminal log feed rendering `state.visibleLogs` with timestamps, subsystem codes, and status badges (`INIT`, `OK`, `SYNC`, `READY`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/components/hero/__tests__/TerminalBootOverlay.test.ts`
Expected: PASS (`2 passed`)

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/hero/TerminalBootOverlay.tsx src/components/hero/__tests__/TerminalBootOverlay.test.ts
git commit -m "feat(phase-3): build accessible <=3s terminal boot overlay with discrete CSS transitions"
```

---

### Task 4: Hero Section, Synchronized 3D Stage Assembly & Replay Control (`src/components/hero/HeroSection.tsx`, `src/components/three/GustoCanvasStage.tsx`, & `src/app/page.tsx`)

**Files:**
- Modify: `src/components/three/GustoCanvasStage.tsx`
- Create: `src/components/hero/HeroSection.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `bootSequence.ts`, `TerminalBootOverlay.tsx`, `GustoCanvasStage.tsx`, `GUSTO_PROFILE`, `PROJECTS_DATA` from `src/data/portfolioData.ts`
- Produces:
  - `export interface GustoCanvasStageProps { assemblyProgress?: number; isBooting?: boolean; onReplayBoot?: () => void; }` in `src/components/three/GustoCanvasStage.tsx`
  - `export function HeroSection(): JSX.Element` in `src/components/hero/HeroSection.tsx`

- [ ] **Step 1: Update `src/components/three/GustoCanvasStage.tsx` to accept `assemblyProgress`, `isBooting`, and `onReplayBoot`**

Synchronize `engineRef.current?.setAssemblyProgress(assemblyProgress)` whenever `assemblyProgress` changes, fire `engineRef.current?.triggerShockwave('#FFE600')` when `assemblyProgress` transitions from `< 1` to `1`, and display an assembly status badge (`ASSEMBLY: ${Math.round(assemblyProgress * 100)}%`) + optional `[REPLAY BOOT]` button in the stage header bar.

- [ ] **Step 2: Implement `src/components/hero/HeroSection.tsx` and wire into `src/app/page.tsx`**

In `src/components/hero/HeroSection.tsx`:
- Render the Hero grid immediately in SSR HTML so LCP (`<h1 id="main-content" tabindex="-1">Hi, I'm Gusto — Hattakorn Pongsawai</h1>`) paints on frame 0 without waiting for client JS:
  - Status badges (`GUSTO_OS v2.6 // ONLINE`, `@MoLerSTH`, `TU_SE (TEP/TEPE) YR.3`, `GISTDA • ASR LAB • KBTG 2026`)
  - Role headline (`GUSTO_PROFILE.roleHeadline`) & story lead (`GUSTO_PROFILE.storyLead`)
  - Primary CTA bar: `VIEW 6 PROJECTS VAULT` (`#projects`), `GITHUB // MoLerSTH`, `DIRECT UPLINK` (`mailto:hattakorn49@gmail.com`), and `[REPLAY BOOT_SEQ]` button
  - 4-column Architectural Telemetry Strip rendering `GUSTO_PROFILE.telemetrySpecs` (`SYSTEM_ROLE`, `ACADEMIC_NODE`, `GITHUB_UPLINK`, `RUNTIME_TARGET`)
- Manage the `<= 3.0s` boot lifecycle in a `useEffect`:
  - Check `hasSessionBooted(window.sessionStorage)` and `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
  - If already booted in this session or reduced motion is preferred, keep `assemblyProgress = 1` and `isBootOpen = false` immediately.
  - Otherwise, start the `2200ms` `requestAnimationFrame` boot loop (`0 -> BOOT_TOTAL_DURATION_MS`), updating `elapsedMs` and passing `state.progress01` to `GustoCanvasStage` (`setAssemblyProgress`) and `TerminalBootOverlay`.
  - On completion (`2200ms`) or instant `[SKIP INTRO ->]` click / `Escape` press:
    - Call `markSessionBooted(window.sessionStorage)`, set `assemblyProgress = 1`, run the `250ms` discrete exit transition (`isClosing = true` -> `isBootOpen = false`), and if user-skipped, move focus to `document.getElementById('main-content')?.focus()`.
- Update `src/app/page.tsx` to render `<HeroSection />` at the top of `<main>`.

- [ ] **Step 3: Run full verification gate (`npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`)**

Run:
```powershell
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```
Expected: All Vitest test suites pass (`9/9` test files), `tsc --noEmit` exits `0`, `eslint .` exits `0` with 0 warnings, and `next build` succeeds with exit code `0`.

- [ ] **Step 4: Commit**

```bash
git add src/components/three/GustoCanvasStage.tsx src/components/hero/HeroSection.tsx src/app/page.tsx
git commit -m "feat(phase-3): integrate HeroSection with <=3s terminal boot sequence and 3D assembly sync"
```
