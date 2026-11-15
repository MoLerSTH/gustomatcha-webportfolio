# Konami Code Game Boy Console (`GUSTO_BOY POCKET`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and mount an interactive Neo-Brutalist pixel Game Boy Konami Code console (`↑ ↑ ↓ ↓ ← → ← → B A`) below the 4-column Architectural Telemetry Strip in `HeroSection.tsx`, with live key-press display, dual pointer/keyboard input, `RESET` button, and a playful all-English troll unlock screen (`"YOU GOT FOOLED! THERE'S NOTHING HERE LOL 😜"`).

**Architecture:** A pure TypeScript state machine (`src/lib/konamiController.ts`) handles KMP sliding-prefix sequence matching, live pressed-key history (`<= 10` items), screen-reader milestone announcements, and keyboard event resolution with scroll/focus/modal/toolbar guards. Scoped CSS rules in `src/app/globals.css` style the Neo-Brutalist Game Boy chassis, DMG olive / Overclock phosphor dot-matrix LCD, cross D-Pad, diagonal `B`/`A` caps, and tilted `RESET` pill. `KonamiGameBoyWidget.tsx` separates a pure SSR-renderable `KonamiGameBoyDeck` view from the stateful client controller (which wires `window` keyboard listeners and `useAudioSync` square-wave chiptune tones) and mounts inside `HeroSection.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 6, Tailwind CSS v4 (`src/app/globals.css`), Web Audio API (`useAudioSync`), Vitest 5.

**Spec:** [docs/superpowers/specs/2026-11-16-konami-gameboy-design.md](file:///c:/Users/User/Documents/my-website/docs/superpowers/specs/2026-11-16-konami-gameboy-design.md)

## Global Constraints

- Exact Konami sequence: `['UP', 'UP', 'DOWN', 'DOWN', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'B', 'A']`
- Visible bezel hint text: `(↑ ↑ ↓ ↓ ← → ← → B A)`
- All UI text rendered on the console must be strictly English (no Thai UI copy)
- Primary unlocked troll copy: `YOU GOT FOOLED! THERE'S NOTHING HERE LOL 😜` and sub-copy `Entered the whole code for... literally nothing! Press RESET to try again.`
- Every interactive control (`↑`, `←`, `→`, `↓`, `RESET`, `B`, `A`) must be a native `<button type="button">` element (never `<div role="button">`)
- Chiptune audio feedback must reuse `useAudioSync().triggerSynthNote(freqHz, durationSec, 'square')` and only play when `audioEnabled === true`
- Zero new npm dependencies; all tests run under `npm.cmd run test` (`vitest run` in Node environment)

## Review Focus

1. **Overlapping prefix recovery (`↑ ↑ ↑ ↓ ↓ ← → ← → B A` or `↑ ↑ ↓ ← ↑`):** Pressing a 3rd `UP` at the start must keep `matchedCount === 2`, and pressing `UP` immediately after a wrong key must advance to `matchedCount === 1` rather than `0`.
2. **Keyboard auto-repeat suppression (`event.repeat === true`):** Holding down an arrow or `B`/`A` key must return `null` from `resolveKonamiKeyboardInput` so key-repeat never double-triggers or breaks `UP UP` / `DOWN DOWN`.
3. **Scroll-hijacking vs focus isolation:** Pressing `ArrowUp`/`ArrowDown` when `isConsoleFocused === false` must set `shouldPreventDefault: false` so page scrolling works normally, whereas `isConsoleFocused === true` must set `shouldPreventDefault: true`; editable targets, open modals (`isModalOpen`), and `[role="toolbar"]` (`isToolbarTarget`) must return `null`.
4. **Post-unlock button presses (`status === 'unlocked'`):** Pressing `↑ ↓ ← → B A` after unlocking must preserve `status === 'unlocked'` and `matchedCount === 10` while still updating `lastPressed`, `lastSource`, `pressedLog`, and `pressSeq` until `RESET` is invoked.
5. **Coarse-pointer, reduced-motion, and forced-colors resilience:** Game Boy buttons must scale to `>= 2.75rem` on `@media (pointer: coarse)`, disable motion transforms under `@media (prefers-reduced-motion: reduce)`, and map borders/active highlights to `ButtonText`/`Highlight` under `@media (forced-colors: active)`.

---

### Task 1: Konami Code State Machine, Sliding Prefix Matcher & Keyboard Resolver

**Files:**
- Create: `src/lib/konamiController.ts`
- Test: `src/lib/__tests__/konamiController.test.ts`

**Interfaces:**
- Consumes: none (pure TypeScript module)
- Produces:
  - `export type KonamiButtonId = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'B' | 'A'`
  - `export type KonamiInputSource = 'pointer' | 'keyboard'`
  - `export interface KonamiButtonSpec { id: KonamiButtonId; glyph: string; shortLabel: string; ariaLabel: string; keyHint: string; freqHz: number; }`
  - `export const KONAMI_SEQUENCE: readonly KonamiButtonId[]`
  - `export const KONAMI_HINT_TEXT = '(↑ ↑ ↓ ↓ ← → ← → B A)'`
  - `export const KONAMI_BUTTON_SPECS: Readonly<Record<KonamiButtonId, KonamiButtonSpec>>`
  - `export const MAX_PRESSED_LOG = 10`
  - `export interface KonamiState { status: 'entering' | 'unlocked'; matchedCount: number; pressedLog: KonamiButtonId[]; lastPressed: KonamiButtonId | null; lastSource: KonamiInputSource | null; pressSeq: number; totalPressCount: number; }`
  - `export const INITIAL_KONAMI_STATE: KonamiState`
  - `export function computeLongestKonamiPrefix(inputs: readonly KonamiButtonId[]): number`
  - `export function stepKonamiInput(state: KonamiState, button: KonamiButtonId, source?: KonamiInputSource): KonamiState`
  - `export function resetKonamiState(): KonamiState`
  - `export function formatKonamiLiveAnnouncement(state: KonamiState): string`
  - `export interface KonamiKeyboardEventInput { key: string; repeat?: boolean; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; isEditableTarget: boolean; isModalOpen?: boolean; isToolbarTarget?: boolean; isConsoleFocused: boolean; }`
  - `export type KonamiKeyboardResolution = { action: 'press'; button: KonamiButtonId; shouldPreventDefault: boolean } | { action: 'reset'; shouldPreventDefault: boolean } | null`
  - `export function resolveKonamiKeyboardInput(input: KonamiKeyboardEventInput): KonamiKeyboardResolution`

- [ ] **Step 1: Write the failing test in `src/lib/__tests__/konamiController.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import {
  INITIAL_KONAMI_STATE,
  KONAMI_BUTTON_SPECS,
  KONAMI_HINT_TEXT,
  KONAMI_SEQUENCE,
  MAX_PRESSED_LOG,
  computeLongestKonamiPrefix,
  formatKonamiLiveAnnouncement,
  resetKonamiState,
  resolveKonamiKeyboardInput,
  stepKonamiInput,
  type KonamiButtonId,
} from '../konamiController';

describe('konamiController', () => {
  it('defines exact 10-step Konami sequence, hint string, and 8-bit square frequencies', () => {
    expect(KONAMI_SEQUENCE).toEqual([
      'UP',
      'UP',
      'DOWN',
      'DOWN',
      'LEFT',
      'RIGHT',
      'LEFT',
      'RIGHT',
      'B',
      'A',
    ]);
    expect(KONAMI_HINT_TEXT).toBe('(↑ ↑ ↓ ↓ ← → ← → B A)');
    expect(KONAMI_BUTTON_SPECS.UP.freqHz).toBeCloseTo(523.25, 2);
    expect(KONAMI_BUTTON_SPECS.A.freqHz).toBeCloseTo(659.25, 2);
  });

  it('unlocks troll state on exact 10-step sequence and tracks pressedLog + source', () => {
    let state = INITIAL_KONAMI_STATE;
    for (const key of KONAMI_SEQUENCE) {
      state = stepKonamiInput(state, key, 'pointer');
    }
    expect(state.status).toBe('unlocked');
    expect(state.matchedCount).toBe(10);
    expect(state.lastPressed).toBe('A');
    expect(state.lastSource).toBe('pointer');
    expect(state.pressedLog).toEqual(KONAMI_SEQUENCE);
    expect(state.pressSeq).toBe(10);
  });

  it('recovers overlapping prefixes via KMP fallback (Review Focus #1: extra UP or restart on UP)', () => {
    const noisySequence: KonamiButtonId[] = [
      'UP',
      'UP',
      'UP', // 3rd UP should keep matchedCount at 2
      'DOWN',
      'DOWN',
      'LEFT',
      'RIGHT',
      'LEFT',
      'RIGHT',
      'B',
      'A',
    ];
    let state = INITIAL_KONAMI_STATE;
    for (let i = 0; i < 3; i++) {
      state = stepKonamiInput(state, noisySequence[i], 'keyboard');
    }
    expect(state.matchedCount).toBe(2);

    for (let i = 3; i < noisySequence.length; i++) {
      state = stepKonamiInput(state, noisySequence[i], 'keyboard');
    }
    expect(state.status).toBe('unlocked');
    expect(state.pressedLog).toHaveLength(MAX_PRESSED_LOG);
    expect(computeLongestKonamiPrefix(['UP', 'DOWN', 'UP'])).toBe(1);
  });

  it('keeps status unlocked and echoes pressed keys after completion until resetKonamiState is called (Review Focus #4)', () => {
    let state = INITIAL_KONAMI_STATE;
    for (const key of KONAMI_SEQUENCE) {
      state = stepKonamiInput(state, key, 'keyboard');
    }
    const afterExtraTap = stepKonamiInput(state, 'B', 'pointer');
    expect(afterExtraTap.status).toBe('unlocked');
    expect(afterExtraTap.matchedCount).toBe(10);
    expect(afterExtraTap.lastPressed).toBe('B');
    expect(afterExtraTap.lastSource).toBe('pointer');
    expect(afterExtraTap.pressSeq).toBe(11);

    const reset = resetKonamiState();
    expect(reset).toEqual(INITIAL_KONAMI_STATE);
  });

  it('resolves keyboard inputs with repeat, focus, editable, modal, and toolbar guards (Review Focus #2 & #3)', () => {
    // Auto-repeat ignored
    expect(
      resolveKonamiKeyboardInput({
        key: 'ArrowUp',
        repeat: true,
        isEditableTarget: false,
        isConsoleFocused: true,
      })
    ).toBeNull();

    // Editable / Modal / Toolbar ignored
    expect(
      resolveKonamiKeyboardInput({
        key: 'ArrowUp',
        isEditableTarget: true,
        isConsoleFocused: true,
      })
    ).toBeNull();
    expect(
      resolveKonamiKeyboardInput({
        key: 'b',
        isEditableTarget: false,
        isModalOpen: true,
        isConsoleFocused: true,
      })
    ).toBeNull();
    expect(
      resolveKonamiKeyboardInput({
        key: 'ArrowLeft',
        isEditableTarget: false,
        isToolbarTarget: true,
        isConsoleFocused: false,
      })
    ).toBeNull();

    // Focused console prevents default on arrows and allows Escape reset
    expect(
      resolveKonamiKeyboardInput({
        key: 'ArrowDown',
        isEditableTarget: false,
        isConsoleFocused: true,
      })
    ).toEqual({
      action: 'press',
      button: 'DOWN',
      shouldPreventDefault: true,
    });
    expect(
      resolveKonamiKeyboardInput({
        key: 'Escape',
        isEditableTarget: false,
        isConsoleFocused: true,
      })
    ).toEqual({
      action: 'reset',
      shouldPreventDefault: true,
    });

    // Unfocused global listener captures Konami keys passively without blocking scroll
    expect(
      resolveKonamiKeyboardInput({
        key: 'ArrowDown',
        isEditableTarget: false,
        isConsoleFocused: false,
      })
    ).toEqual({
      action: 'press',
      button: 'DOWN',
      shouldPreventDefault: false,
    });
    expect(
      resolveKonamiKeyboardInput({
        key: 'a',
        isEditableTarget: false,
        isConsoleFocused: false,
      })
    ).toEqual({
      action: 'press',
      button: 'A',
      shouldPreventDefault: false,
    });
    expect(
      resolveKonamiKeyboardInput({
        key: 'Escape',
        isEditableTarget: false,
        isConsoleFocused: false,
      })
    ).toBeNull();
  });

  it('formats concise polite screen-reader announcements for idle, milestone, and unlocked states', () => {
    expect(formatKonamiLiveAnnouncement(INITIAL_KONAMI_STATE)).toContain('Ready');
    let state = stepKonamiInput(INITIAL_KONAMI_STATE, 'UP', 'keyboard');
    expect(formatKonamiLiveAnnouncement(state)).toContain('1 of 10');
    for (const key of KONAMI_SEQUENCE.slice(1)) {
      state = stepKonamiInput(state, key, 'keyboard');
    }
    expect(formatKonamiLiveAnnouncement(state)).toContain('YOU GOT FOOLED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/lib/__tests__/konamiController.test.ts`
Expected: FAIL with cannot find module `../konamiController`

- [ ] **Step 3: Implement `src/lib/konamiController.ts`**

Implement the exported types, `KONAMI_SEQUENCE`, `KONAMI_HINT_TEXT`, `KONAMI_BUTTON_SPECS` (`UP`: `↑` / `523.25`, `DOWN`: `↓` / `392.0`, `LEFT`: `←` / `440.0`, `RIGHT`: `→` / `493.88`, `B`: `B` / `587.33`, `A`: `A` / `659.25`), `computeLongestKonamiPrefix` (testing candidate suffix lengths `Math.min(inputs.length, KONAMI_SEQUENCE.length)` down to `1` against `KONAMI_SEQUENCE.slice(0, k)`), `stepKonamiInput` (maintaining rolling matched prefix slice + `pressedLog.slice(-MAX_PRESSED_LOG)` and locking `status: 'unlocked'` once `matchedCount === 10`), `resetKonamiState`, `formatKonamiLiveAnnouncement`, and `resolveKonamiKeyboardInput`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/lib/__tests__/konamiController.test.ts`
Expected: PASS (6 passed)

- [ ] **Step 5: Commit**

```powershell
git add src/lib/konamiController.ts src/lib/__tests__/konamiController.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m "feat(hero): add Konami Code Game Boy controller and keyboard resolver"
```

---

### Task 2: Game Boy Console & Pixel LCD Stylesheet Rules (`src/app/globals.css`)

**Files:**
- Modify: `src/app/globals.css`
- Test: `src/lib/__tests__/konamiGameBoyStylesheet.test.ts`

**Interfaces:**
- Consumes: CSS design tokens in `src/app/globals.css` (`--ui-border-color`, `--btn-shadow-rest`, `--color-electric-yellow`, `--color-cyber-mint`, `--color-coral-pop`)
- Produces CSS classes in `src/app/globals.css`:
  - `.neo-gameboy-shell`
  - `.neo-gameboy-bezel`
  - `.neo-gameboy-lcd` (with `:root[data-theme='overclock'] .neo-gameboy-lcd` override and `[data-status='unlocked']` accent treatment)
  - `.neo-dpad-grid` and `.neo-dpad-btn` (with `[data-active='true']` depressed transform)
  - `.neo-ab-btn` (`[data-variant='b']`, `[data-variant='a']`, and `[data-active='true']`)
  - `.neo-reset-pill`
  - Media query entries in `@media (pointer: coarse)`, `@media (prefers-reduced-motion: reduce)`, and `@media (forced-colors: active)`

- [ ] **Step 1: Write the failing test in `src/lib/__tests__/konamiGameBoyStylesheet.test.ts`**

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const GLOBALS_CSS_PATH = resolve(process.cwd(), 'src/app/globals.css');

describe('globals.css Konami Game Boy console classes & accessibility media guards', () => {
  it('defines Game Boy shell, DMG & Overclock LCD palettes, D-Pad, A/B caps, and Reset pill', () => {
    const css = readFileSync(GLOBALS_CSS_PATH, 'utf8');
    expect(css).toContain('.neo-gameboy-shell');
    expect(css).toContain('.neo-gameboy-lcd');
    expect(css).toContain('#9bbc0f');
    expect(css).toContain('#0f380f');
    expect(css).toContain(":root[data-theme='overclock'] .neo-gameboy-lcd");
    expect(css).toContain('.neo-dpad-grid');
    expect(css).toContain('.neo-dpad-btn');
    expect(css).toContain('.neo-ab-btn');
    expect(css).toContain('.neo-reset-pill');
  });

  it('enforces coarse pointer sizing, reduced-motion disablement, and forced-colors compliance (Review Focus #5)', () => {
    const css = readFileSync(GLOBALS_CSS_PATH, 'utf8');

    const coarseBlock = css.slice(css.indexOf('@media (pointer: coarse)'));
    expect(coarseBlock).toContain('.neo-dpad-btn');
    expect(coarseBlock).toContain('.neo-ab-btn');

    const reducedMotionBlock = css.slice(
      css.indexOf('@media (prefers-reduced-motion: reduce)')
    );
    expect(reducedMotionBlock).toContain('.neo-dpad-btn');
    expect(reducedMotionBlock).toContain('.neo-ab-btn');

    const forcedColorsBlock = css.slice(
      css.indexOf('@media (forced-colors: active)')
    );
    expect(forcedColorsBlock).toContain('.neo-gameboy-shell');
    expect(forcedColorsBlock).toContain('.neo-dpad-btn');
    expect(forcedColorsBlock).toContain('.neo-ab-btn');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/lib/__tests__/konamiGameBoyStylesheet.test.ts`
Expected: FAIL with `expected ... to contain '.neo-gameboy-shell'`

- [ ] **Step 3: Add Game Boy CSS rules and media query guards to `src/app/globals.css`**

Add `.neo-gameboy-shell`, `.neo-gameboy-bezel`, `.neo-gameboy-lcd` (`#9bbc0f` background, `#0f380f` text, 4px dot-matrix radial/linear background grid, plus `:root[data-theme='overclock'] .neo-gameboy-lcd` `#071a1d` background and `#00f5d4` text), `.neo-dpad-grid` (`grid-template-columns: repeat(3, minmax(0, 1fr))`), `.neo-dpad-btn`, `.neo-ab-btn`, and `.neo-reset-pill` inside `@layer components`, and register `.neo-dpad-btn`, `.neo-ab-btn`, `.neo-reset-pill`, and `.neo-gameboy-shell` in the `@media (pointer: coarse)`, `@media (prefers-reduced-motion: reduce)`, and `@media (forced-colors: active)` blocks.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/lib/__tests__/konamiGameBoyStylesheet.test.ts`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```powershell
git add src/app/globals.css src/lib/__tests__/konamiGameBoyStylesheet.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m "style(hero): add Neo-Brutalist Game Boy LCD and controller CSS tokens"
```

---

### Task 3: Konami Game Boy UI Component & Hero Section Integration

**Files:**
- Create: `src/components/hero/KonamiGameBoyWidget.tsx`
- Modify: `src/components/hero/HeroSection.tsx:285-312`
- Test: `src/components/hero/__tests__/KonamiGameBoyWidget.test.ts`

**Interfaces:**
- Consumes:
  - From `@/lib/konamiController`: `INITIAL_KONAMI_STATE`, `KONAMI_BUTTON_SPECS`, `KONAMI_HINT_TEXT`, `KONAMI_SEQUENCE`, `formatKonamiLiveAnnouncement`, `resetKonamiState`, `resolveKonamiKeyboardInput`, `stepKonamiInput`, `type KonamiButtonId`, `type KonamiInputSource`, `type KonamiState`
  - From `@/hooks/useAudioSync`: `useAudioSync()` (`{ audioEnabled, triggerSynthNote }`)
- Produces:
  - `export interface KonamiGameBoyDeckProps { state: KonamiState; activeFlashButton: KonamiButtonId | null; isConsoleFocused: boolean; onPressButton: (button: KonamiButtonId, source: KonamiInputSource) => void; onReset: () => void; }`
  - `export function KonamiGameBoyDeck(props: KonamiGameBoyDeckProps): JSX.Element`
  - `export function KonamiGameBoyWidget(): JSX.Element`

- [ ] **Step 1: Write the failing test in `src/components/hero/__tests__/KonamiGameBoyWidget.test.ts`**

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  INITIAL_KONAMI_STATE,
  KONAMI_SEQUENCE,
  stepKonamiInput,
} from '@/lib/konamiController';
import { KonamiGameBoyDeck } from '../KonamiGameBoyWidget';

describe('KonamiGameBoyDeck & HeroSection integration', () => {
  it('renders Game Boy hint (↑ ↑ ↓ ↓ ← → ← → B A), D-Pad ↑ ↓ ← →, B/A buttons, and RESET button as native buttons', () => {
    const html = renderToStaticMarkup(
      createElement(KonamiGameBoyDeck, {
        state: INITIAL_KONAMI_STATE,
        activeFlashButton: null,
        isConsoleFocused: false,
        onPressButton: vi.fn(),
        onReset: vi.fn(),
      })
    );

    expect(html).toContain('(↑ ↑ ↓ ↓ ← → ← → B A)');
    expect(html).toContain('aria-label="Up (↑)"');
    expect(html).toContain('aria-label="Down (↓)"');
    expect(html).toContain('aria-label="Left (←)"');
    expect(html).toContain('aria-label="Right (→)"');
    expect(html).toContain('aria-label="Button B"');
    expect(html).toContain('aria-label="Button A"');
    expect(html).toContain('RESET');
  });

  it('displays pressed buttons live on the LCD screen from both click and keyboard sources', () => {
    let state = stepKonamiInput(INITIAL_KONAMI_STATE, 'UP', 'pointer');
    state = stepKonamiInput(state, 'RIGHT', 'keyboard');

    const html = renderToStaticMarkup(
      createElement(KonamiGameBoyDeck, {
        state,
        activeFlashButton: 'RIGHT',
        isConsoleFocused: true,
        onPressButton: vi.fn(),
        onReset: vi.fn(),
      })
    );

    expect(html).toContain('RIGHT');
    expect(html).toContain('KEYBOARD');
    expect(html).toContain('1/10');
    expect(html).toContain('data-active="true"');
  });

  it('displays the playful troll message when Konami Code is completed and echoes post-unlock presses (Review Focus #4)', () => {
    let state = INITIAL_KONAMI_STATE;
    for (const key of KONAMI_SEQUENCE) {
      state = stepKonamiInput(state, key, 'keyboard');
    }
    state = stepKonamiInput(state, 'B', 'pointer');

    const html = renderToStaticMarkup(
      createElement(KonamiGameBoyDeck, {
        state,
        activeFlashButton: 'B',
        isConsoleFocused: true,
        onPressButton: vi.fn(),
        onReset: vi.fn(),
      })
    );

    expect(html).toContain("YOU GOT FOOLED! THERE'S NOTHING HERE LOL 😜");
    expect(html).toContain('Entered the whole code for... literally nothing!');
    expect(html).toContain('B');
  });

  it('mounts <KonamiGameBoyWidget /> directly beneath the 4-column telemetry strip in HeroSection.tsx', () => {
    const heroSource = readFileSync(
      resolve(process.cwd(), 'src/components/hero/HeroSection.tsx'),
      'utf8'
    );
    const dlCloseIndex = heroSource.indexOf('</dl>');
    const widgetIndex = heroSource.indexOf('<KonamiGameBoyWidget');
    const stageIndex = heroSource.indexOf('<GustoCanvasStage');

    expect(dlCloseIndex).toBeGreaterThan(0);
    expect(widgetIndex).toBeGreaterThan(dlCloseIndex);
    expect(widgetIndex).toBeLessThan(stageIndex);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/components/hero/__tests__/KonamiGameBoyWidget.test.ts`
Expected: FAIL with cannot find module `../KonamiGameBoyWidget`

- [ ] **Step 3: Implement `src/components/hero/KonamiGameBoyWidget.tsx` and mount in `src/components/hero/HeroSection.tsx`**

In `src/components/hero/KonamiGameBoyWidget.tsx`:
- Implement `KonamiGameBoyDeck`:
  - Renders `<section aria-labelledby="konami-console-heading" className="neo-gameboy-shell ...">`
  - Top bezel header with `#konami-console-heading` (`GUSTO_BOY // KONAMI_01`), LED dot, keyboard badge (`KB: LOCKED` when `isConsoleFocused` else `KB: READY`), and visible hint `HINT: (↑ ↑ ↓ ↓ ← → ← → B A)`
  - `.neo-gameboy-lcd` screen showing:
    - When `state.status === 'entering'`: 10-slot sequence tracker (`0..9` matching `KONAMI_SEQUENCE`), progress badge `${state.matchedCount}/10`, live last-pressed readout (`lastPressed` glyph + `shortLabel` + `CLICK` / `KEYBOARD` source badge, or `WAITING FOR INPUT`), and horizontal live pressed-key log chips (`state.pressedLog`)
    - When `state.status === 'unlocked'`: troll banner (`KONAMI_10 // GOTCHA!`, `YOU GOT FOOLED! THERE'S NOTHING HERE LOL 😜`, `Entered the whole code for... literally nothing! Press RESET to try again.`) plus live last-pressed key echo (`PRESSED [X] // STILL NOTHING TO PLAY LOL`)
  - Controls deck:
    - Left 3x3 `.neo-dpad-grid` with 4 native `<button type="button" className="neo-dpad-btn">` (`aria-label="Up (↑)"`, `"Left (←)"`, `"Right (→)"`, `"Down (↓)"`) and decorative center pivot
    - Center `.neo-reset-pill` native `<button type="button">` labeled `RESET` (`onClick={onReset}`)
    - Right diagonal `.neo-ab-btn` native `<button type="button">` controls (`aria-label="Button B"` and `aria-label="Button A"`)
  - `<p className="sr-only" role="status" aria-live="polite">{formatKonamiLiveAnnouncement(state)}</p>`
- Implement `KonamiGameBoyWidget`:
  - Tracks `state`, `activeFlashButton`, `isConsoleFocused`, and active timeout IDs (`useRef<number[]>([])` cleaned up on unmount/reset)
  - Plays 8-bit `'square'` tone via `triggerSynthNote` when `audioEnabled === true` (single note on button press; 4-note ascending arpeggio `523.25 -> 659.25 -> 783.99 -> 1046.5` when transitioning from `'entering'` to `'unlocked'`; descending 2-note cue on reset)
  - Binds `window.addEventListener('keydown', ...)` using `resolveKonamiKeyboardInput`

In `src/components/hero/HeroSection.tsx`:
- Import `KonamiGameBoyWidget` and place `<KonamiGameBoyWidget />` immediately after `</dl>` inside the `lg:col-span-7` container.

- [ ] **Step 4: Run full verification suite to verify all tests, types, lint, and build pass**

Run:
- `npx.cmd vitest run`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`
Expected: All test files PASS, zero TypeScript or ESLint errors, clean production build.

- [ ] **Step 5: Commit**

```powershell
git add src/components/hero/KonamiGameBoyWidget.tsx src/components/hero/HeroSection.tsx src/components/hero/__tests__/KonamiGameBoyWidget.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m "feat(hero): mount Konami Code Game Boy widget below Hero telemetry strip"
```
