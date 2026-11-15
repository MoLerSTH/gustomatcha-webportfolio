# Phase 5: `GUSTO_OVERCLOCK // SYNTH-DIMENSION` Easter Egg, Zero-Re-Render Blueprint Inversion & Scrollspy Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 5 of Gusto's (Hattakorn Pongsawai | `MoLerSTH`) 3D interactive Neo-Brutalist portfolio by shipping the playable **`GUSTO_OVERCLOCK // SYNTH-DIMENSION`** 3D Web Audio synthesizer Easter egg, zero-re-render **`[data-theme="overclock"]`** Blueprint/Wireframe token inversion with View Transitions, and native CSS **`scroll-target-group`** scrollspy navigation with `IntersectionObserver` fallback.

**Architecture:**
- **Pure Synth & Roving-Toolbar Controllers (`src/lib/overclockSynthController.ts`):** Pure, deterministic TypeScript helpers for the 6-string/6-pad Cyber-Synth harmonic scale (`E3`, `G3`, `A3`, `B3`, `D4`, `E4` inspired by Gusto's `6-String Web Audio Bass & Multiplayer Electron Piano` project), octave frequency scaling (`SUB -1`, `LEAD 0`, `HIGH +1`), keyboard shortcut mapping (`1`–`6` pad triggers + `Alt+O` Overclock toggle guarded against form inputs), and roving-tabindex navigation math for the `focusgroup="toolbar wrap"` fallback.
- **Poly-Waveform Web Audio Synthesizer (`src/engine/AudioReactiveController.ts` & `src/hooks/useAudioSync.ts`):** Extends `triggerSynthPulse(frequencyHz, durationSec, waveform)` with selectable `OscillatorType` (`sawtooth`, `square`, `triangle`, `sine`) and on-demand `AudioContext` initialization so playing the Synth-Dimension pads works immediately upon user interaction while pulsing the 3D `GustoWorldEngine` core and shockwave shaders.
- **Zero-Re-Render Blueprint Inversion & View Transitions (`src/app/globals.css` & `src/hooks/useBlueprintTheme.ts`):** Maps `--text-primary`, `--text-secondary`, and `--text-muted` across `:root` and `:root[data-theme='overclock']` (guaranteeing >= 4.5:1 WCAG AA contrast in both schemes), pairs `scrollbar-color` with `scrollbar-width: auto` without transitioning `scrollbar-color`, and wraps theme toggles in `document.startViewTransition()` when supported and reduced motion is not requested.
- **Playable `OverclockSynthDeck` HUD (`src/components/three/OverclockSynthDeck.tsx` & `src/components/three/GustoCanvasStage.tsx`):** Animated in/out via `@starting-style`, `transition-behavior: allow-discrete`, and `canTransitionDisplay()` (`[data-closing]` fallback). Features a `role="toolbar" focusgroup="toolbar wrap"` waveform/octave bar with `[aria-pressed="true"]` styling and a 6-pad playable synth matrix that fires color-coded 3D shockwaves into `GustoWorldEngine`.
- **Scrollspy Navigation & Focusable Landmarks (`src/components/ui/NeoNavbar.tsx` & section components):** Uses `scroll-target-group: auto` and `nav a:is(:target-current, .target-current)` paired with `scrollend` / `IntersectionObserver` `aria-current="true"` synchronization and `tabIndex={-1}` on `<section id="...">` targets.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, Pure Three.js (`three`), Web Audio API, Vitest.

**Modern Web Guidance Applied:**
- `dark-mode` & `dark-mode-toggle`: Root `color-scheme` & custom property token inversion on `:root[data-theme='overclock']`, `scrollbar-width: auto` paired with `scrollbar-color`, and zero CSS transitions on `scrollbar-color` to avoid WebKit scrollbar flicker.
- `color`: >= 4.5:1 text contrast and >= 3:1 non-text boundary/state contrast in both Light Neo-Brutalist and Dark Blueprint Overclock palettes, plus non-color active indicators (dot + border + label) and `@media (forced-colors: active)` fallbacks.
- `same-document-transitions`: Progressive enhancement with `document.startViewTransition()` when switching dimensions, and `@media (prefers-reduced-motion: reduce)` disabling `::view-transition-*` animations.
- `animate-element-entry-exit`: `@starting-style` entry, separate `transition-behavior: allow-discrete` declaration, and `[data-closing]` exit fallback gated by `canTransitionDisplay()` for the Overclock Synth Deck.
- `toolbar`: `role="toolbar" focusgroup="toolbar wrap"` with `role="group"`, `role="separator" aria-orientation="vertical"`, `[aria-pressed="true"]` attribute styling, external `role="status"` live region, and roving-tabindex fallback when `!('focusGroup' in HTMLElement.prototype)`.
- `scrollspy`: `scroll-target-group: auto`, `:is(:target-current, .target-current)` selector combining native pseudo-class with `IntersectionObserver` fallback class, `aria-current="true"` synchronization, and `tabIndex={-1}` on target sections.

---

## File Structure

- **Create:**
  - `src/lib/overclockSynthController.ts` — Pure constants and controllers for the 6-pad Synth-Dimension scale (`SYNTH_PAD_SPECS`), waveform/octave math (`computeSynthFrequency`), keyboard shortcut filtering (`resolveSynthShortcutAction`), and toolbar roving-tabindex calculation (`computeToolbarNextFocusIndex`).
  - `src/lib/__tests__/overclockSynthController.test.ts` — Unit tests for frequency math, keyboard event filtering, and horizontal/RTL roving-tabindex wrapping.
  - `src/components/three/OverclockSynthDeck.tsx` — Playable `GUSTO_OVERCLOCK // SYNTH-DIMENSION` HUD panel with `role="toolbar" focusgroup="toolbar wrap"` waveform/octave selector, 6 playable synth pads, discrete entry/exit transition helper, and polite status announcer.
  - `src/components/three/__tests__/OverclockSynthDeck.test.ts` — Unit tests for `OverclockSynthDeck` discrete exit helper and pad/toolbar state helpers.
  - `src/components/ui/__tests__/NeoNavbarScrollspy.test.ts` — Unit tests for pure scrollspy active-section resolution and `aria-current` helper logic.
- **Modify:**
  - `src/engine/AudioReactiveController.ts` — Extend `triggerSynthPulse(frequencyHz, durationSec, waveform)` to accept `OscillatorType` and lazily initialize/resume `AudioContext` when a user plays a synth pad directly.
  - `src/engine/__tests__/AudioReactiveController.test.ts` — Add unit test coverage for custom waveform synth pulses (`square`, `triangle`, `sine`, `sawtooth`).
  - `src/hooks/useAudioSync.ts` — Forward optional `waveform?: OscillatorType` in `triggerSynthNote(freqHz, durationSec, waveform)`.
  - `src/hooks/useBlueprintTheme.ts` — Wrap root `data-theme="overclock"` updates in `document.startViewTransition()` when supported and reduced motion is off.
  - `src/app/globals.css` — Map `--text-primary`, `--text-secondary`, `--text-muted` in `:root` and `:root[data-theme='overclock']`; add `scrollbar-width: auto`; add `::view-transition-*` reduced-motion rules; add `.neo-overclock-deck` entry/exit rules; add `.neo-nav-scrollspy` and `.neo-nav-link:is(:target-current, .target-current)` rules.
  - `src/components/three/GustoCanvasStage.tsx` — Mount `<OverclockSynthDeck />`, wire pad triggers to `engineRef.current?.triggerShockwave(pad.colorHex)` + `triggerSynthNote(freqHz, 0.28, waveform)`, add a visible `[OVERCLOCK: ON/OFF]` stage control button, and bind `Alt+O` keyboard shortcut.
  - `src/components/ui/NeoNavbar.tsx` — Add `scroll-target-group: auto` scrollspy + `IntersectionObserver` fallback, `aria-current="true"` sync, and non-color active indicator dot on nav links.
  - `src/components/sections/AboutArchitectureSection.tsx`, `src/components/projects/ProjectsVaultSection.tsx`, `src/components/sections/ExperienceTimelineSection.tsx`, `src/components/sections/TechStackMatrixSection.tsx`, `src/components/sections/ContactUplinkSection.tsx` — Add `tabIndex={-1}` to each `<section id="...">` landmark for keyboard scrollspy focus routing.

---

### Task 1: Pure Overclock Synth & Toolbar Roving-Focus Controllers + Multi-Waveform Audio Engine (`src/lib/overclockSynthController.ts`, `src/engine/AudioReactiveController.ts`, `src/hooks/useAudioSync.ts`)

**Files:**
- Create: `src/lib/overclockSynthController.ts`
- Create: `src/lib/__tests__/overclockSynthController.test.ts`
- Modify: `src/engine/AudioReactiveController.ts`
- Modify: `src/engine/__tests__/AudioReactiveController.test.ts`
- Modify: `src/hooks/useAudioSync.ts`

**Interfaces:**
- Consumes:
  - `AudioFrequencySnapshot`, `AudioReactiveController` from `src/engine/AudioReactiveController.ts`
- Produces:
  - `export type SynthWaveform = 'sawtooth' | 'square' | 'triangle' | 'sine'` in `src/lib/overclockSynthController.ts`
  - `export type SynthOctaveShift = -1 | 0 | 1` in `src/lib/overclockSynthController.ts`
  - `export interface SynthPadSpec { id: string; code: string; noteLabel: string; keyHint: string; baseFreqHz: number; colorHex: string; accent: 'yellow' | 'mint' | 'coral' | 'cobalt'; }` in `src/lib/overclockSynthController.ts`
  - `export const SYNTH_PAD_SPECS: readonly SynthPadSpec[]` (6 pads: `E3`, `G3`, `A3`, `B3`, `D4`, `E4`) in `src/lib/overclockSynthController.ts`
  - `export function computeSynthFrequency(baseFreqHz: number, octaveShift?: SynthOctaveShift): number` in `src/lib/overclockSynthController.ts`
  - `export function resolveSynthShortcutAction(input: { key: string; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; isOverclockActive: boolean; isEditableTarget: boolean; }): { type: 'toggle-overclock' } | { type: 'trigger-pad'; pad: SynthPadSpec } | null` in `src/lib/overclockSynthController.ts`
  - `export function computeToolbarNextFocusIndex(input: { currentIndex: number; itemCount: number; key: string; isRtl?: boolean; isVertical?: boolean; }): number | null` in `src/lib/overclockSynthController.ts`
  - `triggerSynthPulse(frequencyHz?: number, durationSec?: number, waveform?: SynthWaveform): void` in `src/engine/AudioReactiveController.ts`

- [ ] **Step 1: Write the failing unit tests in `src/lib/__tests__/overclockSynthController.test.ts` and `src/engine/__tests__/AudioReactiveController.test.ts`**

Create `src/lib/__tests__/overclockSynthController.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import {
  SYNTH_PAD_SPECS,
  computeSynthFrequency,
  computeToolbarNextFocusIndex,
  resolveSynthShortcutAction,
} from '../overclockSynthController';

describe('overclockSynthController', () => {
  it('defines 6 playable cyber-synth pads with positive base frequencies', () => {
    expect(SYNTH_PAD_SPECS).toHaveLength(6);
    expect(SYNTH_PAD_SPECS.map((p) => p.noteLabel)).toEqual([
      'E3',
      'G3',
      'A3',
      'B3',
      'D4',
      'E4',
    ]);
  });

  it('scales frequencies accurately across -1, 0, and +1 octave shifts', () => {
    expect(computeSynthFrequency(220, -1)).toBeCloseTo(110, 2);
    expect(computeSynthFrequency(220, 0)).toBeCloseTo(220, 2);
    expect(computeSynthFrequency(220, 1)).toBeCloseTo(440, 2);
    expect(computeSynthFrequency(-50, 0)).toBe(220);
  });

  it('resolves Alt+O overclock toggle and 1-6 pad shortcuts while ignoring editable targets', () => {
    expect(
      resolveSynthShortcutAction({
        key: 'o',
        altKey: true,
        isOverclockActive: false,
        isEditableTarget: false,
      })
    ).toEqual({ type: 'toggle-overclock' });

    expect(
      resolveSynthShortcutAction({
        key: '1',
        isOverclockActive: true,
        isEditableTarget: false,
      })
    ).toEqual({ type: 'trigger-pad', pad: SYNTH_PAD_SPECS[0] });

    expect(
      resolveSynthShortcutAction({
        key: '1',
        isOverclockActive: false,
        isEditableTarget: false,
      })
    ).toBeNull();

    expect(
      resolveSynthShortcutAction({
        key: '1',
        isOverclockActive: true,
        isEditableTarget: true,
      })
    ).toBeNull();
  });

  it('computes wrapping roving-tabindex positions for horizontal, RTL, and vertical toolbars', () => {
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 0,
        itemCount: 5,
        key: 'ArrowRight',
      })
    ).toBe(1);
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 0,
        itemCount: 5,
        key: 'ArrowLeft',
      })
    ).toBe(4);
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 0,
        itemCount: 5,
        key: 'ArrowRight',
        isRtl: true,
      })
    ).toBe(4);
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 3,
        itemCount: 5,
        key: 'Home',
      })
    ).toBe(0);
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 1,
        itemCount: 5,
        key: 'End',
      })
    ).toBe(4);
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 1,
        itemCount: 5,
        key: 'Tab',
      })
    ).toBeNull();
  });
});
```

Also append a test to `src/engine/__tests__/AudioReactiveController.test.ts` verifying `controller.triggerSynthPulse(329.63, 0.2, 'square')` boosts transient energy safely in Node/SSR.

- [ ] **Step 2: Run Vitest to verify the new test fails**

Run: `npx.cmd vitest run src/lib/__tests__/overclockSynthController.test.ts`
Expected: FAIL with `Cannot find module '../overclockSynthController'`

- [ ] **Step 3: Implement `src/lib/overclockSynthController.ts` and update `AudioReactiveController.ts` & `useAudioSync.ts`**

- Implement `SYNTH_PAD_SPECS`, `computeSynthFrequency`, `resolveSynthShortcutAction`, and `computeToolbarNextFocusIndex` in `src/lib/overclockSynthController.ts`.
- Update `AudioReactiveController.triggerSynthPulse(frequencyHz = 220, durationSec = 0.24, waveform: OscillatorType = 'sawtooth')` in `src/engine/AudioReactiveController.ts` to use `osc.type = waveform`.
- Update `triggerSynthNote` in `src/hooks/useAudioSync.ts` to accept `(freqHz = 220, durationSec = 0.22, waveform: OscillatorType = 'sawtooth')`.

- [ ] **Step 4: Run Vitest, TypeScript, and ESLint to verify GREEN**

Run:
```powershell
npx.cmd vitest run src/lib/__tests__/overclockSynthController.test.ts src/engine/__tests__/AudioReactiveController.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint
```
Expected: PASS (`0` errors, `0` warnings).

- [ ] **Step 5: Commit**

```bash
git add src/lib/overclockSynthController.ts src/lib/__tests__/overclockSynthController.test.ts src/engine/AudioReactiveController.ts src/engine/__tests__/AudioReactiveController.test.ts src/hooks/useAudioSync.ts
git commit -m "feat(phase-5): add pure overclock synth controllers, roving toolbar math, and multi-waveform audio"
```

---

### Task 2: Zero-Re-Render Blueprint Token Inversion, View Transitions & Synth Deck CSS (`src/app/globals.css`, `src/hooks/useBlueprintTheme.ts`)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/hooks/useBlueprintTheme.ts`
- Test: `src/components/ui/__tests__/NeoBrutalPrimitives.test.ts` (or dedicated `src/hooks/__tests__/useBlueprintTheme.test.ts`)

**Interfaces:**
- Consumes:
  - `document.startViewTransition` (progressive enhancement per `same-document-transitions`)
- Produces:
  - `export function applyThemeAttributeWithTransition(nextOverclock: boolean): void` in `src/hooks/useBlueprintTheme.ts`
  - Complete `--text-primary`, `--text-secondary`, `--text-muted` token mapping on `:root` and `:root[data-theme='overclock']` in `src/app/globals.css`
  - Top-level `.neo-overclock-deck` entry/exit rules (`@starting-style`, separate `transition-behavior: allow-discrete`, `:where([hidden], [data-closing])`) and `.neo-nav-scrollspy` / `.neo-nav-link:is(:target-current, .target-current)` rules in `src/app/globals.css`

- [ ] **Step 1: Write the failing unit test in `src/hooks/__tests__/useBlueprintTheme.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import { applyThemeAttributeWithTransition } from '../useBlueprintTheme';

describe('useBlueprintTheme helpers', () => {
  it('safely no-ops DOM theme transition in SSR / Node environments without document', () => {
    expect(() => applyThemeAttributeWithTransition(true)).not.toThrow();
    expect(() => applyThemeAttributeWithTransition(false)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run Vitest to verify RED failure**

Run: `npx.cmd vitest run src/hooks/__tests__/useBlueprintTheme.test.ts`
Expected: FAIL (`applyThemeAttributeWithTransition` is not exported).

- [ ] **Step 3: Update `src/app/globals.css` and `src/hooks/useBlueprintTheme.ts`**

- In `src/app/globals.css`:
  1. In `:root`: add `--text-primary: var(--color-pitch-black); --text-secondary: #262626; --text-muted: var(--ink-muted); scrollbar-width: auto;`.
  2. In `:root[data-theme='overclock']`: add `--text-primary: #ffffff; --text-secondary: #a6fff1; --text-muted: #7ce8d8; scrollbar-width: auto;` (all >= 4.5:1 contrast on `#050b14` and `#0a1628`; never transition `scrollbar-color`).
  3. Add `@media (prefers-reduced-motion: reduce)` rule disabling `::view-transition-group(*)`, `::view-transition-old(*)`, `::view-transition-new(*)`.
  4. Add top-level `.neo-overclock-deck` entry/exit rules (`@starting-style`, separate `transition-behavior: allow-discrete`, `:where([hidden], [data-closing])`, `[hidden] { display: none; }`).
  5. Add `.neo-nav-scrollspy { scroll-target-group: auto; }` and `.neo-nav-link:is(:target-current, .target-current)` active indicator styling + `@media (forced-colors: active)` system color support.
- In `src/hooks/useBlueprintTheme.ts`:
  - Export `applyThemeAttributeWithTransition(nextOverclock: boolean)` which checks `typeof document === 'undefined'`, checks `prefers-reduced-motion: reduce`, and wraps the `document.documentElement` attribute toggle + `THEME_EVENT` dispatch in `document.startViewTransition` when supported.

- [ ] **Step 4: Run Vitest, TypeScript, and ESLint**

Run:
```powershell
npx.cmd vitest run src/hooks/__tests__/useBlueprintTheme.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint
```
Expected: PASS (`0` errors, `0` warnings).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/hooks/useBlueprintTheme.ts src/hooks/__tests__/useBlueprintTheme.test.ts
git commit -m "feat(theme): complete overclock blueprint token inversion, view transitions, and deck/scrollspy CSS"
```

---

### Task 3: Playable `GUSTO_OVERCLOCK // SYNTH-DIMENSION` 3D Synth Deck & Stage Integration (`src/components/three/OverclockSynthDeck.tsx`, `src/components/three/GustoCanvasStage.tsx`)

**Files:**
- Create: `src/components/three/OverclockSynthDeck.tsx`
- Create: `src/components/three/__tests__/OverclockSynthDeck.test.ts`
- Modify: `src/components/three/GustoCanvasStage.tsx`

**Interfaces:**
- Consumes:
  - `SYNTH_PAD_SPECS`, `computeSynthFrequency`, `computeToolbarNextFocusIndex`, `resolveSynthShortcutAction`, `SynthWaveform`, `SynthOctaveShift`, `SynthPadSpec` from `src/lib/overclockSynthController.ts`
  - `canTransitionDisplay` from `src/components/hero/TerminalBootOverlay.tsx`
- Produces:
  - `export interface OverclockSynthDeckProps { isOpen: boolean; onTriggerPad: (pad: SynthPadSpec, freqHz: number, waveform: SynthWaveform) => void; onExitOverclock: () => void; }` in `src/components/three/OverclockSynthDeck.tsx`
  - `export function hideDeckWithTransition(deckEl: HTMLElement | null, onHidden?: () => void, timeoutMs?: number): Promise<void>` in `src/components/three/OverclockSynthDeck.tsx`
  - `export function OverclockSynthDeck(props: OverclockSynthDeckProps): JSX.Element` in `src/components/three/OverclockSynthDeck.tsx`

- [ ] **Step 1: Write the failing unit tests in `src/components/three/__tests__/OverclockSynthDeck.test.ts`**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { hideDeckWithTransition } from '../OverclockSynthDeck';

describe('OverclockSynthDeck transition helper', () => {
  it('applies [data-closing], awaits active animations, sets hidden=true, and invokes onHidden', async () => {
    const attrs = new Map<string, string>();
    const onHidden = vi.fn();
    const mockEl = {
      hidden: false,
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      hasAttribute: (k: string) => attrs.has(k),
      removeAttribute: (k: string) => attrs.delete(k),
      getAnimations: () => [
        {
          finished: new Promise<void>((resolve) => setTimeout(resolve, 10)),
        },
      ],
    } as unknown as HTMLElement;

    await hideDeckWithTransition(mockEl, onHidden, 100);
    expect(mockEl.hidden).toBe(true);
    expect(attrs.has('data-closing')).toBe(false);
    expect(onHidden).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run Vitest to verify RED failure**

Run: `npx.cmd vitest run src/components/three/__tests__/OverclockSynthDeck.test.ts`
Expected: FAIL (`Cannot find module '../OverclockSynthDeck'`).

- [ ] **Step 3: Implement `OverclockSynthDeck.tsx` and integrate into `GustoCanvasStage.tsx`**

- In `src/components/three/OverclockSynthDeck.tsx`:
  - Render `.neo-overclock-deck` container controlled by `isOpen` with `hideDeckWithTransition` exit animation (`animate-element-entry-exit`).
  - Render `<div role="toolbar" aria-label="Synth-Dimension waveform and octave controls" aria-controls="synth-pad-matrix" {...({ focusgroup: 'toolbar wrap' } as Record<string, string>)}>` containing:
    - `<div role="group" aria-label="Oscillator waveform">` with 4 `<button type="button" aria-pressed={waveform === item.value}>` buttons (`SAW`, `SQR`, `TRI`, `SIN`).
    - `<span role="separator" aria-orientation="vertical" />`.
    - `<div role="group" aria-label="Octave shift">` with 3 `<button type="button" aria-pressed={octaveShift === item.value}>` buttons (`SUB -1`, `LEAD 0`, `HIGH +1`).
    - Install roving-tabindex fallback in `useEffect` only when `!('focusGroup' in HTMLElement.prototype)` using `computeToolbarNextFocusIndex`.
  - Render `#synth-pad-matrix` with 6 tactile buttons for `SYNTH_PAD_SPECS` (`E3`..`E4`), each displaying note name, frequency in Hz, and keyboard shortcut badge (`[KEY 1]`..`[KEY 6]`).
  - Render `<p role="status" aria-live="polite">` **outside** the toolbar announcing active synth note/waveform/octave telemetry.
- In `src/components/three/GustoCanvasStage.tsx`:
  - Add `[OVERCLOCK: ON/OFF]` button in the top-right stage HUD controls alongside `[AUDIO_SYNC]` and `PULSE_CORE` so keyboard/pointer users can toggle `GUSTO_OVERCLOCK` directly in addition to the 5x central core click Easter egg and `Alt+O` shortcut.
  - Listen for `keydown` on `window` using `resolveSynthShortcutAction` to toggle Overclock on `Alt+O` and play pads `1`–`6` while Overclock is active.
  - Render `<OverclockSynthDeck isOpen={isOverclock} onTriggerPad={...} onExitOverclock={...} />` inside the stage card.

- [ ] **Step 4: Run Vitest, TypeScript, and ESLint**

Run:
```powershell
npx.cmd vitest run src/components/three/__tests__/OverclockSynthDeck.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint
```
Expected: PASS (`0` errors, `0` warnings).

- [ ] **Step 5: Commit**

```bash
git add src/components/three/OverclockSynthDeck.tsx src/components/three/__tests__/OverclockSynthDeck.test.ts src/components/three/GustoCanvasStage.tsx
git commit -m "feat(overclock): add playable 3D Synth-Dimension deck with roving toolbar and stage shortcuts"
```

---

### Task 4: Scrollspy Navigation (`NeoNavbar.tsx`) & Focusable Section Landmarks

**Files:**
- Modify: `src/components/ui/NeoNavbar.tsx`
- Create: `src/components/ui/__tests__/NeoNavbarScrollspy.test.ts`
- Modify: `src/components/sections/AboutArchitectureSection.tsx`
- Modify: `src/components/projects/ProjectsVaultSection.tsx`
- Modify: `src/components/sections/ExperienceTimelineSection.tsx`
- Modify: `src/components/sections/TechStackMatrixSection.tsx`
- Modify: `src/components/sections/ContactUplinkSection.tsx`

**Interfaces:**
- Produces:
  - `export function normalizeSectionHref(href: string): string | null` in `src/components/ui/NeoNavbar.tsx`
  - `export function resolveActiveSectionHref(visibleSectionIds: readonly string[], links: readonly NavLinkItem[], currentActiveHref?: string | null): string | null` in `src/components/ui/NeoNavbar.tsx`

- [ ] **Step 1: Write the failing unit tests in `src/components/ui/__tests__/NeoNavbarScrollspy.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import {
  normalizeSectionHref,
  resolveActiveSectionHref,
  type NavLinkItem,
} from '../NeoNavbar';

const LINKS: NavLinkItem[] = [
  { label: 'SYSTEM', href: '#architecture' },
  { label: 'PROJECTS', href: '#projects' },
  { label: 'EXPERIENCE', href: '#experience' },
  { label: 'STACK', href: '#stack' },
  { label: 'CONTACT', href: '#contact' },
];

describe('NeoNavbar scrollspy helpers', () => {
  it('extracts clean section IDs from fragment hrefs and rejects external URLs', () => {
    expect(normalizeSectionHref('#projects')).toBe('projects');
    expect(normalizeSectionHref('#architecture')).toBe('architecture');
    expect(normalizeSectionHref('https://example.com')).toBeNull();
    expect(normalizeSectionHref('#')).toBeNull();
  });

  it('resolves the first matching nav link in document order from visible sections', () => {
    expect(resolveActiveSectionHref(['experience', 'stack'], LINKS)).toBe(
      '#experience'
    );
    expect(resolveActiveSectionHref([], LINKS, '#projects')).toBe('#projects');
    expect(resolveActiveSectionHref([], LINKS, null)).toBe('#architecture');
  });
});
```

- [ ] **Step 2: Run Vitest to verify RED failure**

Run: `npx.cmd vitest run src/components/ui/__tests__/NeoNavbarScrollspy.test.ts`
Expected: FAIL (`normalizeSectionHref is not a function`).

- [ ] **Step 3: Implement Scrollspy in `NeoNavbar.tsx` and add `tabIndex={-1}` to all 5 `<section id="...">` landmarks**

- In `src/components/ui/NeoNavbar.tsx`:
  - Export `normalizeSectionHref` and `resolveActiveSectionHref`.
  - Apply `neo-nav-scrollspy` (`scroll-target-group: auto`) to the `<nav>` container and `neo-nav-link` (`.target-current` fallback class when active, `aria-current={isActive ? 'true' : undefined}`) to each link, paired with a visible active indicator square so active state is never conveyed by color alone (`scrollspy` & `color` guides).
  - In `useEffect`: if `CSS.supports?.('scroll-target-group: auto')` is true, sync active link from `document.querySelector('nav a:target-current')` on `scrollend`; otherwise observe target sections with `IntersectionObserver` (`rootMargin: '-45% 0px -45% 0px'`).
- Add `tabIndex={-1}` to the root `<section id="...">` elements in `AboutArchitectureSection.tsx`, `ProjectsVaultSection.tsx`, `ExperienceTimelineSection.tsx`, `TechStackMatrixSection.tsx`, and `ContactUplinkSection.tsx`.

- [ ] **Step 4: Run Full Verification Gate (`test`, `typecheck`, `lint`, `build`)**

Run:
```powershell
npm.cmd run test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run build
```
Expected: All 18 Vitest test files pass, `tsc --noEmit` exits `0`, `eslint .` exits `0` (0 warnings), and `next build` exits `0`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/NeoNavbar.tsx src/components/ui/__tests__/NeoNavbarScrollspy.test.ts src/components/sections/AboutArchitectureSection.tsx src/components/projects/ProjectsVaultSection.tsx src/components/sections/ExperienceTimelineSection.tsx src/components/sections/TechStackMatrixSection.tsx src/components/sections/ContactUplinkSection.tsx docs/superpowers/plans/2026-11-16-phase5-overclock-synth-and-polish.md
git commit -m "feat(phase-5): add scrollspy navigation with IntersectionObserver fallback and focusable section targets"
```

---

## Self-Review Summary

1. **Spec Coverage:** Covers every remaining Phase 5 requirement in [2026-11-15-gusto-3d-portfolio-design.md](file:///c:/Users/User/Documents/my-website/docs/superpowers/specs/2026-11-15-gusto-3d-portfolio-design.md):
   - Playable `GUSTO_OVERCLOCK // SYNTH-DIMENSION` 3D synth Easter egg unlocked via 5x central core click, `[BLUEPRINT / OVERCLOCK]` button, or `Alt+O` keyboard shortcut.
   - Instantaneous zero-re-render `[data-theme="overclock"]` Blueprint/Wireframe theme inversion across all Phase 1–4 components (`--text-primary`, `--text-secondary`, `--text-muted`, `--bg-canvas`, `--bg-surface`, `--ink`, `--ui-border-color`, `--ui-shadow-color`).
   - Modern Web Guidance compliance across `dark-mode`, `dark-mode-toggle`, `color`, `same-document-transitions`, `animate-element-entry-exit`, `toolbar`, and `scrollspy`.
2. **Placeholder Scan:** Zero `TODO`s, zero placeholder strings, exact file paths, and complete unit tests in every task.
3. **Type & Interface Consistency:** `SynthWaveform`, `SynthOctaveShift`, `SynthPadSpec`, `hideDeckWithTransition`, `applyThemeAttributeWithTransition`, `normalizeSectionHref`, and `resolveActiveSectionHref` match across all producers and consumers.

## Review Focus (For Execution & Code Reviewers)

1. **Overclock Contrast & Token Completeness (`color` & `dark-mode`):** Verify that toggling `[data-theme="overclock"]` leaves zero dark-on-dark text across all sections, cards, badges, and `<ProjectVaultModal />`, and that `scrollbar-color` is paired with `scrollbar-width: auto` without CSS transitions on `scrollbar-color`.
2. **Toolbar Semantics & Roving Focus (`toolbar`):** Verify `<OverclockSynthDeck />` uses `role="toolbar" focusgroup="toolbar wrap"`, `role="group"`, `role="separator" aria-orientation="vertical"`, styles toggle state from `[aria-pressed="true"]`, keeps its `role="status"` live region outside the toolbar, and only attaches the JS roving-tabindex listener when `!('focusGroup' in HTMLElement.prototype)`.
3. **Discrete Entry/Exit & View Transitions (`animate-element-entry-exit` & `same-document-transitions`):** Verify `transition-behavior: allow-discrete` is a separate declaration after `transition`, `hideDeckWithTransition` cleans up `[data-closing]` in `finally`, and `::view-transition-*` animations are disabled under `@media (prefers-reduced-motion: reduce)`.
4. **Scrollspy Selector & Accessibility (`scrollspy`):** Verify `nav a:is(:target-current, .target-current)` uses `:is()` (so older browsers don't drop the rule on unrecognized `:target-current`), mirrors active state to `aria-current="true"` plus a non-color indicator dot, and sets `tabIndex={-1}` on all 5 `<section id="...">` landmarks.
