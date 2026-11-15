# Phase 4: Interactive Portfolio Sections, 3D-Tilt Featured Cards & Full 6-Project Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Phase 1 section previews in `src/app/page.tsx` with production-grade, zero-placeholder interactive portfolio sections for Hattakorn Pongsawai (`Gusto` / `MoLerSTH`): Section 01 About & Systems Architecture Narrative (with searchable `<details>` Design System Lab), Section 02 3D-Tilt Featured Project Cards + Filterable 6-Project Engineering Vault & Native Top-Layer `<dialog>` Architecture Inspector, Section 03 Filterable Internships/Hackathons/ICPC Experience Timeline (with full achievements & locations), Section 04 Project-Cross-Referenced Tech Stack Matrix, and Section 05 Direct Comms Uplink with clipboard telemetry.

**Architecture:** Pure deterministic controllers in `src/lib/portfolioSectionControllers.ts` handle 3D card tilt math (from cached `DOMRect` bounds), multi-criteria project/experience/stack filtering, project-to-skill cross-indexing, and `<dialog>` light-dismiss hit-testing so every business rule is unit-tested in Node Vitest without DOM mocks. UI components apply Modern Web Guidance patterns: native `<dialog closedby="any">` opened via `showModal()` with `@starting-style` + `transition-behavior: allow-discrete` + `overlay` top-layer transitions (and Firefox/Safari `[data-closing]` + `pointerdown`/`pointerup` light-dismiss fallbacks), `overscroll-behavior: contain` scroll chaining prevention (without mutating `<html>`/`<body>` overflow), CSS custom properties (`--card-rx`, `--card-ry`) for compositor-only 3D tilt, `<details>` for find-in-page searchable disclosures, and `content-visibility: auto` with `contain-intrinsic-size` on below-the-fold sections.

**Tech Stack:** Next.js 16.4.6 (App Router), React 19.3.1, TypeScript 6 strict mode, Tailwind CSS v4, Lucide React (`lucide-react`), Vitest 5.1.0.

**Spec:** `docs/superpowers/specs/2026-11-15-gusto-3d-portfolio-design.md`

## Global Constraints

- **Full Name:** `Hattakorn Pongsawai` | **Alias:** `Gusto` | **GitHub:** `MoLerSTH` | **Email:** `hattakorn49@gmail.com`
- **Education:** `3rd-Year B.Eng. in Software Engineering (TEP/TEPE Program), Thammasat University`
- **Top 3 Featured Projects (3D-Tilt Cards + 3D Satellite Node Sync):** `GISTDA Satellite Cal-Val System` (`gistda-calval`), `KBTG Kampus Hackathon 2026 — Anti-Scam Risk Engine` (`kbtg-anti-scam`), `RoPA2077 / Assignier AI` (`ropa2077-assignier`).
- **Additional Vault Projects (6 Total in Vault Grid & Modal):** `ASR Lab LLM-to-Web Interface` (`asr-lab-llm-web`), `Animal-Collection` (`animal-collection-mobile`), `6-String Web Audio Bass & Multiplayer Electron Piano` (`web-audio-bass-piano`).
- **Friendly Neo-Brutalist Visual Language:** `#FFFFFF` / `#F8F9FA` canvas, `#E5E7EB` architectural grid, `3px solid #0A0A0A` borders, `6px 6px 0px #0A0A0A` hard offset shadows, `#FFE600`, `#00F5D4`, `#FF5D8F`, `#3A86FF` accents, tactile button depression physics, and automatic compatibility with `[data-theme="overclock"]`.
- **Modern Web Guidance Compliance:**
  - Native `<dialog>` opened with `showModal()` must NOT add redundant `role="dialog"`, `aria-modal`, manual focus traps, or manual focus-return code (`dialog` guide).
  - Never lock background scroll with `overflow: hidden` or `position: fixed` on `<html>` or `<body>`; use `dialog:modal { overscroll-behavior: contain; }` and `dialog::backdrop { overflow: hidden; overscroll-behavior: contain; }` (`prevent-page-scroll-under-modal-dialog` guide).
  - Never set `display` unconditionally on `<dialog>`; scope open styles to `dialog[open]` and support top-layer exit transitions via `supportsTopLayerExit()` + `[data-closing]` (`animate-to-from-top-layer` guide).
  - Apply `content-visibility: auto` paired with `contain-intrinsic-size` strictly to below-the-fold sections (`defer-rendering-heavy-content` & `interactions-in-complex-layouts` guides).

## Review Focus

1. **Synthetic Keyboard Click (`clientX === 0, clientY === 0`) or Text-Drag False Light-Dismiss on `<dialog>`:** Pressing `Enter` or `Space` on a button inside `<dialog>` fires a `click` event with `(0, 0)` coordinates, and dragging to select text inside the modal can release the pointer over the backdrop. The `closedby="any"` fallback must require *both* `pointerdown` and `pointerup` outside the dialog's `DOMRect` (`target === dialogEl`) and ignore non-positive/zero coordinates when `pointerType === ''` or `rect.width <= 0`.
2. **Layout Thrashing on 3D Card Pointer Move (INP):** Calling `getBoundingClientRect()` on every `pointermove` event forces synchronous layout recalculation. `ProjectTiltCard` must cache its `DOMRect` on `pointerenter` (and invalidate on passive `scroll`/`resize`) and pass tilt state via CSS custom properties (`--card-rx`, `--card-ry`).
3. **Reduced Motion & Disabled Tilt Clamping:** When `prefers-reduced-motion: reduce` is active (or pointer leaves the card), `computeCardTiltTransform` must return `0deg` rotations (`rotateXDeg: 0, rotateYDeg: 0`) and CSS 3D rotation must be scoped inside `@media (prefers-reduced-motion: no-preference)`.
4. **Top-Layer `<dialog>` Exit Cut-Off in Firefox/Safari & Unconditional `display` Override:** Unconditional `display: flex` or `display: block` on `<dialog>` breaks its closed state, and Firefox/Safari lack `overlay` + discrete `display` transitions. Open styles must be scoped to `dialog.neo-dialog[open]`, and `closeDialogWithTransition` must set `data-closing=""` and wait for `getAnimations({ subtree: true })` (capped by a timeout) before calling `dialog.close()`.
5. **Incomplete Experience or Vault Data Rendering:** Previously `src/app/page.tsx` omitted `exp.achievements`, `exp.location`, `project.subtitle`, `project.architectureHighlights`, and the 3 non-featured Vault projects (`asr-lab-llm-web`, `animal-collection-mobile`, `web-audio-bass-piano`). All 6 projects and all 6 experience entries (with full achievements and locations) must be filterable and inspectable.

---

### Task 1: Portfolio Section Pure Controllers (`src/lib/portfolioSectionControllers.ts`)

**Files:**
- Create: `src/lib/portfolioSectionControllers.ts`
- Test: `src/lib/__tests__/portfolioSectionControllers.test.ts`

**Interfaces:**
- Consumes:
  - `ProjectItem`, `ProjectCategory`, `ExperienceItem`, `TechSkillCategory`, `PROJECTS_DATA`, `EXPERIENCE_TIMELINE`, `TECH_STACK_MATRIX` from `src/data/portfolioData.ts`
- Produces:
  - `export interface RectLike { left: number; top: number; width: number; height: number; }`
  - `export interface CardTiltInput { clientX: number; clientY: number; rect: RectLike | null; maxTiltDeg?: number; prefersReducedMotion?: boolean; }`
  - `export interface CardTiltState { rotateXDeg: number; rotateYDeg: number; glareXPercent: number; glareYPercent: number; isActive: boolean; }`
  - `export type VaultCategoryFilter = ProjectCategory | 'ALL';`
  - `export interface VaultFilterInput { category?: VaultCategoryFilter; searchQuery?: string; onlyFeatured?: boolean; }`
  - `export type ExperienceFilterType = 'ALL' | ExperienceItem['type'];`
  - `export interface ExperienceTrackCounts { ALL: number; INTERNSHIP: number; HACKATHON: number; COMPETITION: number; }`
  - `export function computeCardTiltTransform(input: CardTiltInput): CardTiltState`
  - `export function isPointOutsideDialogRect(clientX: number, clientY: number, rect: RectLike | null): boolean`
  - `export function filterVaultProjects(projects: readonly ProjectItem[], filter?: VaultFilterInput): ProjectItem[]`
  - `export function filterExperienceTimeline(items: readonly ExperienceItem[], typeFilter?: ExperienceFilterType): ExperienceItem[]`
  - `export function computeExperienceTrackCounts(items: readonly ExperienceItem[]): ExperienceTrackCounts`
  - `export function buildSkillProjectMap(projects: readonly ProjectItem[], matrix: readonly TechSkillCategory[]): Record<string, ProjectItem[]>`

- [ ] **Step 1: Write the failing unit tests in `src/lib/__tests__/portfolioSectionControllers.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import {
  EXPERIENCE_TIMELINE,
  PROJECTS_DATA,
  TECH_STACK_MATRIX,
} from '@/data/portfolioData';
import {
  buildSkillProjectMap,
  computeCardTiltTransform,
  computeExperienceTrackCounts,
  filterExperienceTimeline,
  filterVaultProjects,
  isPointOutsideDialogRect,
} from '../portfolioSectionControllers';

describe('portfolioSectionControllers', () => {
  const sampleRect = { left: 100, top: 200, width: 400, height: 300 };

  it('computes bounded 3D card tilt angles and clamps reduced-motion or invalid rects to 0deg', () => {
    const center = computeCardTiltTransform({
      clientX: 300,
      clientY: 350,
      rect: sampleRect,
      maxTiltDeg: 8,
    });
    expect(center.rotateXDeg).toBeCloseTo(0, 3);
    expect(center.rotateYDeg).toBeCloseTo(0, 3);
    expect(center.glareXPercent).toBeCloseTo(50, 2);
    expect(center.glareYPercent).toBeCloseTo(50, 2);
    expect(center.isActive).toBe(true);

    const topLeft = computeCardTiltTransform({
      clientX: 100,
      clientY: 200,
      rect: sampleRect,
      maxTiltDeg: 8,
    });
    expect(topLeft.rotateXDeg).toBe(8);
    expect(topLeft.rotateYDeg).toBe(-8);

    const overflow = computeCardTiltTransform({
      clientX: -999,
      clientY: 9999,
      rect: sampleRect,
      maxTiltDeg: 6,
    });
    expect(Math.abs(overflow.rotateXDeg)).toBeLessThanOrEqual(6);
    expect(Math.abs(overflow.rotateYDeg)).toBeLessThanOrEqual(6);
    expect(overflow.glareXPercent).toBeGreaterThanOrEqual(0);
    expect(overflow.glareYPercent).toBeLessThanOrEqual(100);

    const reducedMotion = computeCardTiltTransform({
      clientX: 120,
      clientY: 220,
      rect: sampleRect,
      prefersReducedMotion: true,
    });
    expect(reducedMotion).toEqual({
      rotateXDeg: 0,
      rotateYDeg: 0,
      glareXPercent: 50,
      glareYPercent: 50,
      isActive: false,
    });

    const invalidRect = computeCardTiltTransform({
      clientX: Number.NaN,
      clientY: 250,
      rect: { left: 0, top: 0, width: 0, height: 0 },
    });
    expect(invalidRect.isActive).toBe(false);
    expect(invalidRect.rotateXDeg).toBe(0);
  });

  it('evaluates dialog backdrop outside-click bounds safely without false positives on zero rects or NaN', () => {
    expect(isPointOutsideDialogRect(250, 300, sampleRect)).toBe(false);
    expect(isPointOutsideDialogRect(99, 300, sampleRect)).toBe(true);
    expect(isPointOutsideDialogRect(501, 300, sampleRect)).toBe(true);
    expect(isPointOutsideDialogRect(250, 199, sampleRect)).toBe(true);
    expect(isPointOutsideDialogRect(250, 501, sampleRect)).toBe(true);

    expect(isPointOutsideDialogRect(10, 10, null)).toBe(false);
    expect(
      isPointOutsideDialogRect(10, 10, { left: 0, top: 0, width: 0, height: 0 })
    ).toBe(false);
    expect(isPointOutsideDialogRect(Number.NaN, 300, sampleRect)).toBe(false);
  });

  it('filters all 6 vault projects by category, featured flag, and search query', () => {
    expect(filterVaultProjects(PROJECTS_DATA)).toHaveLength(6);
    expect(
      filterVaultProjects(PROJECTS_DATA, { onlyFeatured: true })
    ).toHaveLength(3);
    expect(
      filterVaultProjects(PROJECTS_DATA, { category: 'MOBILE & OFFLINE-FIRST' }).map(
        (p) => p.id
      )
    ).toEqual(['animal-collection-mobile']);
    expect(
      filterVaultProjects(PROJECTS_DATA, { searchQuery: 'typhoon ocr' }).map(
        (p) => p.id
      )
    ).toEqual(['ropa2077-assignier']);
    expect(
      filterVaultProjects(PROJECTS_DATA, { searchQuery: 'theos-2' }).map(
        (p) => p.id
      )
    ).toEqual(['gistda-calval']);
  });

  it('filters experience timeline by track and computes exact track counts', () => {
    const counts = computeExperienceTrackCounts(EXPERIENCE_TIMELINE);
    expect(counts).toEqual({
      ALL: 6,
      INTERNSHIP: 2,
      HACKATHON: 3,
      COMPETITION: 1,
    });

    expect(
      filterExperienceTimeline(EXPERIENCE_TIMELINE, 'INTERNSHIP').map((e) => e.id)
    ).toEqual(['exp-gistda', 'exp-asr-lab']);
    expect(
      filterExperienceTimeline(EXPERIENCE_TIMELINE, 'COMPETITION').map((e) => e.id)
    ).toEqual(['exp-icpc']);
  });

  it('maps Tech Stack Matrix skills to the real projects in PROJECTS_DATA that use them', () => {
    const map = buildSkillProjectMap(PROJECTS_DATA, TECH_STACK_MATRIX);
    expect(map['FastAPI']?.map((p) => p.id)).toContain('gistda-calval');
    expect(map['FastAPI']?.map((p) => p.id)).toContain('kbtg-anti-scam');
    expect(map['Typhoon OCR']?.map((p) => p.id)).toEqual(['ropa2077-assignier']);
    expect(map['React Native']?.map((p) => p.id)).toEqual([
      'animal-collection-mobile',
    ]);
    expect(map['Web Audio API']?.map((p) => p.id)).toEqual([
      'web-audio-bass-piano',
    ]);
  });
});
```

- [ ] **Step 2: Run Vitest to verify the test fails**

Run: `npx.cmd vitest run src/lib/__tests__/portfolioSectionControllers.test.ts`
Expected: FAIL with `Cannot find module '../portfolioSectionControllers'`

- [ ] **Step 3: Implement `src/lib/portfolioSectionControllers.ts`**

Implement the pure functions with strict finite number guards:
- `computeCardTiltTransform`: if `prefersReducedMotion`, `!rect`, `rect.width <= 0`, `rect.height <= 0`, or non-finite coordinates, return `{ rotateXDeg: 0, rotateYDeg: 0, glareXPercent: 50, glareYPercent: 50, isActive: false }`. Otherwise compute normalized `nx = clamp01((clientX - rect.left) / rect.width)` and `ny = clamp01((clientY - rect.top) / rect.height)`, `rotateXDeg = Number(((0.5 - ny) * 2 * maxTilt).toFixed(2))`, `rotateYDeg = Number(((nx - 0.5) * 2 * maxTilt).toFixed(2))` (applying `0` fallback to avoid `-0`).
- `isPointOutsideDialogRect`: return `false` if `!rect`, `rect.width <= 0`, `rect.height <= 0`, or `!Number.isFinite(clientX)` / `!Number.isFinite(clientY)`; otherwise return `clientX < rect.left || clientX > rect.left + rect.width || clientY < rect.top || clientY > rect.top + rect.height`.
- `filterVaultProjects`: filter by `onlyFeatured`, `category !== 'ALL'`, and normalized lowercase `searchQuery` against `title`, `subtitle`, `summary`, `role`, `category`, `techStack`, and `metrics` (`label` + `value`).
- `filterExperienceTimeline` & `computeExperienceTrackCounts`: filter by `typeFilter` and tally counts across `ALL`, `INTERNSHIP`, `HACKATHON`, `COMPETITION`.
- `buildSkillProjectMap`: match each `skill.name` case-insensitively against `project.techStack`, `project.summary`, and `project.architectureHighlights`.

- [ ] **Step 4: Run Vitest to verify the tests pass**

Run: `npx.cmd vitest run src/lib/__tests__/portfolioSectionControllers.test.ts`
Expected: PASS (`5 passed`)

- [ ] **Step 5: Commit**

```bash
git add src/lib/portfolioSectionControllers.ts src/lib/__tests__/portfolioSectionControllers.test.ts
git commit -m "feat(phase-4): add pure controllers for 3D card tilt, vault filtering, and stack indexing"
```

---

### Task 2: Top-Layer `<dialog>` & 3D-Tilt CSS, `<ProjectTiltCard />`, and `<ProjectVaultModal />` (`src/app/globals.css`, `src/components/projects/ProjectTiltCard.tsx`, & `src/components/projects/ProjectVaultModal.tsx`)

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/projects/ProjectTiltCard.tsx`
- Create: `src/components/projects/ProjectVaultModal.tsx`
- Test: `src/components/projects/__tests__/ProjectVaultModal.test.ts`

**Interfaces:**
- Consumes:
  - `computeCardTiltTransform`, `isPointOutsideDialogRect`, `RectLike` from `src/lib/portfolioSectionControllers.ts`
  - `canTransitionDisplay` from `src/components/hero/TerminalBootOverlay.tsx`
  - `ProjectItem` from `src/data/portfolioData.ts`
  - `NeoBadge`, `NeoButton`, `NeoCard`, `ACCENT_STYLES` from `src/components/ui/NeoBrutalPrimitives.tsx`
- Produces:
  - `export interface ProjectTiltCardProps { project: ProjectItem; onInspectProject: (project: ProjectItem) => void; onFocusOrbitalNode?: (projectId: string) => void; }` in `src/components/projects/ProjectTiltCard.tsx`
  - `export interface ProjectVaultModalProps { project: ProjectItem | null; allProjects: readonly ProjectItem[]; onClose: () => void; onSelectProject: (project: ProjectItem) => void; }` in `src/components/projects/ProjectVaultModal.tsx`
  - `export function supportsTopLayerExit(): boolean` in `src/components/projects/ProjectVaultModal.tsx`
  - `export function closeDialogWithTransition(dialogEl: HTMLDialogElement | null, onClosed?: () => void, fallbackTimeoutMs?: number): Promise<void>` in `src/components/projects/ProjectVaultModal.tsx`
  - `export function resolveAdjacentProject(projects: readonly ProjectItem[], currentId: string, direction: 'prev' | 'next'): ProjectItem | null` in `src/components/projects/ProjectVaultModal.tsx`

- [ ] **Step 1: Write the failing unit tests in `src/components/projects/__tests__/ProjectVaultModal.test.ts`**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { PROJECTS_DATA } from '@/data/portfolioData';
import {
  closeDialogWithTransition,
  resolveAdjacentProject,
  supportsTopLayerExit,
} from '../ProjectVaultModal';

describe('ProjectVaultModal pure helpers', () => {
  it('returns false for supportsTopLayerExit in SSR / Node test environment', () => {
    expect(supportsTopLayerExit()).toBe(false);
  });

  it('cycles previous and next projects circularly across the 6-project vault', () => {
    const first = PROJECTS_DATA[0];
    const second = PROJECTS_DATA[1];
    const last = PROJECTS_DATA[PROJECTS_DATA.length - 1];

    expect(resolveAdjacentProject(PROJECTS_DATA, first.id, 'next')?.id).toBe(
      second.id
    );
    expect(resolveAdjacentProject(PROJECTS_DATA, first.id, 'prev')?.id).toBe(
      last.id
    );
    expect(resolveAdjacentProject(PROJECTS_DATA, last.id, 'next')?.id).toBe(
      first.id
    );
    expect(resolveAdjacentProject([], 'unknown', 'next')).toBeNull();
  });

  it('applies [data-closing], waits for subtree animations, and calls dialog.close() + onClosed', async () => {
    const attrs = new Map<string, string>();
    let closed = false;
    const onClosed = vi.fn();

    const mockDialog = {
      open: true,
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      hasAttribute: (k: string) => attrs.has(k),
      removeAttribute: (k: string) => attrs.delete(k),
      getAnimations: () => [
        {
          finished: new Promise<void>((resolve) => setTimeout(resolve, 10)),
        },
      ],
      close: () => {
        closed = true;
      },
    } as unknown as HTMLDialogElement;

    await closeDialogWithTransition(mockDialog, onClosed, 100);
    expect(closed).toBe(true);
    expect(attrs.has('data-closing')).toBe(false);
    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run Vitest to verify the test fails**

Run: `npx.cmd vitest run src/components/projects/__tests__/ProjectVaultModal.test.ts`
Expected: FAIL with `Cannot find module '../ProjectVaultModal'`

- [ ] **Step 3: Add top-level `.neo-dialog`, `.neo-tilt-card`, and `.neo-section-deferred` rules to `src/app/globals.css`**

Append top-level (unscoped) rules in `src/app/globals.css` following `dialog`, `animate-to-from-top-layer`, `prevent-page-scroll-under-modal-dialog`, and `defer-rendering-heavy-content`:
- `dialog.neo-dialog`: `opacity: 0; transition-property: opacity, transform, display, overlay; transition-duration: 240ms; transition-timing-function: ease-out; transition-behavior: allow-discrete;` (never set `display` unconditionally on `dialog.neo-dialog`).
- `:is(dialog.neo-dialog[open]):where(:not([data-closing]))`: `opacity: 1;` with `@starting-style { opacity: 0; }`, scale transform (`scale(0.95)` -> `scale(1)`) inside `@media (prefers-reduced-motion: no-preference)`, and `&::backdrop` transition.
- `dialog.neo-dialog:modal { overscroll-behavior: contain; }` and `dialog.neo-dialog::backdrop { overflow: hidden; overscroll-behavior: contain; background-color: rgb(10 10 10 / 0.68); backdrop-filter: blur(2px); transition-property: background-color, display, overlay; transition-duration: 240ms; transition-timing-function: ease-out; transition-behavior: allow-discrete; }`.
- `.neo-tilt-card`: smooth compositor-only `transform: perspective(950px) rotateX(var(--card-rx, 0deg)) rotateY(var(--card-ry, 0deg)); transition: transform 140ms ease-out;` scoped inside `@media (prefers-reduced-motion: no-preference)`.
- `.neo-section-deferred`: `content-visibility: auto; contain-intrinsic-size: auto none auto 640px;` with `@supports not (content-visibility: auto) { .neo-section-deferred { contain: layout style paint; } }`.

- [ ] **Step 4: Implement `src/components/projects/ProjectTiltCard.tsx` and `src/components/projects/ProjectVaultModal.tsx`**

- In `ProjectTiltCard.tsx`:
  - Cache `cardRef.current.getBoundingClientRect()` on `pointerenter` (and invalidate on passive `scroll`/`resize`), compute `--card-rx`, `--card-ry`, `--card-glare-x`, `--card-glare-y` via `computeCardTiltTransform` on `pointermove`, and reset on `pointerleave`.
  - Render `<NeoCard as="article" headerVariant={project.accent} windowTitle={project.orbitalNodeLabel ?? project.slug.toUpperCase()} windowTag={project.period}>` with category badge, `project.title`, `project.subtitle`, `project.role`, `project.summary`, 3 `project.metrics` cells, `project.architectureHighlights[0]` preview, full `project.techStack` tags, `[INSPECT ARCHITECTURE]` button (`onClick={() => onInspectProject(project)}`), and optional `[FOCUS 3D NODE]` button when `project.featured && onFocusOrbitalNode`.
- In `ProjectVaultModal.tsx`:
  - Render native `<dialog ref={dialogRef} aria-labelledby="vault-modal-title" className="neo-dialog ..." {...({ closedby: 'any' } as Record<string, string>)}>` without `role="dialog"` or `aria-modal`.
  - Open with `dialog.showModal()` when `project !== null`, intercept `cancel` event (`event.preventDefault(); void closeDialogWithTransition(...)`), and attach `pointerdown` + `pointerup` outside-bounds fallback via `isPointOutsideDialogRect` when `!('closedBy' in HTMLDialogElement.prototype)`.
  - Render full architecture breakdown (`architectureHighlights`, `metrics`, `techStack`, `role`, `period`, `githubUrl` external link, `[PREV PROJECT]` / `[NEXT PROJECT]` cyclic navigation via `resolveAdjacentProject`, and `autofocus` close button).

- [ ] **Step 5: Run Vitest to verify the tests pass**

Run: `npx.cmd vitest run src/components/projects/__tests__/ProjectVaultModal.test.ts`
Expected: PASS (`3 passed`)

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/components/projects/ProjectTiltCard.tsx src/components/projects/ProjectVaultModal.tsx src/components/projects/__tests__/ProjectVaultModal.test.ts
git commit -m "feat(projects): add 3D-tilt project card and native top-layer <dialog> architecture modal"
```

---

### Task 3: Interactive 6-Project Vault Section (`#projects`) & 3D Stage Inspection Bridge (`src/components/projects/ProjectsVaultSection.tsx` & `src/components/three/GustoCanvasStage.tsx`)

**Files:**
- Create: `src/components/projects/ProjectsVaultSection.tsx`
- Modify: `src/components/three/GustoCanvasStage.tsx`
- Test: `src/components/projects/__tests__/ProjectsVaultSection.test.ts`

**Interfaces:**
- Consumes:
  - `ProjectTiltCard` from `src/components/projects/ProjectTiltCard.tsx`
  - `ProjectVaultModal` from `src/components/projects/ProjectVaultModal.tsx`
  - `filterVaultProjects`, `VaultCategoryFilter` from `src/lib/portfolioSectionControllers.ts`
  - `PROJECTS_DATA`, `FEATURED_PROJECTS`, `ProjectItem` from `src/data/portfolioData.ts`
- Produces:
  - `export const GUSTO_INSPECT_PROJECT_EVENT = 'gusto:inspect-project'` in `src/components/projects/ProjectsVaultSection.tsx`
  - `export const GUSTO_FOCUS_3D_NODE_EVENT = 'gusto:focus-3d-node'` in `src/components/projects/ProjectsVaultSection.tsx`
  - `export function dispatchInspectProject(projectId: string): void` in `src/components/projects/ProjectsVaultSection.tsx`
  - `export function dispatchFocus3DNode(projectId: string): void` in `src/components/projects/ProjectsVaultSection.tsx`
  - `export function resolveProjectById(projects: readonly ProjectItem[], projectId: string | null | undefined): ProjectItem | null` in `src/components/projects/ProjectsVaultSection.tsx`
  - `export function ProjectsVaultSection(): JSX.Element` in `src/components/projects/ProjectsVaultSection.tsx`

- [ ] **Step 1: Write the failing unit tests in `src/components/projects/__tests__/ProjectsVaultSection.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import { PROJECTS_DATA } from '@/data/portfolioData';
import {
  dispatchFocus3DNode,
  dispatchInspectProject,
  resolveProjectById,
} from '../ProjectsVaultSection';

describe('ProjectsVaultSection helpers', () => {
  it('resolves any of the 6 projects by id and returns null for unknown ids', () => {
    expect(resolveProjectById(PROJECTS_DATA, 'gistda-calval')?.title).toContain(
      'GISTDA'
    );
    expect(
      resolveProjectById(PROJECTS_DATA, 'web-audio-bass-piano')?.title
    ).toContain('6-String');
    expect(resolveProjectById(PROJECTS_DATA, 'non-existent')).toBeNull();
    expect(resolveProjectById(PROJECTS_DATA, null)).toBeNull();
  });

  it('safely no-ops custom event dispatch in SSR / Node environments without window', () => {
    expect(() => dispatchInspectProject('gistda-calval')).not.toThrow();
    expect(() => dispatchFocus3DNode('kbtg-anti-scam')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run Vitest to verify the test fails**

Run: `npx.cmd vitest run src/components/projects/__tests__/ProjectsVaultSection.test.ts`
Expected: FAIL with `Cannot find module '../ProjectsVaultSection'`

- [ ] **Step 3: Implement `src/components/projects/ProjectsVaultSection.tsx` and wire `GustoCanvasStage.tsx` cross-section events**

- In `ProjectsVaultSection.tsx`:
  - Render `<section id="projects" aria-labelledby="heading-projects" className="neo-section-deferred space-y-10">`:
    1. Header bar with `<NeoSectionHeader indexCode="02 // FEATURED SYSTEMS & 6-PROJECT VAULT" headingId="heading-projects" ... />` and `[INSPECT FULL VAULT (6)]` CTA button.
    2. **Top 3 Featured Highlights Sub-Grid:** 3 `<ProjectTiltCard />` components for `FEATURED_PROJECTS` (`gistda-calval`, `kbtg-anti-scam`, `ropa2077-assignier`). Clicking `[FOCUS 3D NODE]` dispatches `dispatchFocus3DNode(project.id)` and scrolls smoothly to `#main-content`.
    3. **Full 6-Projects Engineering Vault Explorer:** Category filter buttons (`ALL`, `BACKEND & SATELLITE`, `AI & FINTECH SECURITY`, `FULLSTACK & AI PIPELINE`, `LLM & RESEARCH`, `MOBILE & OFFLINE-FIRST`, `WEB AUDIO & CREATIVE TECH`) with `aria-pressed`, paired with `<label htmlFor="vault-search-input">` + `<input id="vault-search-input" type="search">` and a 2-column responsive Vault grid displaying every matching project in `PROJECTS_DATA` with its metrics, architecture highlights preview, and `[OPEN ARCHITECTURE SPEC]` modal trigger.
    4. Listen for `GUSTO_INSPECT_PROJECT_EVENT` on `window` so external triggers (the 3D stage's `INSPECT CARD` button or Tech Stack Matrix project badges) open `<ProjectVaultModal />` directly to that project.
- In `src/components/three/GustoCanvasStage.tsx`:
  - Listen for `GUSTO_FOCUS_3D_NODE_EVENT` on `window` to focus/select that satellite node in `GustoWorldEngine`.
  - Update the `INSPECT CARD` button in the Active Satellite Project Inspector to invoke `dispatchInspectProject(activeProject.id)` so clicking it opens the project's deep specification in `#projects`.

- [ ] **Step 4: Run Vitest to verify the tests pass**

Run: `npx.cmd vitest run src/components/projects/__tests__/ProjectsVaultSection.test.ts`
Expected: PASS (`2 passed`)

- [ ] **Step 5: Commit**

```bash
git add src/components/projects/ProjectsVaultSection.tsx src/components/projects/__tests__/ProjectsVaultSection.test.ts src/components/three/GustoCanvasStage.tsx
git commit -m "feat(projects): add filterable 6-project vault section and 3D stage inspection bridge"
```

---

### Task 4: About & Architecture (`#architecture`), Experience Timeline (`#experience`), Tech Stack Matrix (`#stack`), Contact Uplink (`#contact`) & `page.tsx` Integration

**Files:**
- Create: `src/components/sections/AboutArchitectureSection.tsx`
- Create: `src/components/sections/ExperienceTimelineSection.tsx`
- Create: `src/components/sections/TechStackMatrixSection.tsx`
- Create: `src/components/sections/ContactUplinkSection.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/components/sections/__tests__/ContactUplinkSection.test.ts`

**Interfaces:**
- Consumes:
  - `GUSTO_PROFILE`, `EXPERIENCE_TIMELINE`, `TECH_STACK_MATRIX`, `PROJECTS_DATA` from `src/data/portfolioData.ts`
  - `filterExperienceTimeline`, `computeExperienceTrackCounts`, `buildSkillProjectMap`, `ExperienceFilterType` from `src/lib/portfolioSectionControllers.ts`
  - `dispatchInspectProject`, `ProjectsVaultSection` from `src/components/projects/ProjectsVaultSection.tsx`
  - `Phase1PrimitiveLab` from `src/components/phase1/Phase1PrimitiveLab.tsx`
- Produces:
  - `export function AboutArchitectureSection(): JSX.Element` in `src/components/sections/AboutArchitectureSection.tsx`
  - `export function ExperienceTimelineSection(): JSX.Element` in `src/components/sections/ExperienceTimelineSection.tsx`
  - `export function TechStackMatrixSection(): JSX.Element` in `src/components/sections/TechStackMatrixSection.tsx`
  - `export interface ClipboardWriterLike { writeText?: (text: string) => Promise<void>; }` in `src/components/sections/ContactUplinkSection.tsx`
  - `export function copyTextSafely(text: string, clipboard?: ClipboardWriterLike | null): Promise<boolean>` in `src/components/sections/ContactUplinkSection.tsx`
  - `export function ContactUplinkSection(): JSX.Element` in `src/components/sections/ContactUplinkSection.tsx`

- [ ] **Step 1: Write the failing unit test in `src/components/sections/__tests__/ContactUplinkSection.test.ts`**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { copyTextSafely } from '../ContactUplinkSection';

describe('ContactUplinkSection clipboard helper', () => {
  it('returns true when clipboard.writeText succeeds and false when missing or rejected', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(
      copyTextSafely('hattakorn49@gmail.com', { writeText })
    ).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hattakorn49@gmail.com');

    await expect(copyTextSafely('', { writeText })).resolves.toBe(false);
    await expect(copyTextSafely('hattakorn49@gmail.com', null)).resolves.toBe(
      false
    );

    const failingClipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
    };
    await expect(
      copyTextSafely('hattakorn49@gmail.com', failingClipboard)
    ).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run Vitest to verify the test fails**

Run: `npx.cmd vitest run src/components/sections/__tests__/ContactUplinkSection.test.ts`
Expected: FAIL with `Cannot find module '../ContactUplinkSection'`

- [ ] **Step 3: Implement the 4 section components and wire `src/app/page.tsx`**

- `src/components/sections/AboutArchitectureSection.tsx` (`#architecture`):
  - Renders `<section id="architecture" aria-labelledby="heading-architecture" className="space-y-8">` with `GUSTO_PROFILE.storyBody` (both paragraphs), academic & location dossier (`GUSTO_PROFILE.university`, `GUSTO_PROFILE.program`, `GUSTO_PROFILE.yearLevel`, `GUSTO_PROFILE.location`), 3 engineering discipline cards (`ASYNC BACKEND & GEOSPATIAL`, `REAL-TIME AI & RISK FORENSICS`, `PROCEDURAL WEBGL & AUDIO DSP`), and a native `<details className="neo-border bg-[var(--bg-surface)] neo-shadow-sm">` disclosure wrapping `<Phase1PrimitiveLab />` so the interactive Design System showcase remains find-in-page searchable (`search-hidden-content` guide).
- `src/components/sections/ExperienceTimelineSection.tsx` (`#experience`):
  - Renders `<section id="experience" aria-labelledby="heading-experience" className="neo-section-deferred space-y-8">` with track filter buttons (`ALL`, `INTERNSHIP`, `HACKATHON`, `COMPETITION`) using `computeExperienceTrackCounts` & `filterExperienceTimeline`, and renders each `ExperienceItem` with `title`, `organization`, `type`, `period`, `location`, `summary`, full `achievements` bullet list, and `techTags`.
- `src/components/sections/TechStackMatrixSection.tsx` (`#stack`):
  - Renders `<section id="stack" aria-labelledby="heading-stack" className="neo-section-deferred space-y-8">` with filter toggle (`ALL MODULES` vs `CORE ONLY`), renders `TECH_STACK_MATRIX` groups (`SYS_01`, `UI_02`, `OPS_03`), and attaches interactive project cross-reference buttons from `buildSkillProjectMap(PROJECTS_DATA, TECH_STACK_MATRIX)` that invoke `dispatchInspectProject(project.id)` and jump to `#projects`.
- `src/components/sections/ContactUplinkSection.tsx` (`#contact`):
  - Renders `<section id="contact" aria-labelledby="heading-contact" className="neo-section-deferred">` with direct `mailto:hattakorn49@gmail.com` CTA, `[COPY EMAIL]` button powered by `copyTextSafely(GUSTO_PROFILE.email, navigator.clipboard)` with polite status feedback, GitHub (`GUSTO_PROFILE.githubUrl`) and LinkedIn (`GUSTO_PROFILE.linkedinUrl`) links, and availability telemetry.
- `src/app/page.tsx`:
  - Replace the inline `#architecture`, `#projects`, `#experience`, `#stack`, and `#contact` blocks with `<AboutArchitectureSection />`, `<ProjectsVaultSection />`, `<ExperienceTimelineSection />`, `<TechStackMatrixSection />`, and `<ContactUplinkSection />`.

- [ ] **Step 4: Run full verification gate (`test`, `typecheck`, `lint`, `build`)**

Run:
```powershell
npm.cmd run test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run build
```
Expected: All 14 Vitest test files pass, `tsc --noEmit` exits `0`, `eslint .` exits `0` with 0 warnings, and `next build` succeeds with exit code `0`.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/AboutArchitectureSection.tsx src/components/sections/ExperienceTimelineSection.tsx src/components/sections/TechStackMatrixSection.tsx src/components/sections/ContactUplinkSection.tsx src/components/sections/__tests__/ContactUplinkSection.test.ts src/app/page.tsx docs/superpowers/plans/2026-11-15-phase4-portfolio-sections-and-vault.md
git commit -m "feat(phase-4): complete interactive portfolio sections, 6-project vault, and cross-referenced stack matrix"
```
