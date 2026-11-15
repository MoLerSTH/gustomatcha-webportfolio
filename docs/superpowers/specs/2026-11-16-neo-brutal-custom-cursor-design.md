# Neo-Brutalist Custom Cursor System Design (`Approach A`)

**Date:** 2026-11-16
**Scope:** Small Feature / Visual & Interaction System (`GUSTO_OS v2.6`)
**Target Themes:** Light Friendly Neo-Brutalist (`:root`) & Dark Overclock Blueprint (`:root[data-theme='overclock']`)

---

## 1. Intent & Why

Replace the browser's generic system pointer with a crisp, theme-matched **Friendly Neo-Brutalist** cursor suite (`default`, `pointer`, `crosshair`, `text`, `not-allowed`) that shifts cleanly into **Overclock Blueprint** mode (`#00F5D4` Cyber Mint / `#050b14` Blueprint Navy) with zero input latency, zero frame contention with the 60fps Three.js stage, and strict accessibility/device fallbacks.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- Render 5 tactile Neo-Brutalist cursor states as inline SVG data URIs (`32×32` CSS px, `%23`-escaped URLs, exact hotspot coordinates):
  1. **`default`** (`hotspot 4 2`): Bold Neo-Brutalist arrow (`#FFE600` Electric Yellow + `#0A0A0A` 2px stroke + hard offset drop silhouette; swaps to `#00F5D4` Cyber Mint + `#050b14` / crisp dark outline in Overclock mode).
  2. **`pointer`** (`hotspot 10 2`): Comic/Neo-Brutalist crisp pointing hand (`#FFFFFF` / `#FFE600` cuff + `#0A0A0A` border in light mode; `#050b14` / `#00F5D4` glow edge in Overclock mode) for links, buttons, summaries, `[role='button']`, `.cursor-pointer`, and 3D satellite hover.
  3. **`crosshair`** (`hotspot 16 16`): Precision GUSTO_OS targeting reticle scoped specifically to the 3D WebGL viewport (`[data-cursor='crosshair']`).
  4. **`text`** (`hotspot 16 16`): Sharp serifed I-beam matching the monospace/brutalist aesthetic for text inputs, `<textarea>`, `[contenteditable]`, and standalone prose blocks.
  5. **`not-allowed`** (`hotspot 16 16`): Coral Pop (`#FF5D8F`) + `#0A0A0A` slashed badge for `:disabled` and `[aria-disabled='true']` controls.
- Synchronize `GustoWorldEngine` 3D raycast hover states with CSS tokens via `container.dataset.cursor = isInteractiveHit ? 'pointer' : 'crosshair'` instead of inline `container.style.cursor` assignments that bypass stylesheet theme rules and media queries.

### Non-Goals
- No `cursor: none` hidden-native cursor hacks or fixed DOM cursor follower layers (`Approach B`/`C`).
- No per-frame JS cursor animation or extra network requests (`public/` SVG fetches avoided via inline `data:image/svg+xml`).

### Anti-Goals
- Cursor lag during fast sweeps across the Three.js WebGL canvas or heavy DOM sections.
- Inaccurate click hotspots (`x, y`) causing mis-clicks on small controls or 3D satellites.
- Broken system cursor legibility in Windows High Contrast (`forced-colors: active`) or unnecessary overrides on touch screens (`pointer: coarse`).
- Text inside interactive buttons/links turning into an I-beam on hover instead of holding the pointer state.

---

## 3. Approaches Considered

| Approach | Summary | Trade-offs | Decision |
| --- | --- | --- | --- |
| **A. Native CSS SVG Cursor Tokens (`url("data:image/svg+xml,...")`)** | CSS custom properties `--neo-cursor-*` per theme + `@media (hover: hover) and (pointer: fine)` rules + `data-cursor` attribute on 3D canvas | **0ms OS hardware cursor tracking**, works inside native `<dialog>` top-layer, zero JS/GPU overhead, automatic High Contrast fallback; no trailing ring animation | **Selected** |
| **B. Hybrid Native SVG + Viewport Reticle Overlay** | Keeps OS SVG arrow plus an extra GPU `transform` reticle overlay tracking `pointermove` | Richer HUD flair, but adds global `rAF` listener + top-layer z-index coordination issues on native `<dialog>` | Rejected (overweight for portfolio 3D canvas) |
| **C. Pure DOM Custom Cursor (`cursor: none`)** | Hides OS pointer and renders a DOM node with JS coordinates | Introduces frame latency vs OS pointer, breaks top-layer/scrollbar boundaries, degrades motor/low-vision accessibility | Rejected |

---

## 4. Architecture & Concrete Calls (Builder Scope)

1. **Pure Cursor Spec & Validator (`src/lib/neoCursors.ts`):**
   - Author SVG builders/definitions for both `neo` (light) and `overclock` (dark) palettes across `default`, `pointer`, `crosshair`, `text`, and `not-allowed`.
   - Enforce `32×32` canvas bounds, hotspot clamping `[0, 31]`, `%23` URL escaping (zero raw `#`), and CSS `url("...") <x> <y>, <fallback>` serialization.
   - Verify token parity directly against `src/app/globals.css` in Vitest (`src/lib/__tests__/neoCursors.test.ts`).
2. **Design Tokens & Cascade Rules (`src/app/globals.css`):**
   - Add `--neo-cursor-default`, `--neo-cursor-pointer`, `--neo-cursor-crosshair`, `--neo-cursor-text`, and `--neo-cursor-not-allowed` to `:root` and `:root[data-theme='overclock']`.
   - Guard all cursor bindings inside `@media (hover: hover) and (pointer: fine)` in unlayered stylesheet scope after Tailwind's `@import 'tailwindcss';` so custom tokens cleanly win over `@layer utilities` classes such as `.cursor-pointer` without relying on `!important` or `*` resets.
   - Enforce `:where(a:any-link, button, summary, [role='button'], .neo-btn-tactile, .cursor-pointer) * { cursor: inherit; }` (excluding nested disabled/input elements) so child text/icons never flicker to an I-beam, and override disabled controls to `var(--neo-cursor-not-allowed)`.
   - Reset `--neo-cursor-*` tokens to native keywords (`default`, `pointer`, `crosshair`, `text`, `not-allowed`) inside `@media (forced-colors: active)`.
3. **3D Viewport Cursor Sync (`src/engine/GustoWorldEngine.ts` & `src/components/three/GustoCanvasStage.tsx`):**
   - Set default `data-cursor="crosshair"` on the WebGL container in `GustoCanvasStage.tsx`.
   - Replace `this.container.style.cursor = ...` in `GustoWorldEngine.ts` (`handlePointerLeave` and `updateRaycastHover`) with a safe helper writing `this.container.dataset.cursor = isInteractiveHit ? 'pointer' : 'crosshair'`, and clean up `delete this.container.dataset.cursor` on `dispose()` (with null/mock-safe guards for Node/Vitest tests).

---

## 5. Modern Web Guidance Alignment

- **`css`**: Defines cursor states via semantic CSS custom properties per theme tier (`:root` / `[data-theme='overclock']`), avoids global `*` resets, uses `:where(...)` / `inherit`, and layers cleanly after Tailwind utilities.
- **`color`**: Restores OS-controlled cursor rendering under `@media (forced-colors: active)` instead of forcing author-colored cursors in High Contrast Mode.
- **`form-factor-adaptation`**: Gates pointer styling behind `@media (hover: hover) and (pointer: fine)` so coarse touch interfaces stay untouched.
- **`natural-interactions`**: Gives distinct visual cursor affordances across idle (`default`), clickable (`pointer`), 3D aiming (`crosshair`), text editing/reading (`text`), and disabled (`not-allowed`) states.
