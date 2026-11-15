# Konami Code Game Boy Console (`GUSTO_BOY POCKET`) Design Specification

**Date:** 2026-11-16  
**Target Area:** `src/components/hero/HeroSection.tsx` (below the 4-column Architectural Telemetry `<dl>` inside `lg:col-span-7`)  
**Status:** Draft for User Approval  

---

## 1. Overview & User Intent

Add a classic **pixel-art handheld Game Boy console widget (`GUSTO_BOY // KONAMI_01`)** directly beneath the 4-column Architectural Telemetry Strip (`SYSTEM_ROLE`, `ACADEMIC_NODE`, `GITHUB_UPLINK`, `RUNTIME_TARGET`) in the Hero section's left column (`lg:col-span-7`).

Core user goals satisfied by this design:
- **Theme Cohesion:** Matches `GUSTO_OS v2.6` Friendly Neo-Brutalist design (`3px` solid ink borders, hard offset drop shadows, Space Grotesk + JetBrains Mono typography) and adapts automatically between light Blueprint mode and dark `:root[data-theme='overclock']` Neon Mint/Coral mode.
- **Visible Konami Hint:** Features an unobtrusive integrated hint `(↑ ↑ ↓ ↓ ← → ← → B A)` directly on the screen bezel.
- **Classic Game Boy Ergonomic Layout:** Pixel LCD display paired with a cross **D-Pad (`↑ ↓ ← →`)** on the left, angled arcade **`B` / `A`** buttons on the right, and a tactile **`RESET`** utility button in the center/bottom deck.
- **Dual Input + Live Echo Display:** Supports both **mouse/touch button presses** and **physical keyboard input** (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `B`, `A`), echoing every button pressed live on the pixel LCD (latest key badge + scrolling key history tape + 10-slot sequence progress meter) and lighting up the corresponding hardware button on the console.
- **Playful Troll Unlock State:** Completing all 10 Konami steps (`↑ ↑ ↓ ↓ ← → ← → B A`) triggers a celebratory pixel reveal—with **no playable mini-game inside**—showing an all-English cheeky troll message (`"YOU GOT FOOLED! THERE'S NOTHING HERE LOL 😜"` / `"KONAMI_10 // GOTCHA!"`), optional 8-bit square-wave fanfare when site audio is active, and a one-click **`RESET`** flow.

---

## 2. Placement & Responsive Layout (`HeroSection.tsx`)

### 2.1 Grid Context
Inside [src/components/hero/HeroSection.tsx](file:///c:/Users/User/Documents/my-website/src/components/hero/HeroSection.tsx), the right column (`lg:col-span-5`) hosts `<GustoCanvasStage />` (`380px`/`430px` WebGL viewport plus Orbital Nodes bar and Module Inspector card). The left column (`lg:col-span-7`) ends right after the 4-column `<dl>` telemetry strip, creating balanced vertical headroom for a horizontal Pocket Deck module (`mt-1` inside the parent `space-y-6` container).

### 2.2 Internal Handheld Architecture
- **Outer Shell (`<section aria-labelledby="konami-console-heading">`):**
  - Neo-Brutalist cartridge chassis (`border-[3px] border-[var(--ui-border-color)]`, `var(--btn-shadow-rest)`), rounded only on the classic DMG bottom-right bevel corner (`rounded-br-2xl`, keeping the rest sharp rectangular brutalism).
  - Top bezel bar: `GUSTO_BOY // KONAMI_01` hardware tag, live LED indicator (`READY` / `ACTIVE` / `TROLLED`), and keyboard capture status badge (`KB: READY`).
- **Pixel LCD Screen Module (Left/Top Half on Wide Deck, Full Width on Mobile):**
  - Matte dark charcoal bezel (`#181A1F`) framing the pixel LCD panel:
    - **Blueprint mode palette:** Classic DMG olive screen (`#9BBC0F` background, `#8BAC0F` pixel grid lines, `#0F380F` crisp pixel foreground; ~9.6:1 contrast ratio).
    - **Overclock mode palette:** Phosphor dark terminal screen (`#071A1D` background, subtle `#00F5D4` pixel grid tint, `#00F5D4` foreground + `#FFE600`/`#FF5D8F` accents).
  - **Screen Sub-regions:**
    1. **Subtle Hint Header:** Small monospace badge `HINT: ↑ ↑ ↓ ↓ ← → ← → B A` tucked at the top edge of the bezel/LCD.
    2. **Normal / Entering Mode (`status === 'entering'`):**
       - **10-Slot Konami Progress Strip:** Compact pixel blocks representing indices `0..9`; matched slots invert to filled blocks with symbol (`↑`, `↑`, `↓`, ...), current next slot gently highlights.
       - **Live Last-Key Banner:** Large pixel readout showing the exact button just pressed and source, e.g. `[ ↑ UP ] · CLICK` or `[ A ] · KEYBOARD`, or `PRESS D-PAD / KB` before first input.
       - **Live Input Tape:** Horizontal row of recent pressed button chips (up to last 10 presses, e.g. `↑`, `↑`, `↓`, `←`, `B`), updated cleanly on every valid/invalid press so the user always sees what they clicked or typed.
    3. **Unlocked / Troll Mode (`status === 'unlocked'`):**
       - Replaces progress strip with a bold retro pixel banner & playful pixel glyph (`(▀̿Ĺ̯▀̿ ̿)` / pixel smirk badge):
         - Eyebrow: `KONAMI_10 // GOTCHA!`
         - Main Message (English only): `YOU GOT FOOLED! THERE'S NOTHING HERE LOL 😜`
         - Sub-message (English only): `Entered the whole code for... literally nothing! Press RESET to try again.`
       - Still echoes the latest key press in a bottom micro-line if the player keeps tapping `↑ ↓ ← → B A` (`PRESSED [A] // STILL NOTHING TO PLAY LOL`).
- **Controller Deck (Right Half on `md:`+ Horizontal Split, Below LCD on Mobile `grid-cols-1`):**
  - **Left Control Cluster — 3x3 Cross D-Pad (`↑ ↓ ← →`):**
    - Four real `<button type="button">` arms arranged in an authentic `+` cross (`Up` col 2 row 1, `Left` col 1 row 2, center decorative concave pivot col 2 row 2, `Right` col 3 row 2, `Down` col 2 row 3).
    - Tactile dark charcoal caps (`>= 36px` desktop, `>= 44px` on `pointer: coarse`) with pressed-in animation whenever `lastActiveButton` matches or key is held.
  - **Center Bottom — Classic Angled `RESET` Pill:**
    - Tilted subtle `-10deg` classic Game Boy START/SELECT style button (`RESET` label, `<button type="button">`) positioned clearly between D-Pad and `B / A`.
    - Resets matched sequence progress (`0`), clears pressed key history tape, clears `lastPressed`, and returns LCD from troll screen back to `READY`.
  - **Right Control Cluster — Diagonal `B` & `A` Arcade Caps:**
    - Circular tactile buttons staggered diagonally (`B` bottom-left, `A` top-right, matching handheld ergonomics), `>= 44px` click target (`48px` on coarse pointers), colored Coral Pop (`#FF5D8F`) / Electric Yellow (`#FFE600`) with high-contrast black ink labels and underside stamped `B` / `A` marks.

---

## 3. State Machine & Keyboard Behavior (`src/lib/konamiController.ts`)

### 3.1 Pure State & Transition Engine
Keep all game/sequence math in a framework-free module (`src/lib/konamiController.ts`) covered by Vitest unit tests before React integration:

```ts
export type KonamiButtonId = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'B' | 'A';
export type KonamiInputSource = 'pointer' | 'keyboard';

export const KONAMI_SEQUENCE: readonly KonamiButtonId[] = [
  'UP', 'UP', 'DOWN', 'DOWN', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'B', 'A',
] as const;

export const MAX_PRESSED_LOG = 10;

export interface KonamiState {
  status: 'entering' | 'unlocked';
  matchedCount: number;        // 0..10 prefix matched via KMP fallback
  recentMatches: KonamiButtonId[];
  pressedLog: KonamiButtonId[]; // Exact last <= 10 presses (every tap/keypress)
  lastPressed: KonamiButtonId | null;
  lastSource: KonamiInputSource | null;
  pressSeq: number;            // Monotonic counter to re-trigger button flash animation
  totalPressCount: number;
}
```

### 3.2 Sliding Prefix Matcher (Overlapping Sequence Recovery)
Using longest-prefix-suffix fallback (KMP prefix rule) guarantees forgiving, authentic Konami recognition:
- Pressing `↑ ↑ ↑ ↓ ↓ ← → ← → B A` (an accidental extra `↑` at the beginning) slides cleanly to `matchedCount = 2` on the third `↑` rather than dropping back to `0`.
- Breaking mid-sequence (e.g., pressing `LEFT` after `UP, UP`) computes the longest suffix matching a prefix of `KONAMI_SEQUENCE` (`0`), while still recording `'LEFT'` in `pressedLog` and `lastPressed`.
- Reaching `matchedCount === 10` transitions `status` to `'unlocked'`.
- While `status === 'unlocked'`, pressing `UP/DOWN/LEFT/RIGHT/B/A` updates `lastPressed`, `lastSource`, `pressedLog`, and `pressSeq` (keeping visual hardware feedback alive!) without leaving `'unlocked'`. Only `resetKonamiState()` restores `INITIAL_KONAMI_STATE`.

### 3.3 Hybrid Keyboard Capture (Zero Scroll-Hijacking)
Pure helper `resolveKonamiKeyboardKey(input)`:
- Guards against:
  - Modifier keys (`altKey || ctrlKey || metaKey`)
  - Open modal dialogs (`dialog[open]`)
  - Editable inputs (`INPUT`, `TEXTAREA`, `SELECT`, `[contenteditable="true"]`)
  - Other arrow-navigated toolbars (`[role="toolbar"]`, such as `OverclockSynthDeck`)
  - Keyboard auto-repeat (`event.repeat === true`) so holding a key does not spam 10 inputs in 300ms
- Key mapping (case-insensitive for letters):
  - `ArrowUp` -> `'UP'`
  - `ArrowDown` -> `'DOWN'`
  - `ArrowLeft` -> `'LEFT'`
  - `ArrowRight` -> `'RIGHT'`
  - `b` / `B` -> `'B'`
  - `a` / `A` -> `'A'`
  - `Escape` -> triggers `'RESET'` ONLY when `isConsoleFocused === true` (does not conflict with other page modals or boot overlay).
- **Focus vs Global Handling:**
  - When focus is inside the Game Boy container (`isConsoleFocused === true`, activated automatically on pointer click or Tab focus inside the widget): calling `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight` runs `event.preventDefault()` so the page stays stationary while inputting arrows, and displays `[KB: LOCKED_IN]` on the LCD bezel.
  - When focus is elsewhere on the page (`isConsoleFocused === false`): listens passively on `window` without `preventDefault()` so normal visitor scrolling with arrows is never blocked, while typing `B`/`A` or pressing arrows at hero top still increments the console live!

---

## 4. Audio, Motion & Accessibility Compliance

### 4.1 8-Bit Chiptune Audio (Reuse Existing Hook)
- Uses existing `useAudioSync().triggerSynthNote(freqHz, durationSec, 'square')` cleanly:
  - Only fires sound when `audioEnabled === true` (never overrides the user's mute state).
  - Distinct square-wave pitches per control: `UP` (523.25 Hz), `DOWN` (392.00 Hz), `LEFT` (440.00 Hz), `RIGHT` (493.88 Hz), `B` (587.33 Hz), `A` (659.25 Hz), `RESET` (quick descending 440 -> 261.63 Hz pair).
  - Unlock event plays a short 4-note ascending 8-bit chiptune arpeggio (`C5 -> E5 -> G5 -> C6`), cleaning up scheduled timeouts cleanly on unmount or Reset.

### 4.2 Accessibility & Forced Colors
- Every control (`↑`, `←`, `→`, `↓`, `RESET`, `B`, `A`) uses native `<button type="button">` with descriptive `aria-label` (never `<div role="button">`).
- Touch/click targets respect WCAG 2.2 AA (`>= 36px` desktop, `>= 44px` on `@media (pointer: coarse)`).
- `:focus-visible` renders high-contrast `3px solid var(--focus-ring)` outlines; cursor inherits site custom `--neo-cursor-pointer`.
- `@media (forced-colors: active)` switches borders/text/active highlights cleanly to `ButtonText` / `Highlight` / `Canvas`.
- Screen reader announcements use a single debounced/milestone `aria-live="polite"` `<p className="sr-only">` summary (announces when unlocked, when reset, and periodically at sequence milestones without overwhelming screen readers on every rapid arrow tap).

### 4.3 Motion Safety
- Button depressed feedback (`translate(2px, 2px)`) and active key flash (`140ms`) live cleanly inside `@media (prefers-reduced-motion: no-preference)`.
- Under `prefers-reduced-motion: reduce`, pixel state transitions remain instant and static without cursor blink, bounce, or scanline pulse, and zero rapid flashing exceeds 3 Hz (WCAG 2.3.1).

---

## 5. Planned File Changes

| File | Purpose |
| :--- | :--- |
| `src/lib/konamiController.ts` *(New)* | Pure state machine, KMP overlapping prefix matcher, `pressedLog` tracking, `RESET`, keyboard mapper & guard logic, chiptune pitch map. |
| `src/lib/__tests__/konamiController.test.ts` *(New)* | Comprehensive Vitest suite covering exact sequence completion, overlapping prefix edge cases (`↑ ↑ ↑ ...`), live `pressedLog` cap, `unlocked` persistence, `RESET`, and keyboard guards/toolbar isolation. |
| `src/components/hero/KonamiGameBoyWidget.tsx` *(New)* | Client Game Boy UI component with LCD screen, hint badge, 10-slot progress strip, live input tape, cheeky unlock message, D-Pad, `B`/`A`, `RESET`, audio feedback, and hybrid keyboard listener. |
| `src/components/hero/__tests__/KonamiGameBoyWidget.test.ts` *(New)* | Vitest SSR markup & integration checks covering rendering hint `(↑ ↑ ↓ ↓ ← → ← → B A)`, D-Pad/`B`/`A`/`RESET` native button controls, live button readout display, unlocked English troll message (`YOU GOT FOOLED! THERE'S NOTHING HERE LOL 😜`), and HeroSection mount order. |
| `src/lib/__tests__/konamiGameBoyStylesheet.test.ts` *(New)* | CSS contract tests verifying Game Boy shell, DMG/Overclock LCD tokens, coarse pointer sizing, reduced-motion disablement, and forced-colors compliance. |
| `src/app/globals.css` *(Edit)* | Game Boy shell, DMG/Overclock LCD pixel palette & dot-matrix grid tokens, D-Pad cross layout, angled `RESET`/`B`/`A` caps, hardware active state, `@media (prefers-reduced-motion: reduce)` and `@media (forced-colors: active)` support. |
| `src/components/hero/HeroSection.tsx` *(Edit)* | Mount `<KonamiGameBoyWidget />` cleanly inside `lg:col-span-7` immediately below the 4-column telemetry `<dl>`. |
