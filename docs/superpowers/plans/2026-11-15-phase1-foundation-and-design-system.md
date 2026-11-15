# Phase 1: Project Setup, Next.js Architecture & Friendly Neo-Brutalist Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the Next.js App Router TypeScript workspace in `c:\Users\User\Documents\my-website`, establish the Friendly Neo-Brutalist Design System (`globals.css` + typography + Overclock theme tokens), create the complete zero-placeholder typed portfolio data layer for Hattakorn Pongsawai (`MoLerSTH`), and build reusable Neo-Brutalist UI primitives verified by an Interactive Design System & Architecture Showcase shell.

**Architecture:** Next.js (App Router, TypeScript strict mode, Tailwind CSS) paired with CSS custom properties for Friendly Neo-Brutalism (`#FFFFFF`/`#F8F9FA` canvas, `#E5E7EB` architectural grid, `3px solid #0A0A0A` borders, `6px 6px 0px #0A0A0A` offset shadows, and `[data-theme="overclock"]` Blueprint/Wireframe override tokens). All portfolio content for Gusto is centralized in `src/data/portfolioData.ts` with strict TypeScript interfaces and consumed by modular primitives in `src/components/ui/NeoBrutalPrimitives.tsx`.

**Tech Stack:** Next.js 15/16 (App Router), React 19, TypeScript 5, Tailwind CSS, Three.js (`three`, `@types/three`), GSAP (`gsap`), Lucide React (`lucide-react`), `clsx`, `tailwind-merge`, Vitest (for unit verification of data and primitives).

**Spec:** `docs/superpowers/specs/2026-11-15-gusto-3d-portfolio-design.md`

## Global Constraints

- **Full Name:** `Hattakorn Pongsawai` | **Alias:** `Gusto` | **GitHub:** `MoLerSTH` | **Email:** `hattakorn49@gmail.com`
- **Education:** `3rd-Year B.Eng. in Software Engineering (TEP/TEPE Program), Thammasat University`
- **Primary Canvas:** Crisp Pure White (`#FFFFFF`) & Off-White (`#F8F9FA`) with subtle architectural grid lines (`#E5E7EB`).
- **Ink & Borders:** Pitch Black (`#0A0A0A`) with thick borders (`3px solid #0A0A0A`) and hard offset shadows (`6px 6px 0px #0A0A0A`).
- **Vibrant Playful Accents:** Electric Yellow (`#FFE600`), Cyber Mint (`#00F5D4`), Coral Pop (`#FF5D8F`), and Cobalt Blue (`#3A86FF`).
- **Typography:** Bold geometric display font (`Space Grotesk`) paired with crisp monospace (`JetBrains Mono`) for terminal logs and technical specs.
- **Tactile Micro-Interactions:** Buttons physically depress into their hard shadows on hover/click (`translate(4px, 4px)`).
- **Zero Placeholders:** Every project, experience item, and tech stack badge must contain real, production-grade copy for Gusto.

## Review Focus

1. **Missing or placeholder portfolio entries:** All 3 Featured Projects (`GISTDA Satellite Cal-Val System`, `KBTG Kampus Hackathon 2026 — Anti-Scam Risk Engine`, `RoPA2077 / Assignier AI`) and all 3 additional Vault Projects (`ASR Lab LLM-to-Web Interface`, `Animal-Collection`, `6-String Web Audio Bass & Multiplayer Electron Piano`) must be present with non-empty descriptions, tech stacks, and 3D node bindings.
2. **Theme token reactivity for Overclock Mode:** Toggling `data-theme="overclock"` on `document.documentElement` must cleanly switch CSS variables from the white Neo-Brutalist palette to the high-contrast Blueprint/Wireframe dimension without breaking border or shadow visibility.
3. **Keyboard accessibility on tactile primitives:** `NeoButton` and interactive `NeoCard` elements must support keyboard focus (`:focus-visible`) and `disabled` states without still depressing into shadows when disabled.
4. **SSR hydration safety in Next.js App Router:** Client interactive primitives (`NeoNavbar` audio/overclock state toggles) must render deterministically on the server without `window`/`sessionStorage` hydration mismatches.
5. **Strict TypeScript compilation (`tsc --noEmit`):** All Three.js, GSAP, and React component types must pass strict type-checking with zero errors.

---

### Task 1: Next.js App Router Scaffolding & Dependency Installation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/lib/utils.ts`
- Test: `src/lib/__tests__/utils.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` in `src/lib/utils.ts`

- [ ] **Step 1: Initialize Next.js project and install runtime + test dependencies**

Run in `c:\Users\User\Documents\my-website`:
```powershell
npm init -y
npm install next react react-dom three gsap lucide-react clsx tailwind-merge
npm install -D typescript @types/node @types/react @types/react-dom @types/three tailwindcss @tailwindcss/postcss postcss vitest
```
Expected: `added ... packages` with exit code `0`.

- [ ] **Step 2: Configure `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, and `vitest.config.ts`**

Create `tsconfig.json` with `"strict": true` and `@/*` path alias mapped to `./src/*`, `next.config.ts` with React strict mode enabled, `postcss.config.mjs` with `@tailwindcss/postcss`, and `vitest.config.ts` with `@` alias resolution.

- [ ] **Step 3: Write the failing test for `cn()` class utility in `src/lib/__tests__/utils.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
  it('merges Tailwind classes and resolves conflicts deterministically', () => {
    expect(cn('px-4 py-2 bg-[#FFE600]', false && 'hidden', 'px-6')).toBe('py-2 bg-[#FFE600] px-6');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/utils.test.ts`
Expected: FAIL with cannot find module `../utils`

- [ ] **Step 5: Implement `cn(...inputs: ClassValue[]): string` in `src/lib/utils.ts`**

Combine `clsx` and `tailwind-merge` to return conflict-free class strings.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/utils.test.ts`
Expected: PASS (`1 passed`)

---

### Task 2: Complete Zero-Placeholder Portfolio Data Layer (`src/data/portfolioData.ts`)

**Files:**
- Create: `src/data/portfolioData.ts`
- Test: `src/data/__tests__/portfolioData.test.ts`

**Interfaces:**
- Produces:
  - `export type AccentColor = 'yellow' | 'mint' | 'coral' | 'cobalt'`
  - `export interface ProjectItem { id: string; slug: string; title: string; subtitle: string; category: 'BACKEND & SATELLITE' | 'AI & FINTECH SECURITY' | 'FULLSTACK & AI PIPELINE' | 'LLM & RESEARCH' | 'MOBILE & OFFLINE-FIRST' | 'WEB AUDIO & CREATIVE TECH'; featured: boolean; highlightOrder?: 1 | 2 | 3; orbitalNodeLabel?: string; accent: AccentColor; period: string; role: string; summary: string; architectureHighlights: string[]; metrics: { label: string; value: string }[]; techStack: string[]; githubUrl: string; liveUrl?: string; }`
  - `export interface ExperienceItem { id: string; title: string; organization: string; type: 'INTERNSHIP' | 'HACKATHON' | 'COMPETITION'; period: string; location: string; accent: AccentColor; summary: string; achievements: string[]; techTags: string[]; }`
  - `export interface TechSkillCategory { id: string; category: string; code: string; accent: AccentColor; skills: { name: string; role: string; level: string; core: boolean }[]; }`
  - `export const GUSTO_PROFILE`
  - `export const PROJECTS_DATA: ProjectItem[]`
  - `export const FEATURED_PROJECTS: ProjectItem[]`
  - `export const EXPERIENCE_TIMELINE: ExperienceItem[]`
  - `export const TECH_STACK_MATRIX: TechSkillCategory[]`

- [ ] **Step 1: Write the failing data integrity test in `src/data/__tests__/portfolioData.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  GUSTO_PROFILE,
  PROJECTS_DATA,
  FEATURED_PROJECTS,
  EXPERIENCE_TIMELINE,
  TECH_STACK_MATRIX,
} from '../portfolioData';

describe('Gusto Portfolio Data Layer Integrity', () => {
  it('contains exact core identity and contact fields for Hattakorn Pongsawai (Gusto)', () => {
    expect(GUSTO_PROFILE.fullName).toBe('Hattakorn Pongsawai');
    expect(GUSTO_PROFILE.alias).toBe('Gusto');
    expect(GUSTO_PROFILE.githubHandle).toBe('MoLerSTH');
    expect(GUSTO_PROFILE.email).toBe('hattakorn49@gmail.com');
    expect(GUSTO_PROFILE.university).toContain('Thammasat University');
  });

  it('provides exactly 3 Featured Highlight Projects in order and 6 total vault projects', () => {
    expect(FEATURED_PROJECTS).toHaveLength(3);
    expect(FEATURED_PROJECTS[0].title).toContain('GISTDA Satellite Cal-Val');
    expect(FEATURED_PROJECTS[1].title).toContain('KBTG Kampus Hackathon 2026');
    expect(FEATURED_PROJECTS[2].title).toContain('RoPA2077 / Assignier AI');
    expect(PROJECTS_DATA.length).toBeGreaterThanOrEqual(6);
  });

  it('includes internships and competitive builder hackathons with zero empty fields', () => {
    expect(EXPERIENCE_TIMELINE.length).toBeGreaterThanOrEqual(6);
    expect(TECH_STACK_MATRIX.flatMap((c) => c.skills.map((s) => s.name))).toEqual(
      expect.arrayContaining(['Python', 'FastAPI', 'Java', 'Spring Boot', 'Next.js', 'Three.js', 'PostgreSQL', 'Docker', 'Linux'])
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/portfolioData.test.ts`
Expected: FAIL with cannot find module `../portfolioData`

- [ ] **Step 3: Implement `src/data/portfolioData.ts` with 100% complete content for Gusto**

Populate `GUSTO_PROFILE`, `PROJECTS_DATA` (all 6 projects including `GISTDA Satellite Cal-Val System`, `KBTG Kampus Hackathon 2026 — Anti-Scam Risk Engine`, `RoPA2077 / Assignier AI`, `ASR Lab LLM-to-Web Interface`, `Animal-Collection`, `6-String Web Audio Bass & Multiplayer Electron Piano`), `EXPERIENCE_TIMELINE`, and `TECH_STACK_MATRIX`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/portfolioData.test.ts`
Expected: PASS (`3 passed`)

---

### Task 3: Friendly Neo-Brutalist Design System & Typography (`src/app/globals.css` & `src/app/layout.tsx`)

**Files:**
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`

**Interfaces:**
- Produces global CSS custom properties and utility classes:
  - `--bg-canvas: #FFFFFF`, `--bg-surface: #F8F9FA`, `--grid-line: #E5E7EB`, `--ink: #0A0A0A`
  - `--accent-yellow: #FFE600`, `--accent-mint: #00F5D4`, `--accent-coral: #FF5D8F`, `--accent-cobalt: #3A86FF`
  - `[data-theme="overclock"]` Blueprint/Wireframe overrides (`--bg-canvas: #050B14`, `--bg-surface: #0A1628`, `--grid-line: rgba(0, 245, 212, 0.18)`, `--ink: #00F5D4`)
  - Classes: `.neo-grid-bg`, `.neo-border`, `.neo-shadow`, `.neo-shadow-sm`, `.neo-shadow-lg`, `.neo-btn-tactile`, `.neo-card-interactive`

- [ ] **Step 1: Author `src/app/globals.css` with Friendly Neo-Brutalist tokens, architectural grid, tactile button depression rules, and custom scrollbar/selection theming**

Ensure buttons use `transition: transform 120ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 120ms cubic-bezier(0.2, 0.8, 0.2, 1)` and physically depress via `transform: translate(4px, 4px)` with `box-shadow: 2px 2px 0px var(--ink)` on hover/active while respecting `:disabled` and `:focus-visible`.

- [ ] **Step 2: Author `src/app/layout.tsx` loading `Space Grotesk` and `JetBrains Mono` via `next/font/google` and configuring metadata for Hattakorn Pongsawai (Gusto)**

Bind `--font-display` (`Space_Grotesk`) and `--font-mono` (`JetBrains_Mono`) on `<html>` and apply `.neo-grid-bg` to `<body>`.

---

### Task 4: Modular Neo-Brutalist UI Primitives (`src/components/ui/NeoBrutalPrimitives.tsx`)

**Files:**
- Create: `src/components/ui/NeoBrutalPrimitives.tsx`
- Create: `src/components/ui/NeoNavbar.tsx`
- Test: `src/components/ui/__tests__/NeoBrutalPrimitives.test.ts`

**Interfaces:**
- Consumes: `cn` from `src/lib/utils.ts`, `AccentColor` from `src/data/portfolioData.ts`
- Produces:
  - `ACCENT_STYLES: Record<AccentColor | 'white' | 'dark', { bg: string; text: string; badgeBg: string; hex: string }>`
  - `NeoButton(props: NeoButtonProps): JSX.Element`
  - `NeoBadge(props: NeoBadgeProps): JSX.Element`
  - `NeoCard(props: NeoCardProps): JSX.Element`
  - `NeoSectionHeader(props: NeoSectionHeaderProps): JSX.Element`
  - `NeoNavbar(props: NeoNavbarProps): JSX.Element`

- [ ] **Step 1: Write unit tests for accent token mapping and primitive helpers in `src/components/ui/__tests__/NeoBrutalPrimitives.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { ACCENT_STYLES } from '../NeoBrutalPrimitives';

describe('NeoBrutalPrimitives design tokens', () => {
  it('maps all 4 vibrant playful accents plus white and dark to exact specification hex codes', () => {
    expect(ACCENT_STYLES.yellow.hex).toBe('#FFE600');
    expect(ACCENT_STYLES.mint.hex).toBe('#00F5D4');
    expect(ACCENT_STYLES.coral.hex).toBe('#FF5D8F');
    expect(ACCENT_STYLES.cobalt.hex).toBe('#3A86FF');
    expect(ACCENT_STYLES.white.hex).toBe('#FFFFFF');
    expect(ACCENT_STYLES.dark.hex).toBe('#0A0A0A');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/__tests__/NeoBrutalPrimitives.test.ts`
Expected: FAIL with cannot find module `../NeoBrutalPrimitives`

- [ ] **Step 3: Implement `src/components/ui/NeoBrutalPrimitives.tsx` and `src/components/ui/NeoNavbar.tsx`**

Implement `NeoButton` (supporting button and anchor modes, tactile depression, disabled guard, keyboard focus ring), `NeoBadge` (monospace pill with optional live pulse dot), `NeoCard` (3px solid `#0A0A0A` border, hard `6px 6px 0px #0A0A0A` offset shadow, optional `GUSTO_OS` window bar with traffic dots and header tag), `NeoSectionHeader` (index tag + bold geometric headline + subtitle), and `NeoNavbar` (top HUD bar with navigation links, `[AUDIO_SYNC: ON/OFF]` toggle slot, and `[OVERCLOCK_TEST]` preview toggle).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/__tests__/NeoBrutalPrimitives.test.ts`
Expected: PASS (`1 passed`)

---

### Task 5: Phase 1 App Shell, Interactive Design System Showcase & Autonomous Verification

**Files:**
- Create: `src/app/page.tsx`

**Interfaces:**
- Consumes: `GUSTO_PROFILE`, `FEATURED_PROJECTS`, `EXPERIENCE_TIMELINE`, `TECH_STACK_MATRIX` from `src/data/portfolioData.ts`, and all primitives from `src/components/ui/NeoBrutalPrimitives.tsx` & `src/components/ui/NeoNavbar.tsx`

- [ ] **Step 1: Implement `src/app/page.tsx` presenting the Phase 1 Foundation & Interactive Neo-Brutalist Architecture Shell**

Render the live `NeoNavbar`, Hero identity header for **Hattakorn Pongsawai (Gusto)**, interactive Neo-Brutalist primitive showcase (testing all 4 vibrant accents `#FFE600`, `#00F5D4`, `#FF5D8F`, `#3A86FF`, tactile buttons, OS window cards, live data preview of the 3 Featured Projects, Experience Timeline entries, Tech Stack tags, and an interactive Blueprint/Overclock theme toggle test).

- [ ] **Step 2: Run full unit test suite, TypeScript strict check, and Next.js production build**

Run:
```powershell
npx vitest run
npx tsc --noEmit
npm run build
```
Expected: All Vitest tests pass, `tsc --noEmit` exits with `0` errors, and `npm run build` succeeds with exit code `0`.
