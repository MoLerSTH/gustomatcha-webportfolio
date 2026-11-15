# Four High-Impact Web Intro Variations (`GUSTO_OS v2.6`) Design Specification

**Date:** 2026-11-16  
**Base Branch:** `feat/about-portrait-sticker`  
**Target Branches:**
1. `feat/intro-1-orbital-drop` — **Orbital Drop // Satellite Lock-On**
2. `feat/intro-2-blueprint-printer` — **Architectural Blueprint Printer**
3. `feat/intro-3-kinetic-slam` — **Kinetic Brutalist Slam // Overclock Burst**
4. `feat/intro-4-pixel-shatter` — **System Shatter // Pixel Mosaic Collapse**

---

## 1. Goal & Multi-Branch Evaluation Strategy

Build all four web intro concepts in four independent Git branches forked from the shared base commit on `feat/about-portrait-sticker`. Each branch upgrades `TerminalBootOverlay.tsx`, `HeroSection.tsx` / `GustoCanvasStage.tsx` styling, and `globals.css` with its distinct cinematic intro so the user can switch branches (`git checkout <branch>`) and compare all four live in the browser before choosing the winner.

---

## 2. Shared Invariants Across All 4 Branches

- **Duration & Replayability:** `BOOT_TOTAL_DURATION_MS = 2200` (`<= 3.0s` total with `250ms` exit transition). Triggered automatically on fresh session (`gusto_os_booted_v26`) and replayable anytime via the `[REPLAY BOOT_SEQ]` button in `HeroSection.tsx`.
- **Accessibility & Keyboard Control:**
  - Preserves `role="dialog"`, `aria-modal="false"`, `aria-labelledby="gusto-boot-title"`, and hidden `<progress id="gusto-boot-progress" max={100} value={state.progressPercent} />`.
  - Auto-focuses `[SKIP INTRO ->]` on open; pressing `Escape` or clicking `[SKIP INTRO ->]` skips immediately and restores focus to `#main-content`.
  - Preserves `canTransitionDisplay()`, `formatBootTelemetryLine(state)`, and `resolveOverlayAttributes(...)` exports in `TerminalBootOverlay.tsx`.
- **Motion & Flash Safety:**
  - All animations use compositor-friendly `transform` (`translate3d`, `scaleX`, `scaleY`, `scale`) and `opacity`.
  - Strictly `<= 3` transitions/flashes per second (WCAG 2.3.1).
  - `@media (prefers-reduced-motion: reduce)` skips auto-boot and collapses movement/shutter transforms to instant opacity fades.
- **English-Only UI Copy:** All visible HUD text, coordinates, slogans, and status tags are strictly English.

---

## 3. Branch-Specific Designs

### Branch 1: `feat/intro-1-orbital-drop` (Orbital Drop // Satellite Lock-On)
- **Visual Experience:**
  - Deep orbital telemetry backdrop (`#050b14`/88%) with horizontal and vertical **Laser Crosshair Scanlines** (`#FFE600` & `#00F5D4`) sweeping across the viewport to converge on the center reticle as `progress01` advances `0 -> 0.75`.
  - Live geospatial coordinate ticker (`LAT 13.7563° N // LON 100.5018° E // ALT 620.4 KM // THEOS-2 LOCK`) and rotating Neo-Brutalist target brackets (`[ + ]`) around the center HUD.
  - **4 Mechanical Blast Doors** (Top-Left, Top-Right, Bottom-Left, Bottom-Right armored panels with hazard stripes and bold stencil labels `SECTOR_01..04`) that unlock at `progress01 >= 0.78` and slide outward diagonally during the exit transition, while the Hero 3D stage scales/zooms in from `scale(0.84)` to `scale(1)`.
- **Pure Helper:** `computeOrbitalLockState(progress01: number)` returning crosshair offsets, altitude readout, lock status (`'SCANNING' | 'CONVERGING' | 'TARGET_LOCKED'`), and blast-door open ratio.

### Branch 2: `feat/intro-2-blueprint-printer` (Architectural Blueprint Printer)
- **Visual Experience:**
  - **No dark popup card.** The overlay is a full-viewport **CAD Blueprint Wireframe Stencil Layer** (`#050b14` blueprint grid + cyan wireframe schematic outlines of the Hero layout) that gets progressively erased from top to bottom (`--scan-y: 0% -> 100%`) as the **Laser Scanner Bar** sweeps down the screen.
  - The **Laser Scanner Bar** is a full-width horizontal Neo-Brutalist beam (`#FFE600` core + `#00F5D4` glow + live CAD ruler ticks `000mm .. 1440mm` + current subsystem stamp `PRINTING: [PHASE] // XX%`).
  - As the scanner sweeps past `0.25`, `0.50`, `0.75`, and `0.95`, 4 architectural stamp badges (`[STAMP_01: TYPOGRAPHY_LCP]`, `[STAMP_02: 3D_GLSL_CORE]`, `[STAMP_03: TELEMETRY_GRID]`, `[STAMP_04: KONAMI_DECK]`) lock into place with hard Neo-Brutalist borders.
- **Pure Helper:** `computeBlueprintScannerState(progress01: number)` returning `scanLinePercent`, active CAD ruler coordinate, and stamped module states.

### Branch 3: `feat/intro-3-kinetic-slam` (Kinetic Brutalist Slam // Overclock Burst)
- **Visual Experience:**
  - Full-viewport **Kinetic Typography Poster Frames** cycling through 4 high-impact Neo-Brutalist cards (`~550ms` per beat = `1.8 Hz`, safely `< 3 Hz` WCAG threshold):
    1. `0.00..0.28`: **`BUILD.`** (`#FFE600` Electric Yellow background, `#0A0A0A` giant `clamp(3.5rem, 11vw, 8.5rem)` brutalist type, tag `01 // FULL-STACK ARCHITECTURE`)
    2. `0.28..0.56`: **`GEO_AI.`** (`#00F5D4` Cyber Mint background, `#0A0A0A` type, tag `02 // GISTDA THEOS SATELLITE PIPELINES`)
    3. `0.56..0.82`: **`DEFEND.`** (`#FF5D8F` Coral Pop background, `#0A0A0A` type, tag `03 // KBTG REAL-TIME RISK FORENSICS`)
    4. `0.82..1.00`: **`GUSTO_OS v2.6`** (`#050B14` Blueprint Navy background, `#00F5D4` & `#FFE600` type, tag `04 // 60FPS WEBGL CORE READY`)
  - At `progress01 >= 0.85` and during `[data-closing]`, a central **Shockwave Ring** expands outward while the poster splits vertically into left/right brutalist curtains.
- **Pure Helper:** `computeKineticSlamFrame(progress01: number)` returning the active beat index (`0..3`), headline word, subtag, surface token, and shockwave scale.

### Branch 4: `feat/intro-4-pixel-shatter` (System Shatter // Pixel Mosaic Collapse)
- **Visual Experience:**
  - Opens as a retro **CRT Arcade / Game Boy Master Boot Deck** (`CARTRIDGE_INSERTED // GUSTO_OS v2.6`) built atop a **24-Tile (`6x4`) Neo-Brutalist Pixel Mosaic Grid** covering the viewport.
  - From `0.00 -> 0.72`, the center CRT HUD displays a pixel cartridge lock-in animation, memory address counter (`0x0000 -> 0xFFFF`), and prominent `[ IGNITE SYSTEM / SKIP -> ]` control.
  - At `progress01 >= 0.72` (and through `[data-closing]`), the 24 mosaic tiles **stagger-shatter and collapse** sequentially (using deterministic per-tile radial delay thresholds based on distance from center) so tiles shrink/flip open like a retro pixel dissolve, revealing the live Hero & Game Boy console underneath.
- **Pure Helper:** `computePixelMosaicState(progress01: number)` returning memory hex address, cartridge status, and the 24-tile (`6x4`) array with deterministic `isShattered` / `scale` values.
