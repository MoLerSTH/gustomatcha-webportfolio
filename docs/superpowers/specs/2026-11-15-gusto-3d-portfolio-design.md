# Gusto (Hattakorn Pongsawai) — 3D Interactive Neo-Brutalist Portfolio Design Spec

## 1. Intent & Why
Build an unforgettable, Awwwards-caliber 3D interactive portfolio for **Hattakorn Pongsawai (Gusto | `MoLerSTH`)**—a 3rd-year Software Engineering student (TEP/TEPE Program) at Thammasat University, Backend & AI Systems Architect, and relentless creative builder. The site bridges heavy backend/AI systems engineering with tactile, playful **Friendly Neo-Brutalism** and a locked **60 FPS Pure Three.js Procedural Engine**.

## 2. Goals, Non-Goals & Anti-Goals
- **Goals:**
  - Deliver a 100% real, zero-placeholder portfolio featuring Gusto's actual projects, internships, hackathons, tech stack, and contact channels.
  - Enforce the **Friendly Neo-Brutalist** visual language (`#FFFFFF` / `#F8F9FA` canvas, `#E5E7EB` architectural grid, `3px solid #0A0A0A` borders, `6px 6px 0px #0A0A0A` shadows, `#FFE600`, `#00F5D4`, `#FF5D8F`, `#3A86FF` accents, tactile button depression physics).
  - Run a decoupled **Pure Three.js** procedural engine (`GustoWorldEngine`) with adaptive device tiering, 4-way interactivity (mouse parallax, GSAP ScrollTrigger choreography, raycasting project triggers, Web Audio API pulse), a `<= 3.0s` terminal boot intro, and the `GUSTO_OVERCLOCK // SYNTH-DIMENSION` playable 3D synth Easter egg.
- **Non-Goals:**
  - External CMS or backend database requirement (portfolio data is statically typed and bundled for instant edge delivery).
  - External 3D `.glb`/`.gltf` model downloads that block LCP (all 3D geometry is 100% procedural).
- **Anti-Goals:**
  - Generic dark-mode SaaS templates, soft blurry shadows, unmounted WebGL memory leaks, or intro animations exceeding `3.0s`.

## 3. Global Constraints
- **Framework:** Next.js (App Router, TypeScript strict mode, Tailwind CSS).
- **3D Engine:** Pure `three` (`class GustoWorldEngine`) mounted via `useRef`, zero React-three-fiber overhead, complete disposal on unmount.
- **Intro Budget:** `<= 3.0s` strictly, with instant `[SKIP INTRO ->]` button and `sessionStorage` flag (`gusto_os_booted_v26`).
- **Identity & Content:**
  - Full Name: `Hattakorn Pongsawai` | Alias: `Gusto` | GitHub: `MoLerSTH` | Email: `hattakorn49@gmail.com`
  - Education: 3rd-Year B.Eng. in Software Engineering (TEP/TEPE Program), Thammasat University
  - Top 3 Highlights: `GISTDA Satellite Cal-Val System`, `KBTG Kampus Hackathon 2026 — Anti-Scam Risk Engine`, `RoPA2077 / Assignier AI`
  - Additional Vault Projects: `ASR Lab LLM-to-Web Interface`, `Animal-Collection`, `6-String Web Audio Bass & Multiplayer Electron Piano`

## 4. Approaches Considered for Phase 1 Foundation
1. **Approach A (Selected): Semantic CSS Variables + Tailwind Utility Mapping + Modular Neo-Brutalist Primitives**
   - Define core Neo-Brutalist tokens (`--bg-canvas`, `--ink`, `--accent-yellow`, `--shadow-hard`, etc.) and `[data-theme="overclock"]` overrides in `globals.css`, paired with strongly-typed React UI primitives (`NeoButton`, `NeoCard`, `NeoBadge`, `NeoSectionHeader`, `NeoNavbar`) and a centralized typed dataset (`src/data/portfolioData.ts`).
   - *Why chosen:* Enables instantaneous zero-re-render theme inversion when triggering `GUSTO_OVERCLOCK` in Phase 5, keeps components DRY, and ensures 100% consistent borders/shadows across all sections.
2. **Approach B: Inline Tailwind Classes Only**
   - Repeat hardcoded hex codes and `shadow-[6px_6px_0px_#0A0A0A]` across every component.
   - *Why rejected:* Difficult to invert cleanly into the Blueprint/Wireframe dimension in Phase 5 and prone to visual drift.
