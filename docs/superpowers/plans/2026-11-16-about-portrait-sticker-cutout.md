# Operator Portrait Sticker Cutout (`AboutArchitectureSection`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Gusto's cutout stage portrait (`public/images/gusto-portrait.webp`, `2400×1600` transparent WebP) into `AboutArchitectureSection` (`#architecture`) styled as a Friendly Neo-Brutalist die-cut sticker over an interactive brand-colored halftone stage (`#FFE600`, `#00F5D4`, `#FF5D8F`, `#3A86FF`) with Overclock Blueprint adaptation and zero layout shift (`CLS = 0`).

**Architecture:** Extend `GUSTO_PROFILE` in `src/data/portfolioData.ts` with typed portrait metadata (`GustoPortraitSpec`), add a pure backdrop-swatch controller and `<OperatorPortraitCard />` component in `src/components/sections/OperatorPortraitCard.tsx`, define die-cut sticker contour filters (`.neo-sticker-cutout`) and halftone dot stage styles (`.neo-sticker-stage`) in `src/app/globals.css`, and integrate the card into the 12-column dossier grid in `src/components/sections/AboutArchitectureSection.tsx`.

**Tech Stack:** Next.js 16 (`next/image`), React 19, TypeScript, Tailwind CSS v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-gusto-3d-portfolio-design.md`

## Global Constraints

- **Asset Path & Intrinsic Dimensions:** Source image is `/images/gusto-portrait.webp` (`2400×1600` px, `VP8X` WebP with alpha transparency, `88,806` bytes).
- **Zero LCP Contention (`optimize-image-priority`):** Because `#architecture` sits below the Hero 3D viewport, `<Image>` MUST use `loading="lazy"` and MUST omit `priority` and `fetchPriority` (`"For standard below-the-fold images, loading=\"lazy\" is sufficient to defer the request until the user scrolls near them. Avoid adding fetchpriority=\"low\" to these images"`).
- **Zero Cumulative Layout Shift (`responsive-design`):** Pass explicit `width={2400}` and `height={1600}` to `<Image>` inside a container with `aspect-ratio: 3 / 2` (`"Use aspect-ratio for media elements (like <img> and <video>) to reserve space during loading and prevent Cumulative Layout Shift (CLS)."`).
- **Accessible Naming & Alt Text (`accessibility`):** Wrap the portrait in semantic `<figure>` + `<figcaption>`, provide informative `alt` text describing the subject without `"Image of"` or `"Picture of"` prefixes (`"Don't use clichéd prefixes: Avoid terms like 'Image of…' and 'Picture of…'."`), and expose brand backdrop swatch buttons via `role="group"` + `aria-pressed`.
- **Theme & High-Contrast Parity (`dark-mode`, `color`):** Brand backdrop swatches (`#FFE600`, `#00F5D4`, `#FF5D8F`, `#3A86FF`), die-cut sticker outlines, and `.neo-filter-pill[aria-pressed='true']` controls must maintain >= 4.5:1 text contrast and >= 3:1 state contrast across default light mode, `:root[data-theme='overclock']`, and `@media (forced-colors: active)`.

## Review Focus

1. **Below-the-Fold Image Priority (`optimize-image-priority`):** Verify `<OperatorPortraitCard />` renders `/images/gusto-portrait.webp` with `loading="lazy"` and without `priority` or `fetchPriority`, keeping network bandwidth dedicated to the Hero 3D stage during initial load.
2. **Intrinsic Aspect Ratio & Flush Cutout Alignment (`responsive-design`):** Verify the `2400×1600` (`3:2`) cutout sits inside an `aspect-[3/2]` stage with `object-contain object-bottom` so the waist-up cutout rests flush against the bottom border without floating mid-air or causing CLS.
3. **Non-Cliché Accessible Alt Text (`accessibility`):** Verify `GUSTO_PROFILE.portrait.alt` is non-empty and never starts with `"image of"`, `"picture of"`, or `"photo of"` (pinned by unit tests in Task 1).
4. **Overclock & Forced-Colors Swatch Contrast (`dark-mode` & `color`):** Verify swatch toggle buttons use `.neo-filter-pill` + `aria-pressed` (inheriting `:root[data-theme='overclock']` and `@media (forced-colors: active)` highlight rules) and that the `.neo-sticker-stage` badge uses solid `#0A0A0A` ink on `#FFFFFF` / `#FFE600` surfaces.
5. **Defensive Swatch Resolution:** Verify `resolvePortraitBackdropSpec` safely falls back to the default `'yellow'` (`#FFE600`) brand backdrop if given an unexpected input at runtime (pinned by unit tests in Task 1).

---

### Task 1: Typed Portrait Spec in `portfolioData.ts` & Pure Sticker Swatch Controller

**Files:**
- Modify: `src/data/portfolioData.ts:65-109`
- Modify: `src/data/__tests__/portfolioData.test.ts:10-20`
- Create: `src/components/sections/OperatorPortraitCard.tsx`
- Create: `src/components/sections/__tests__/OperatorPortraitCard.test.ts`

**Interfaces:**
- Produces in `src/data/portfolioData.ts`:
  ```ts
  export interface GustoPortraitSpec {
    src: string;
    width: number;
    height: number;
    alt: string;
    caption: string;
    badgeLabel: string;
    defaultBackdrop: AccentColor;
  }
  ```
  (Added as `portrait: GustoPortraitSpec` on `GustoProfile` and `GUSTO_PROFILE`.)
- Produces in `src/components/sections/OperatorPortraitCard.tsx`:
  ```ts
  export interface PortraitBackdropSwatch {
    accent: AccentColor;
    label: string;
    shortCode: string;
    hex: string;
    stageBgClass: string;
  }

  export const PORTRAIT_BACKDROP_SWATCHES: readonly PortraitBackdropSwatch[];
  export function resolvePortraitBackdropSpec(
    accent?: AccentColor | string | null,
  ): PortraitBackdropSwatch;
  export function OperatorPortraitCard(): React.JSX.Element;
  ```

- [ ] **Step 1: Write failing tests in `src/data/__tests__/portfolioData.test.ts` and `src/components/sections/__tests__/OperatorPortraitCard.test.ts`**

Add to `src/data/__tests__/portfolioData.test.ts`:
```ts
  it('defines intrinsic 2400x1600 WebP portrait metadata with non-cliche alt text', () => {
    expect(GUSTO_PROFILE.portrait.src).toBe('/images/gusto-portrait.webp');
    expect(GUSTO_PROFILE.portrait.width).toBe(2400);
    expect(GUSTO_PROFILE.portrait.height).toBe(1600);
    expect(GUSTO_PROFILE.portrait.defaultBackdrop).toBe('yellow');
    expect(GUSTO_PROFILE.portrait.alt.length).toBeGreaterThan(20);
    expect(GUSTO_PROFILE.portrait.alt.toLowerCase()).not.toMatch(
      /^(image|picture|photo) of\b/,
    );
  });
```

Create `src/components/sections/__tests__/OperatorPortraitCard.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  PORTRAIT_BACKDROP_SWATCHES,
  resolvePortraitBackdropSpec,
} from '../OperatorPortraitCard';

describe('OperatorPortraitCard backdrop swatch controller', () => {
  it('exposes all 4 Friendly Neo-Brutalist brand backdrop swatches in order', () => {
    expect(PORTRAIT_BACKDROP_SWATCHES.map((s) => s.accent)).toEqual([
      'yellow',
      'mint',
      'coral',
      'cobalt',
    ]);
    expect(PORTRAIT_BACKDROP_SWATCHES.map((s) => s.hex)).toEqual([
      '#FFE600',
      '#00F5D4',
      '#FF5D8F',
      '#3A86FF',
    ]);
  });

  it('resolves requested brand swatch and falls back safely to yellow (#FFE600)', () => {
    expect(resolvePortraitBackdropSpec('mint').hex).toBe('#00F5D4');
    expect(resolvePortraitBackdropSpec('coral').shortCode).toBe('CORAL');
    expect(resolvePortraitBackdropSpec('unknown').accent).toBe('yellow');
    expect(resolvePortraitBackdropSpec(null).hex).toBe('#FFE600');
  });
});
```

- [ ] **Step 2: Run Vitest to verify RED failure**

Run: `npx.cmd vitest run src/data/__tests__/portfolioData.test.ts src/components/sections/__tests__/OperatorPortraitCard.test.ts`
Expected: FAIL (`Cannot find module '../OperatorPortraitCard'` and `Cannot read properties of undefined (reading 'src')`).

- [ ] **Step 3: Add `portrait` to `src/data/portfolioData.ts` and implement `src/components/sections/OperatorPortraitCard.tsx`**

- In `src/data/portfolioData.ts`, add `GustoPortraitSpec` and populate `GUSTO_PROFILE.portrait`:
  - `src: '/images/gusto-portrait.webp'`
  - `width: 2400`
  - `height: 1600`
  - `alt: 'Hattakorn Pongsawai (Gusto) presenting on stage with a microphone and slide clicker'`
  - `caption: 'STAGE_CAPTURE // LIVE ARCHITECTURE & AI SYSTEMS PITCH'`
  - `badgeLabel: 'STICKER_CUTOUT // VERIFIED'`
  - `defaultBackdrop: 'yellow'`
- In `src/components/sections/OperatorPortraitCard.tsx`:
  - Export `PORTRAIT_BACKDROP_SWATCHES` (`yellow` `#FFE600`, `mint` `#00F5D4`, `coral` `#FF5D8F`, `cobalt` `#3A86FF`) and `resolvePortraitBackdropSpec`.
  - Render a `<NeoCard variant="white" headerVariant={activeSwatch.accent} windowTitle="OPERATOR_PORTRAIT // GUSTO.WEBP" windowTag={activeSwatch.shortCode}>` wrapping:
    - `<figure className="space-y-3">`:
      - Stage container `<div className={cn('neo-border neo-sticker-stage relative aspect-[3/2] w-full overflow-hidden', activeSwatch.stageBgClass)} data-backdrop={activeSwatch.accent}>`
      - Corner status chip (`GUSTO_PROFILE.portrait.badgeLabel`) with `#0A0A0A` ink on `#FFFFFF` surface + solid border
      - `<Image src={portrait.src} alt={portrait.alt} width={portrait.width} height={portrait.height} loading="lazy" sizes="(min-width: 1024px) 440px, (min-width: 640px) 600px, 100vw" className="neo-sticker-cutout relative z-10 h-full w-full object-contain object-bottom select-none" />`
      - `<figcaption>` paired with a `<div role="group" aria-label="Select brand background color for portrait sticker">` containing the 4 `.neo-btn-tactile .neo-filter-pill` swatch buttons (`aria-pressed={activeAccent === swatch.accent}`) with a visible color square (`aria-hidden="true"`) + shortCode text.

- [ ] **Step 4: Run Vitest to verify GREEN**

Run: `npx.cmd vitest run src/data/__tests__/portfolioData.test.ts src/components/sections/__tests__/OperatorPortraitCard.test.ts`
Expected: PASS (`2 passed (2)` test files).

- [ ] **Step 5: Commit Task 1**

```bash
git add public/images/gusto-portrait.webp src/data/portfolioData.ts src/data/__tests__/portfolioData.test.ts src/components/sections/OperatorPortraitCard.tsx src/components/sections/__tests__/OperatorPortraitCard.test.ts
git commit -m "feat(about): add portrait metadata and OperatorPortraitCard sticker component"
```

---

### Task 2: Die-Cut Sticker & Halftone Stage CSS (`globals.css`) + `AboutArchitectureSection.tsx` Integration

**Files:**
- Modify: `src/app/globals.css:405-415`
- Modify: `src/components/sections/AboutArchitectureSection.tsx:1-149`

**Interfaces:**
- Consumes: `OperatorPortraitCard` from `@/components/sections/OperatorPortraitCard`
- Produces: `.neo-sticker-stage` and `.neo-sticker-cutout` CSS classes in `src/app/globals.css`, and integrated 12-column dossier + sticker portrait layout in `src/components/sections/AboutArchitectureSection.tsx`.

- [ ] **Step 1: Add `.neo-sticker-stage` and `.neo-sticker-cutout` rules in `src/app/globals.css`**

- Define `.neo-sticker-stage` with a subtle Neo-Brutalist radial halftone dot pattern (`::before` using `radial-gradient(rgba(10, 10, 10, 0.18) 1.5px, transparent 1.5px)` at `background-size: 14px 14px`, `pointer-events: none`).
- Define `.neo-sticker-cutout` with a multi-directional white vinyl sticker outline + hard offset drop shadow:
  ```css
  .neo-sticker-cutout {
    filter:
      drop-shadow(3px 0 0 #ffffff)
      drop-shadow(-3px 0 0 #ffffff)
      drop-shadow(0 -3px 0 #ffffff)
      drop-shadow(2px 2px 0 #0a0a0a)
      drop-shadow(-2px -2px 0 #0a0a0a)
      drop-shadow(5px 6px 0 #0a0a0a);
    transition: transform 180ms ease-out;
  }
  ```
- Under `:root[data-theme='overclock']`: adjust `.neo-sticker-cutout` outer drop-shadow to incorporate cyber-mint accent (`rgba(0, 245, 212, 0.65)`) so the sticker frame pops cleanly in Overclock Mode.
- Under `@media (prefers-reduced-motion: reduce)`: disable `transition` on `.neo-sticker-cutout`.

- [ ] **Step 2: Integrate `<OperatorPortraitCard />` into `src/components/sections/AboutArchitectureSection.tsx`**

- Import `OperatorPortraitCard` in `src/components/sections/AboutArchitectureSection.tsx`.
- In the top `<div className="grid gap-6 lg:grid-cols-12">`:
  - Keep `OPERATOR_DOSSIER // @MoLerSTH` in `lg:col-span-7` and place the `// ARCHITECTURE_GUARANTEE` terminal callout inside the bottom of `OPERATOR_DOSSIER` so the narrative and architectural guarantee read as one cohesive dossier card.
  - Wrap the right column (`lg:col-span-5 flex flex-col gap-6`) containing `<OperatorPortraitCard />` on top and `ACADEMIC_NODE // TU_SE` below so both columns align in height on desktop and stack cleanly (`Dossier -> Portrait Sticker -> Academic Node`) on mobile.

- [ ] **Step 3: Run Full Verification Gate (`test`, `typecheck`, `lint`, `build`)**

Run:
```powershell
npm.cmd run test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run build
```
Expected: All `19/19` Vitest test files pass, `tsc --noEmit` exits `0`, `eslint .` exits `0` (0 warnings), and `next build` exits `0`.

- [ ] **Step 4: Commit Task 2**

```bash
git add src/app/globals.css src/components/sections/AboutArchitectureSection.tsx docs/superpowers/plans/2026-11-16-about-portrait-sticker-cutout.md
git commit -m "feat(about): integrate sticker cutout portrait card and halftone brand stage"
```
