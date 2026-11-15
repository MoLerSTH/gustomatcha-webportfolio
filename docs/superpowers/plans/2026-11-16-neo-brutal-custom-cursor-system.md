# Neo-Brutalist Custom Cursor System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a crisp, 0ms-latency custom mouse cursor system (`default`, `pointer`, `crosshair`, `text`, `not-allowed`) across `GUSTO_OS v2.6` that swaps palettes automatically between Friendly Neo-Brutalist light mode and `[data-theme="overclock"]` dark mode while keeping touch devices and Windows High Contrast accessible.

**Architecture:** Encode all 5 cursor icons per theme as `32×32` inline `data:image/svg+xml` CSS custom properties (`--neo-cursor-*`) built and validated by a pure TypeScript module (`src/lib/neoCursors.ts`), apply them in unlayered CSS inside `@media (hover: hover) and (pointer: fine)` after Tailwind utilities in `src/app/globals.css` with a native keyword reset in `@media (forced-colors: active)`, and replace inline `container.style.cursor` writes in `GustoWorldEngine.ts` with `container.dataset.cursor` synchronized with `GustoCanvasStage.tsx`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (LightningCSS), TypeScript 6, Pure Three.js (`GustoWorldEngine`), Vitest 5.

**Spec:** [docs/superpowers/specs/2026-11-16-neo-brutal-custom-cursor-design.md](../specs/2026-11-16-neo-brutal-custom-cursor-design.md)

## Global Constraints

- Inline `data:image/svg+xml` cursor URLs only (`32×32` viewBox, zero extra HTTP requests, zero `#` unescaped characters).
- No `cursor: none`, no JS `mousemove` DOM cursor follower overlay, and no per-frame cursor JS loops.
- Five required cursor states & hotspots: `default` `(4, 2)`, `pointer` `(10, 2)`, `crosshair` `(16, 16)`, `text` `(16, 16)`, `not-allowed` `(16, 16)`.
- Dual theme parity: Friendly Neo-Brutalist (`#FFE600`, `#0A0A0A`, `#FFFFFF`, `#FF5D8F`) and Overclock Blueprint (`#00F5D4`, `#050b14`, `#FFE600`, `#FF5D8F`).
- Strict Modern Web Guidance compliance: gated behind `@media (hover: hover) and (pointer: fine)`, native keyword resets in `@media (forced-colors: active)`, child `cursor: inherit` guard inside interactive elements, disabled precedence over pointer, and `container.dataset.cursor` sync in `GustoWorldEngine` without breaking mock containers in tests.
- Maintain zero `tsc --noEmit` errors, zero `eslint .` warnings, and clean `next build`.

## Review Focus

- Tailwind v4 `@layer utilities` `.cursor-pointer` overriding custom cursor declarations if placed in `@layer base`/`@layer components` -> pin unlayered cursor rules in `globals.css`.
- Unescaped `#` or out-of-range hotspot coordinates (`>= 32` or `< 0`) causing silent browser fallback -> pin SVG escaping, size bounds (`32×32`), and hotspot bounds in `neoCursors.test.ts` and stylesheet parity tests.
- Hovering `<span>`, `<code>`, or `<svg>` nested inside `<a>`, `<button>`, `<summary>`, or `.cursor-pointer` flickering to I-beam (`text`) -> pin interactive descendant `cursor: inherit` rule in stylesheet contract tests.
- `GustoWorldEngine` throwing on headless/test `mockContainer = {}` when `dataset` is absent or failing to clear `dataset.cursor` on `dispose()` -> pin safe null-guarded `dataset.cursor` helper & `dispose()` cleanup tests.
- Custom `url(...)` cursors remaining active in Windows High Contrast (`forced-colors: active`) or leaking to touch viewports -> pin `@media (hover: hover) and (pointer: fine)` and `@media (forced-colors: active)` resets for both `:root` and `:root[data-theme='overclock']`.

---

### Task 1: Pure Cursor SVG Token Builder & Validator (`src/lib/neoCursors.ts`)

**Files:**
- Create: `src/lib/neoCursors.ts`
- Test: `src/lib/__tests__/neoCursors.test.ts`

**Interfaces:**
- Produces:
  - `export type CursorRole = 'default' | 'pointer' | 'crosshair' | 'text' | 'not-allowed';`
  - `export type CursorThemeMode = 'neo' | 'overclock';`
  - `export interface CursorSpec { role: CursorRole; hotspotX: number; hotspotY: number; fallback: CursorRole; }`
  - `export const CURSOR_SIZE_PX = 32;`
  - `export const CURSOR_SPECS: Record<CursorRole, CursorSpec>;`
  - `export function buildCursorSvg(role: CursorRole, theme: CursorThemeMode): string`
  - `export function encodeSvgDataUri(svg: string): string`
  - `export function buildCursorCssValue(role: CursorRole, theme: CursorThemeMode): string`
  - `export function serializeCursorThemeTokens(theme: CursorThemeMode): Record<string, string>`

- [ ] **Step 1: Write the failing unit tests**

Create `src/lib/__tests__/neoCursors.test.ts` testing:
1. `CURSOR_SPECS` defines all 5 roles (`default`, `pointer`, `crosshair`, `text`, `not-allowed`) with spec hotspots `(4,2)`, `(10,2)`, `(16,16)`, `(16,16)`, `(16,16)`, and integer hotspots within `[0, CURSOR_SIZE_PX - 1]`.
2. `buildCursorSvg(role, theme)` produces `32×32` `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"...` without `<filter`, `<feDropShadow`, or gradients, and contains the Neo palette (`#FFE600`, `#0A0A0A`) for `'neo'` and Overclock palette (`#00F5D4`, `#050b14`) for `'overclock'`.
3. `encodeSvgDataUri(svg)` starts with `data:image/svg+xml,` and contains zero raw `#`, `"`, `<`, or `>` characters (using `%23` for hex colors).
4. `buildCursorCssValue(role, theme)` returns exact `url("data:image/svg+xml,...") <hotspotX> <hotspotY>, <fallback>` format.
5. `serializeCursorThemeTokens(theme)` maps `--neo-cursor-default`, `--neo-cursor-pointer`, `--neo-cursor-crosshair`, `--neo-cursor-text`, and `--neo-cursor-not-allowed` cleanly for both themes.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/lib/__tests__/neoCursors.test.ts`
Expected: FAIL with module import error (`Cannot find module '../neoCursors'`).

- [ ] **Step 3: Implement `src/lib/neoCursors.ts`**

Implement clean, non-duplicated vector SVG templates parameterized by a shared `CURSOR_PALETTES` map (`neo` vs `overclock`), minimal deterministic `encodeSvgDataUri`, `buildCursorCssValue`, and `serializeCursorThemeTokens` with concise JSDoc comments. Keep all vector coordinates strictly inside `0..30` on the `32×32` viewBox so 2px strokes and hard offset shadows never clip.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/lib/__tests__/neoCursors.test.ts`
Expected: PASS (`5/5` or all test cases passing).

- [ ] **Step 5: Commit Task 1**

```bash
git add docs/superpowers/specs/2026-11-16-neo-brutal-custom-cursor-design.md docs/superpowers/plans/2026-11-16-neo-brutal-custom-cursor-system.md src/lib/neoCursors.ts src/lib/__tests__/neoCursors.test.ts
git commit -m "feat(cursor): add pure Neo-Brutalist SVG cursor token generator and tests"
```

---

### Task 2: Global CSS Cursor Tokens, Fine-Pointer Cascade & Forced-Colors Fallback (`src/app/globals.css`)

**Files:**
- Modify: `src/app/globals.css` (inside `:root`, `:root[data-theme='overclock']`, unlayered `@media (hover: hover) and (pointer: fine)` section, and `@media (forced-colors: active)` block)
- Test: `src/lib/__tests__/neoCursorStylesheet.test.ts`

**Interfaces:**
- Consumes: `serializeCursorThemeTokens` from `@/lib/neoCursors`
- Produces: CSS custom properties `--neo-cursor-default`, `--neo-cursor-pointer`, `--neo-cursor-crosshair`, `--neo-cursor-text`, `--neo-cursor-not-allowed` on `:root` and `:root[data-theme='overclock']`, plus unlayered `[data-cursor='crosshair']` / `[data-cursor='pointer']` / interactive / text / disabled bindings.

- [ ] **Step 1: Write the failing stylesheet parity & accessibility contract tests**

Create `src/lib/__tests__/neoCursorStylesheet.test.ts` reading `src/app/globals.css` directly and asserting:
1. Every key/value returned by `serializeCursorThemeTokens('neo')` matches the exact declaration inside the `:root { ... }` block of `src/app/globals.css`.
2. Every key/value returned by `serializeCursorThemeTokens('overclock')` matches the exact declaration inside the `:root[data-theme='overclock'] { ... }` block of `src/app/globals.css`.
3. `src/app/globals.css` wraps the cursor selector bindings (`var(--neo-cursor-default)`, `var(--neo-cursor-pointer)`, `var(--neo-cursor-crosshair)`, `var(--neo-cursor-text)`, `var(--neo-cursor-not-allowed)`) inside `@media (hover: hover) and (pointer: fine)` in unlayered CSS (not nested inside `@layer base` or `@layer components`) so Tailwind `@layer utilities` `.cursor-pointer` cannot override them.
4. `globals.css` includes descendant `cursor: inherit;` for active interactive controls so nested `<span>`/`<code>`/`<p>` never switch to I-beam inside buttons/links, and disabled `:is(:disabled, [aria-disabled='true'], ..., .cursor-not-allowed)` appears after pointer rules using `var(--neo-cursor-not-allowed)`.
5. `@media (forced-colors: active)` resets `--neo-cursor-default`..`--neo-cursor-not-allowed` back to `default`, `pointer`, `crosshair`, `text`, `not-allowed` on both `:root` and `:root[data-theme='overclock']`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/lib/__tests__/neoCursorStylesheet.test.ts`
Expected: FAIL because `--neo-cursor-*` tokens and media rules do not yet exist in `src/app/globals.css`.

- [ ] **Step 3: Update `src/app/globals.css`**

1. Insert the 5 `--neo-cursor-*` custom properties generated by `serializeCursorThemeTokens('neo')` in `:root` (right after Tier 4 tokens) and `serializeCursorThemeTokens('overclock')` in `:root[data-theme='overclock']`.
2. Remove hardcoded `.neo-btn-tactile:is(:disabled, [aria-disabled='true']) { cursor: not-allowed; }` conflict OR let unlayered fine-pointer block cleanly set `var(--neo-cursor-not-allowed)` (keeping fallback keyword `not-allowed` when `@media (pointer: coarse)` / no hover). Keeping `cursor: not-allowed;` inside `.neo-btn-tactile:disabled` AND overriding with unlayered `var(--neo-cursor-not-allowed)` inside `@media (hover: hover) and (pointer: fine)` gives crisp behavior everywhere!
3. Add unlayered `@media (hover: hover) and (pointer: fine)` block before `@media (pointer: coarse)`:
   - `html, body { cursor: var(--neo-cursor-default); }`
   - `:where([data-cursor='crosshair']) { cursor: var(--neo-cursor-crosshair); }`
   - Prose & inputs -> `var(--neo-cursor-text)`
   - Interactive controls & `[data-cursor='pointer']` (`:not(:disabled, [aria-disabled='true'])`) -> `var(--neo-cursor-pointer)` + descendant `cursor: inherit`
   - Disabled controls (`:disabled, [aria-disabled='true'], .neo-btn-tactile:is(:disabled, [aria-disabled='true']), .cursor-not-allowed`) -> `var(--neo-cursor-not-allowed)` + descendant `cursor: inherit`
4. In `@media (forced-colors: active)`, reset all 5 `--neo-cursor-*` variables on `:root, :root[data-theme='overclock']` to native system keywords.

- [ ] **Step 4: Run test & Next.js CSS build check to verify it passes cleanly**

Run: `npx.cmd vitest run src/lib/__tests__/neoCursorStylesheet.test.ts`
Run: `npm.cmd run build`
Expected: Both PASS (`exit 0`, LightningCSS parses all inline cursor SVGs without error).

- [ ] **Step 5: Commit Task 2**

```bash
git add src/app/globals.css src/lib/__tests__/neoCursorStylesheet.test.ts
git commit -m "feat(cursor): wire theme-aware SVG cursor tokens and accessibility guards in globals.css"
```

---

### Task 3: Sync `GustoWorldEngine` 3D Raycast Hover & `GustoCanvasStage` via `data-cursor`

**Files:**
- Modify: `src/engine/GustoWorldEngine.ts:472-538, 818-875`
- Modify: `src/components/three/GustoCanvasStage.tsx:279`
- Test: `src/engine/__tests__/GustoWorldEngine.test.ts`

**Interfaces:**
- Consumes: `data-cursor="crosshair"` & `data-cursor="pointer"` CSS selectors from `src/app/globals.css`.
- Produces:
  - `export type StageCursorState = 'crosshair' | 'pointer';`
  - `export function applyContainerCursorState(container: HTMLElement | null | undefined, state: StageCursorState | null): void`

- [ ] **Step 1: Write the failing unit tests in `src/engine/__tests__/GustoWorldEngine.test.ts`**

Add tests importing `applyContainerCursorState`:
1. Sets `container.dataset.cursor = 'crosshair'` or `'pointer'` when `state` is non-null, and removes `container.dataset.cursor` when `state === null`.
2. Leaves `container.style.cursor` untouched (empty string) so inline cursor styles never shadow theme SVG cursors.
3. Safely no-ops without throwing when `container` is `null`, `undefined`, or a minimal mock `{}` lacking `.dataset` (preserving headless test safety).
4. Verify `GustoWorldEngine.dispose()` clears `container.dataset.cursor` when `dataset` exists on the container.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/engine/__tests__/GustoWorldEngine.test.ts`
Expected: FAIL (`applyContainerCursorState` is not exported from `../GustoWorldEngine`).

- [ ] **Step 3: Update `src/engine/GustoWorldEngine.ts` and `src/components/three/GustoCanvasStage.tsx`**

1. Export `StageCursorState` and `applyContainerCursorState(container, state)` in `src/engine/GustoWorldEngine.ts`.
2. In constructor / initial setup (when `container.dataset` exists): set initial `applyContainerCursorState(this.container, 'crosshair')`.
3. In `handlePointerLeave`: replace `this.container.style.cursor = 'default'` with `applyContainerCursorState(this.container, 'crosshair')` (always reset to `'crosshair'` on leave even if not hovering a satellite, or when exiting interactive hit!). Actually: calling `applyContainerCursorState(this.container, 'crosshair')` unconditionally in `handlePointerLeave` guarantees the 3D core cursor never stays stuck on `'pointer'` either!
4. In `updateRaycastHover`: replace `this.container.style.cursor = isInteractiveHit ? 'pointer' : 'default'` with `applyContainerCursorState(this.container, isInteractiveHit ? 'pointer' : 'crosshair')`.
5. In `dispose()`: call `applyContainerCursorState(this.container, null)`.
6. In `src/components/three/GustoCanvasStage.tsx:279`: add `data-cursor="crosshair"` on `<div ref={containerRef} data-cursor="crosshair" className="h-full w-full" />` so the 3D viewport gets the targeting reticle even before the first raycast frame.

- [ ] **Step 4: Run unit tests, full suite, typecheck, lint, and production build**

Run:
- `npx.cmd vitest run src/engine/__tests__/GustoWorldEngine.test.ts`
- `npm.cmd run test`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`
Expected: All commands exit `0` with zero failures, zero TypeScript errors, and zero ESLint warnings.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/engine/GustoWorldEngine.ts src/components/three/GustoCanvasStage.tsx src/engine/__tests__/GustoWorldEngine.test.ts
git commit -m "feat(cursor): sync GustoWorldEngine 3D raycast hover via data-cursor attribute"
```
