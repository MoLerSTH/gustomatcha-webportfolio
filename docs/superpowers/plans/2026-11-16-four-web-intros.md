# Four Web Intro Variations (`GUSTO_OS v2.6`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 distinct high-impact web intro variations in 4 separate Git branches (`feat/intro-1-orbital-drop`, `feat/intro-2-blueprint-printer`, `feat/intro-3-kinetic-slam`, `feat/intro-4-pixel-shatter`) forked from `feat/about-portrait-sticker` so the user can switch branches to compare and select their favorite.

**Architecture:** Commit this shared spec and plan on `feat/about-portrait-sticker` as the common base commit (`INTRO_BASE`). Each task then checks out a fresh branch from `INTRO_BASE`, adds a deterministic pure state calculator (`computeOrbitalLockState`, `computeBlueprintScannerState`, `computeKineticSlamFrame`, or `computePixelMosaicState`) in `src/components/hero/TerminalBootOverlay.tsx`, updates the overlay JSX and `src/app/globals.css` with GPU-composited animations and `@media (prefers-reduced-motion: reduce)` guards, and verifies with Vitest, TypeScript, ESLint, and `next build`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 6, Tailwind CSS v4 (`src/app/globals.css`), Vitest 5.

**Spec:** [docs/superpowers/specs/2026-11-16-four-web-intros-design.md](file:///c:/Users/User/Documents/my-website/docs/superpowers/specs/2026-11-16-four-web-intros-design.md)

## Global Constraints

- Base branch for all 4 forks: `feat/about-portrait-sticker` (with spec and plan committed)
- Exact branch names:
  1. `feat/intro-1-orbital-drop`
  2. `feat/intro-2-blueprint-printer`
  3. `feat/intro-3-kinetic-slam`
  4. `feat/intro-4-pixel-shatter`
- Existing exports in `src/components/hero/TerminalBootOverlay.tsx` (`canTransitionDisplay`, `formatBootTelemetryLine`, `resolveOverlayAttributes`, `TerminalBootOverlay`) and existing elements (`role="dialog"`, `id="gusto-boot-title"`, `<progress id="gusto-boot-progress" />`, `[SKIP INTRO]`) must remain intact on all 4 branches
- All visible intro text must be strictly English (no Thai characters `[\u0E00-\u0E7F]`)
- All transitions/flashes must remain `< 3 Hz` (WCAG 2.3.1) and collapse cleanly under `@media (prefers-reduced-motion: reduce)`

## Review Focus

1. **Branch isolation from shared `INTRO_BASE`:** Each branch must fork directly from `feat/about-portrait-sticker` (`git checkout -B <branch> feat/about-portrait-sticker`), containing only its own intro implementation on top of the shared base.
2. **Out-of-bounds & non-finite `progress01` clamping (`-0.5`, `1.5`, `NaN`):** Every branch's pure state helper must clamp `progress01` into `[0, 1]` so CSS custom properties and array lookups never produce `NaN` or `undefined`.
3. **SSR markup & accessibility contract preservation:** Rendering `<TerminalBootOverlay />` via `renderToStaticMarkup` on each branch must output `id="gusto-boot-title"`, `id="gusto-boot-progress"`, `SKIP INTRO`, and branch-specific visual markers with zero Thai characters.
4. **WCAG 2.3.1 flash budget & reduced-motion guards:** Branch 3 (`Kinetic Slam`) must have exactly 4 frames across `2200ms` (`< 2` transitions/sec), and every branch's new CSS classes must be neutralized inside `@media (prefers-reduced-motion: reduce)`.
5. **Full suite & build verification per branch:** Every branch must pass `npx.cmd vitest run`, `npm.cmd run typecheck`, and `npm.cmd run lint`.

---

### Task 1: Branch 1 — `feat/intro-1-orbital-drop` (Orbital Drop // Satellite Lock-On)

**Files:**
- Modify: `src/components/hero/TerminalBootOverlay.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/hero/__tests__/TerminalBootOverlay.test.ts`

**Interfaces:**
- Consumes: `BootSequenceState` from `@/lib/bootSequence`
- Produces in `src/components/hero/TerminalBootOverlay.tsx`:
  - `export interface OrbitalLockState { clampedProgress: number; lockStatus: 'SCANNING' | 'CONVERGING' | 'TARGET_LOCKED'; altitudeKm: string; crosshairOffsetPct: number; blastDoorOpen01: number; coordinatesLabel: string; }`
  - `export function computeOrbitalLockState(progress01: number): OrbitalLockState`

- [ ] **Step 1: Create branch `feat/intro-1-orbital-drop` from `feat/about-portrait-sticker` and write failing tests in `src/components/hero/__tests__/TerminalBootOverlay.test.ts`**

Run: `git checkout -B feat/intro-1-orbital-drop feat/about-portrait-sticker`

Add tests to `src/components/hero/__tests__/TerminalBootOverlay.test.ts`:
```ts
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TerminalBootOverlay,
  computeOrbitalLockState,
} from '../TerminalBootOverlay';

it('computes clamped Orbital Drop lock state, altitude, crosshairs, and blast doors (Review Focus #2)', () => {
  const start = computeOrbitalLockState(-0.4);
  expect(start.clampedProgress).toBe(0);
  expect(start.lockStatus).toBe('SCANNING');
  expect(start.blastDoorOpen01).toBe(0);
  expect(start.coordinatesLabel).toContain('13.7563° N');

  const mid = computeOrbitalLockState(0.5);
  expect(mid.lockStatus).toBe('CONVERGING');
  expect(mid.crosshairOffsetPct).toBeGreaterThan(0);

  const locked = computeOrbitalLockState(1.2);
  expect(locked.clampedProgress).toBe(1);
  expect(locked.lockStatus).toBe('TARGET_LOCKED');
  expect(locked.blastDoorOpen01).toBe(1);
});

it('renders Orbital Drop blast doors, radar crosshairs, and accessible skip/progress controls in English', () => {
  const state = computeBootSequenceState(1800, 2200);
  const html = renderToStaticMarkup(
    createElement(TerminalBootOverlay, {
      state,
      isVisible: true,
      isClosing: false,
      onSkip: () => {},
    })
  );
  expect(html).toContain('ORBITAL_DROP // THEOS_SAT_LOCK');
  expect(html).toContain('SECTOR_01');
  expect(html).toContain('SKIP INTRO');
  expect(html).toContain('id="gusto-boot-progress"');
  expect(html).not.toMatch(/[\u0E00-\u0E7F]/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/components/hero/__tests__/TerminalBootOverlay.test.ts`
Expected: FAIL with `computeOrbitalLockState is not a function`

- [ ] **Step 3: Implement Orbital Drop overlay in `src/components/hero/TerminalBootOverlay.tsx` and blast-door/crosshair CSS in `src/app/globals.css`**

Implement `computeOrbitalLockState(progress01)`:
- Clamp `progress01` to `[0, 1]` (default `0` if `!Number.isFinite(progress01)`).
- `lockStatus`: `< 0.35` -> `'SCANNING'`, `< 0.78` -> `'CONVERGING'`, `>= 0.78` -> `'TARGET_LOCKED'`.
- `altitudeKm`: `(620.4 - clamped * 480.4).toFixed(1)` (`620.4` down to `140.0`).
- `crosshairOffsetPct`: `Number(((1 - Math.min(1, clamped / 0.78)) * 38).toFixed(2))`.
- `blastDoorOpen01`: `clamped < 0.78 ? 0 : Number(((clamped - 0.78) / 0.22).toFixed(3))`.
- `coordinatesLabel`: `'LAT 13.7563° N // LON 100.5018° E // THEOS-2 TELEMETRY'`.
Render 4 `.neo-orbital-door` panels (`SECTOR_01`..`SECTOR_04`), horizontal/vertical `.neo-orbital-crosshair` laser lines, and the central tactical target reticle HUD in `TerminalBootOverlay.tsx`. Add `.neo-orbital-door` and `.neo-orbital-crosshair` rules (plus `@media (prefers-reduced-motion: reduce)` transform disables) to `src/app/globals.css`.

- [ ] **Step 4: Run verification suite**

Run: `npx.cmd vitest run; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint`
Expected: 24 test files PASS, zero TypeScript or ESLint errors.

- [ ] **Step 5: Commit on `feat/intro-1-orbital-drop`**

```powershell
git add src/components/hero/TerminalBootOverlay.tsx src/components/hero/__tests__/TerminalBootOverlay.test.ts src/app/globals.css; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m "feat(intro): implement Idea 1 Orbital Drop satellite lock-on intro"
```

---

### Task 2: Branch 2 — `feat/intro-2-blueprint-printer` (Architectural Blueprint Printer)

**Files:**
- Modify: `src/components/hero/TerminalBootOverlay.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/hero/__tests__/TerminalBootOverlay.test.ts`

**Interfaces:**
- Consumes: `BootSequenceState` from `@/lib/bootSequence`
- Produces in `src/components/hero/TerminalBootOverlay.tsx`:
  - `export interface BlueprintStampSpec { id: string; label: string; threshold01: number; isStamped: boolean; }`
  - `export interface BlueprintScannerState { clampedProgress: number; scanLinePercent: number; rulerMm: number; stamps: BlueprintStampSpec[]; }`
  - `export function computeBlueprintScannerState(progress01: number): BlueprintScannerState`

- [ ] **Step 1: Create branch `feat/intro-2-blueprint-printer` from `feat/about-portrait-sticker` and write failing tests in `src/components/hero/__tests__/TerminalBootOverlay.test.ts`**

Run: `git checkout -B feat/intro-2-blueprint-printer feat/about-portrait-sticker`

Add tests to `src/components/hero/__tests__/TerminalBootOverlay.test.ts`:
```ts
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TerminalBootOverlay,
  computeBlueprintScannerState,
} from '../TerminalBootOverlay';

it('computes clamped CAD Blueprint laser scanner position, ruler mm, and architectural stamps (Review Focus #2)', () => {
  const start = computeBlueprintScannerState(Number.NaN);
  expect(start.clampedProgress).toBe(0);
  expect(start.scanLinePercent).toBe(0);
  expect(start.stamps.every((s) => !s.isStamped)).toBe(true);

  const mid = computeBlueprintScannerState(0.55);
  expect(mid.scanLinePercent).toBe(55);
  expect(mid.rulerMm).toBe(Math.round(0.55 * 1440));
  expect(mid.stamps.filter((s) => s.isStamped).length).toBe(2);

  const done = computeBlueprintScannerState(1.4);
  expect(done.scanLinePercent).toBe(100);
  expect(done.stamps.every((s) => s.isStamped)).toBe(true);
});

it('renders CAD Blueprint Laser Scanner beam, schematic stamps, and accessible controls in English', () => {
  const state = computeBootSequenceState(1200, 2200);
  const html = renderToStaticMarkup(
    createElement(TerminalBootOverlay, {
      state,
      isVisible: true,
      isClosing: false,
      onSkip: () => {},
    })
  );
  expect(html).toContain('CAD_BLUEPRINT_LASER_PRINTER');
  expect(html).toContain('STAMP_01: TYPOGRAPHY_LCP');
  expect(html).toContain('SKIP INTRO');
  expect(html).toContain('id="gusto-boot-progress"');
  expect(html).not.toMatch(/[\u0E00-\u0E7F]/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/components/hero/__tests__/TerminalBootOverlay.test.ts`
Expected: FAIL with `computeBlueprintScannerState is not a function`

- [ ] **Step 3: Implement CAD Blueprint Laser Printer overlay in `src/components/hero/TerminalBootOverlay.tsx` and scanner CSS in `src/app/globals.css`**

Implement `computeBlueprintScannerState(progress01)` with 4 stamps (`STAMP_01: TYPOGRAPHY_LCP` @ `0.2`, `STAMP_02: 3D_GLSL_CORE` @ `0.45`, `STAMP_03: TELEMETRY_GRID` @ `0.7`, `STAMP_04: KONAMI_DECK` @ `0.9`) and render the full-width sweeping `.neo-blueprint-laser-bar` and unprinted CAD schematic lower curtain (`.neo-blueprint-unprinted-mask` scaled by `1 - clampedProgress` from bottom) so the live Hero section is progressively revealed from top to bottom as the laser beam travels down. Add `.neo-blueprint-laser-bar` and `.neo-blueprint-unprinted-mask` (with `@media (prefers-reduced-motion: reduce)` guards) to `src/app/globals.css`.

- [ ] **Step 4: Run verification suite**

Run: `npx.cmd vitest run; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint`
Expected: 24 test files PASS, zero TypeScript or ESLint errors.

- [ ] **Step 5: Commit on `feat/intro-2-blueprint-printer`**

```powershell
git add src/components/hero/TerminalBootOverlay.tsx src/components/hero/__tests__/TerminalBootOverlay.test.ts src/app/globals.css; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m "feat(intro): implement Idea 2 Architectural Blueprint Laser Printer intro"
```

---

### Task 3: Branch 3 — `feat/intro-3-kinetic-slam` (Kinetic Brutalist Slam // Overclock Burst)

**Files:**
- Modify: `src/components/hero/TerminalBootOverlay.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/hero/__tests__/TerminalBootOverlay.test.ts`

**Interfaces:**
- Consumes: `BootSequenceState` from `@/lib/bootSequence`
- Produces in `src/components/hero/TerminalBootOverlay.tsx`:
  - `export interface KineticBeatSpec { index: 0 | 1 | 2 | 3; word: string; subtag: string; bgHex: string; inkHex: string; accentBadge: string; }`
  - `export interface KineticSlamState { clampedProgress: number; activeBeat: KineticBeatSpec; shockwaveScale: number; curtainSplit01: number; }`
  - `export const KINETIC_SLAM_BEATS: readonly KineticBeatSpec[]`
  - `export function computeKineticSlamFrame(progress01: number): KineticSlamState`

- [ ] **Step 1: Create branch `feat/intro-3-kinetic-slam` from `feat/about-portrait-sticker` and write failing tests in `src/components/hero/__tests__/TerminalBootOverlay.test.ts`**

Run: `git checkout -B feat/intro-3-kinetic-slam feat/about-portrait-sticker`

Add tests to `src/components/hero/__tests__/TerminalBootOverlay.test.ts`:
```ts
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  KINETIC_SLAM_BEATS,
  TerminalBootOverlay,
  computeKineticSlamFrame,
} from '../TerminalBootOverlay';

it('cycles through exactly 4 WCAG-safe kinetic typography beats and triggers end shockwave (Review Focus #2 & #4)', () => {
  expect(KINETIC_SLAM_BEATS).toHaveLength(4);
  expect(computeKineticSlamFrame(-1).activeBeat.word).toBe('BUILD.');
  expect(computeKineticSlamFrame(0.35).activeBeat.word).toBe('GEO_AI.');
  expect(computeKineticSlamFrame(0.65).activeBeat.word).toBe('DEFEND.');

  const finale = computeKineticSlamFrame(0.92);
  expect(finale.activeBeat.word).toBe('GUSTO_OS');
  expect(finale.shockwaveScale).toBeGreaterThan(1);
  expect(finale.curtainSplit01).toBeGreaterThan(0);
});

it('renders full-viewport Kinetic Brutalist Slam poster and shockwave ring in English', () => {
  const state = computeBootSequenceState(500, 2200);
  const html = renderToStaticMarkup(
    createElement(TerminalBootOverlay, {
      state,
      isVisible: true,
      isClosing: false,
      onSkip: () => {},
    })
  );
  expect(html).toContain('KINETIC_OVERCLOCK_SLAM');
  expect(html).toContain('BUILD.');
  expect(html).toContain('SKIP INTRO');
  expect(html).toContain('id="gusto-boot-progress"');
  expect(html).not.toMatch(/[\u0E00-\u0E7F]/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/components/hero/__tests__/TerminalBootOverlay.test.ts`
Expected: FAIL with `computeKineticSlamFrame is not a function`

- [ ] **Step 3: Implement Kinetic Brutalist Slam overlay in `src/components/hero/TerminalBootOverlay.tsx` and shockwave/curtain CSS in `src/app/globals.css`**

Implement `KINETIC_SLAM_BEATS` (`BUILD.` `#FFE600`, `GEO_AI.` `#00F5D4`, `DEFEND.` `#FF5D8F`, `GUSTO_OS` `#050B14`) and `computeKineticSlamFrame(progress01)`, rendering the full-screen brutalist poster split curtains (`.neo-kinetic-curtain`) and expanding `.neo-kinetic-shockwave` ring with `@media (prefers-reduced-motion: reduce)` guards.

- [ ] **Step 4: Run verification suite**

Run: `npx.cmd vitest run; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint`
Expected: 24 test files PASS, zero TypeScript or ESLint errors.

- [ ] **Step 5: Commit on `feat/intro-3-kinetic-slam`**

```powershell
git add src/components/hero/TerminalBootOverlay.tsx src/components/hero/__tests__/TerminalBootOverlay.test.ts src/app/globals.css; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m "feat(intro): implement Idea 3 Kinetic Brutalist Slam overclock burst intro"
```

---

### Task 4: Branch 4 — `feat/intro-4-pixel-shatter` (System Shatter // Pixel Mosaic Collapse)

**Files:**
- Modify: `src/components/hero/TerminalBootOverlay.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/hero/__tests__/TerminalBootOverlay.test.ts`

**Interfaces:**
- Consumes: `BootSequenceState` from `@/lib/bootSequence`
- Produces in `src/components/hero/TerminalBootOverlay.tsx`:
  - `export interface MosaicTileState { index: number; row: number; col: number; threshold01: number; isShattered: boolean; }`
  - `export interface PixelMosaicState { clampedProgress: number; hexAddress: string; cartridgeStatus: 'INSERTED' | 'READING_ROM' | 'SHATTER_DISSOLVE'; tiles: MosaicTileState[]; }`
  - `export const MOSAIC_GRID_COLS = 6`
  - `export const MOSAIC_GRID_ROWS = 4`
  - `export function computePixelMosaicState(progress01: number): PixelMosaicState`

- [ ] **Step 1: Create branch `feat/intro-4-pixel-shatter` from `feat/about-portrait-sticker` and write failing tests in `src/components/hero/__tests__/TerminalBootOverlay.test.ts`**

Run: `git checkout -B feat/intro-4-pixel-shatter feat/about-portrait-sticker`

Add tests to `src/components/hero/__tests__/TerminalBootOverlay.test.ts`:
```ts
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  MOSAIC_GRID_COLS,
  MOSAIC_GRID_ROWS,
  TerminalBootOverlay,
  computePixelMosaicState,
} from '../TerminalBootOverlay';

it('computes 24-tile (6x4) Pixel Mosaic shatter thresholds and ROM hex address (Review Focus #2)', () => {
  const start = computePixelMosaicState(-0.2);
  expect(start.tiles).toHaveLength(MOSAIC_GRID_COLS * MOSAIC_GRID_ROWS);
  expect(start.cartridgeStatus).toBe('INSERTED');
  expect(start.hexAddress).toBe('0x0000');
  expect(start.tiles.every((t) => !t.isShattered)).toBe(true);

  const mid = computePixelMosaicState(0.5);
  expect(mid.cartridgeStatus).toBe('READING_ROM');

  const end = computePixelMosaicState(1);
  expect(end.cartridgeStatus).toBe('SHATTER_DISSOLVE');
  expect(end.hexAddress).toBe('0xFFFF');
  expect(end.tiles.every((t) => t.isShattered)).toBe(true);
});

it('renders Cartridge Master Boot HUD and 24-tile Pixel Mosaic grid in English', () => {
  const state = computeBootSequenceState(1600, 2200);
  const html = renderToStaticMarkup(
    createElement(TerminalBootOverlay, {
      state,
      isVisible: true,
      isClosing: false,
      onSkip: () => {},
    })
  );
  expect(html).toContain('CARTRIDGE_INSERTED // GUSTO_OS v2.6');
  expect(html).toContain('data-mosaic-tile="0"');
  expect(html).toContain('data-mosaic-tile="23"');
  expect(html).toContain('SKIP INTRO');
  expect(html).toContain('id="gusto-boot-progress"');
  expect(html).not.toMatch(/[\u0E00-\u0E7F]/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/components/hero/__tests__/TerminalBootOverlay.test.ts`
Expected: FAIL with `computePixelMosaicState is not a function`

- [ ] **Step 3: Implement Pixel Mosaic Shatter overlay in `src/components/hero/TerminalBootOverlay.tsx` and mosaic grid CSS in `src/app/globals.css`**

Implement `computePixelMosaicState(progress01)` generating 24 deterministic tiles (`row 0..3`, `col 0..5`) with staggered thresholds in `[0.64..0.96]`, `hexAddress` (`0x0000`..`0xFFFF`), and `cartridgeStatus`, and render the `6x4` `.neo-mosaic-grid` + `.neo-mosaic-tile[data-shattered='true']` dissolve backdrop and Cartridge HUD card in `TerminalBootOverlay.tsx` and `src/app/globals.css` (with `@media (prefers-reduced-motion: reduce)` guards).

- [ ] **Step 4: Run full verification suite including production build**

Run: `npx.cmd vitest run; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run build`
Expected: 24 test files PASS, zero TypeScript or ESLint errors, clean production build.

- [ ] **Step 5: Commit on `feat/intro-4-pixel-shatter`**

```powershell
git add src/components/hero/TerminalBootOverlay.tsx src/components/hero/__tests__/TerminalBootOverlay.test.ts src/app/globals.css; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m "feat(intro): implement Idea 4 System Shatter pixel mosaic collapse intro"
```
