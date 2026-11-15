export type AccentColor = 'yellow' | 'mint' | 'coral' | 'cobalt';

export type ProjectCategory =
  | 'BACKEND & SATELLITE'
  | 'AI & FINTECH SECURITY'
  | 'FULLSTACK & AI PIPELINE'
  | 'LLM & RESEARCH'
  | 'MOBILE & OFFLINE-FIRST'
  | 'WEB AUDIO & CREATIVE TECH';

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: ProjectCategory;
  featured: boolean;
  highlightOrder?: 1 | 2 | 3;
  orbitalNodeLabel?: string;
  accent: AccentColor;
  period: string;
  role: string;
  summary: string;
  architectureHighlights: string[];
  metrics: ProjectMetric[];
  techStack: string[];
  githubUrl: string;
  liveUrl?: string;
  accessLabel: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  organization: string;
  type: 'INTERNSHIP' | 'HACKATHON' | 'COMPETITION';
  period: string;
  location: string;
  accent: AccentColor;
  summary: string;
  achievements: string[];
  techTags: string[];
}

export interface TechSkill {
  name: string;
  role: string;
  level: string;
  core: boolean;
}

export interface TechSkillCategory {
  id: string;
  category: string;
  code: string;
  accent: AccentColor;
  skills: TechSkill[];
}

export interface GustoPortraitSpec {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  badgeLabel: string;
  defaultBackdrop: AccentColor;
}

export interface GustoProfile {
  fullName: string;
  alias: string;
  handle: string;
  githubHandle: string;
  githubUrl: string;
  linkedinUrl: string;
  email: string;
  roleHeadline: string;
  university: string;
  program: string;
  yearLevel: string;
  location: string;
  storyLead: string;
  storyBody: string[];
  telemetrySpecs: { label: string; value: string }[];
  portrait: GustoPortraitSpec;
}

export const GUSTO_PROFILE: GustoProfile = {
  fullName: 'Hattakorn Pongsawai',
  alias: 'Gusto',
  handle: '@MoLerSTH',
  githubHandle: 'MoLerSTH',
  githubUrl: 'https://github.com/MoLerSTH',
  linkedinUrl: 'https://www.linkedin.com/search/results/all/?keywords=Hattakorn%20Pongsawai',
  email: 'hattakorn49@gmail.com',
  roleHeadline: 'Backend & AI Systems Architect // Creative Technologist',
  university: 'Thammasat University',
  program: 'B.Eng. in Software Engineering (TEP/TEPE Program)',
  yearLevel: '3rd-Year Undergraduate',
  location: 'Pathum Thani / Bangkok, Thailand',
  storyLead:
    'I love breaking complex systems apart, testing emerging AI & backend stacks in the wild, and wrapping heavy-duty architecture inside playful, tactile web experiences.',
  storyBody: [
    "Hey! I'm Gusto (Hattakorn Pongsawai) — a 3rd-year Software Engineering student in Thammasat University's international TEP/TEPE program. By day, I design asynchronous Python/FastAPI backends, PostgreSQL schemas, geospatial satellite pipelines, and AI orchestration services.",
    'By night, I experiment relentlessly with new technologies: procedural Three.js shaders, Web Audio synthesis, browser automation, and cross-platform offline-first mobile architectures. Whether calibrating THEOS satellite imagery or building anti-scam risk engines under hackathon pressure, I build software that feels alive and refuses to break.',
  ],
  telemetrySpecs: [
    { label: 'SYSTEM_ROLE', value: 'BACKEND + AI + WEBGL' },
    { label: 'ACADEMIC_NODE', value: 'TU_SE (TEP/TEPE) YR.3' },
    { label: 'GITHUB_UPLINK', value: 'github.com/MoLerSTH' },
    { label: 'RUNTIME_TARGET', value: '60 FPS // ZERO_BLOAT' },
  ],
  portrait: {
    src: '/images/gusto-portrait.webp',
    width: 2400,
    height: 1600,
    alt: 'Hattakorn Pongsawai (Gusto) presenting on stage with a microphone and slide clicker',
    caption: 'STAGE_CAPTURE // LIVE ARCHITECTURE & AI SYSTEMS PITCH',
    badgeLabel: 'STICKER_CUTOUT // VERIFIED',
    defaultBackdrop: 'yellow',
  },
};

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'gistda-calval',
    slug: 'gistda-satellite-cal-val',
    title: 'GISTDA Satellite Cal-Val System',
    subtitle: 'Geospatial Calibration & Validation Service for THEOS-1 & THEOS-2',
    category: 'BACKEND & SATELLITE',
    featured: true,
    highlightOrder: 1,
    orbitalNodeLabel: 'NODE_01 // THEOS_CALVAL',
    accent: 'yellow',
    period: 'INTERNSHIP_BUILD',
    role: 'Software Engineering Intern @ GISTDA',
    summary:
      'Production-oriented backend web service engineered to calibrate and validate Thai Earth Observation Satellite imagery (THEOS-1 & THEOS-2) with asynchronous database pipelines, geospatial raster processing, and containerized deployment.',
    architectureHighlights: [
      'Non-blocking FastAPI service layer powered by SQLAlchemy AsyncSession and PostgreSQL for concurrent Cal-Val job telemetry.',
      'Redis caching & task coordination layer accelerating repeated metadata lookups and calibration validation runs.',
      'GDAL-backed geospatial raster ingestion pipeline packaged cleanly inside multi-stage Docker containers.',
    ],
    metrics: [
      { label: 'SATELLITES', value: 'THEOS-1 / THEOS-2' },
      { label: 'DB_DRIVER', value: 'AsyncSession + PG' },
      { label: 'GEO_ENGINE', value: 'GDAL + Redis + Docker' },
    ],
    techStack: ['Python', 'FastAPI', 'PostgreSQL', 'AsyncSession', 'Redis', 'GDAL', 'Docker'],
    githubUrl: 'https://github.com/MoLerSTH',
    accessLabel: 'GISTDA INTERNSHIP ARCHITECTURE',
  },
  {
    id: 'kbtg-anti-scam',
    slug: 'kbtg-anti-scam-risk-engine',
    title: 'KBTG Kampus Hackathon 2026 — Anti-Scam Risk Engine',
    subtitle: 'Real-Time Transaction Risk-Scoring Feature for K PLUS (Team iLoveKBTG)',
    category: 'AI & FINTECH SECURITY',
    featured: true,
    highlightOrder: 2,
    orbitalNodeLabel: 'NODE_02 // RISK_ENGINE',
    accent: 'mint',
    period: '2026 HACKATHON',
    role: 'Systems & AI Architect — Team iLoveKBTG',
    summary:
      'Real-time pre-transfer scam detection and transaction risk-scoring architecture designed for K PLUS, synthesizing behavioral forensics inspired by Flagright AI alongside verified Blacklistseller threat intelligence.',
    architectureHighlights: [
      'Low-latency risk-scoring pipeline evaluating recipient mule patterns, velocity anomalies, and blacklist cross-references before transfer confirmation.',
      'Explainable risk telemetry signals surfacing clear fraud warnings and confidence breakdowns inside mobile banking flows.',
      'Modular rule + AI scoring engine balancing false-positive friction with rapid scam interception.',
    ],
    metrics: [
      { label: 'TEAM_UNIT', value: 'iLoveKBTG' },
      { label: 'TARGET_FLOW', value: 'K PLUS Real-Time' },
      { label: 'INTEL_INSPIRED', value: 'Flagright + Blacklistseller' },
    ],
    techStack: ['Python', 'FastAPI', 'Risk Scoring', 'AI Forensics', 'Threat Intel', 'Next.js'],
    githubUrl: 'https://github.com/MoLerSTH',
    accessLabel: 'KBTG KAMPUS 2026 BUILD',
  },
  {
    id: 'ropa2077-assignier',
    slug: 'ropa2077-assignier-ai',
    title: 'RoPA2077 / Assignier AI',
    subtitle: 'Fullstack Architecture & Handwritten Exam Grading Pipeline via Typhoon OCR + Ollama',
    category: 'FULLSTACK & AI PIPELINE',
    featured: true,
    highlightOrder: 3,
    orbitalNodeLabel: 'NODE_03 // ASSIGNIER_AI',
    accent: 'coral',
    period: 'SYSTEMS_LAB',
    role: 'Fullstack & AI Pipeline Architect',
    summary:
      'Dual-track systems engineering showcase combining resilient FastAPI + Next.js + PostgreSQL fullstack architecture and Playwright automation (RoPA2077) with an AI-assisted handwritten exam grading pipeline driven by Typhoon OCR and local Ollama inference (Assignier AI).',
    architectureHighlights: [
      'End-to-end handwritten script digitization pipeline extracting Thai/English responses via Typhoon OCR before rubric-aligned scoring in Ollama.',
      'Typed FastAPI API gateway + PostgreSQL persistence paired with responsive Next.js grading review interfaces.',
      'Playwright end-to-end verification and browser workflow automation ensuring zero-regression fullstack reliability.',
    ],
    metrics: [
      { label: 'OCR_ENGINE', value: 'Typhoon OCR' },
      { label: 'LOCAL_LLM', value: 'Ollama Inference' },
      { label: 'E2E_STACK', value: 'FastAPI + Next.js + PG' },
    ],
    techStack: ['FastAPI', 'Next.js', 'PostgreSQL', 'Playwright', 'Typhoon OCR', 'Ollama', 'Python'],
    githubUrl: 'https://github.com/MoLerSTH',
    accessLabel: 'FULLSTACK + AI REPO',
  },
  {
    id: 'asr-lab-llm-web',
    slug: 'asr-lab-llm-web-interface',
    title: 'ASR Lab LLM-to-Web Interface',
    subtitle: 'Research Assistant Internship — Interactive Speech & Language Model Web Services',
    category: 'LLM & RESEARCH',
    featured: false,
    accent: 'cobalt',
    period: 'RESEARCH_INTERN',
    role: 'Research Assistant Intern @ ASR Lab',
    summary:
      'Engineered web-facing inference bridges connecting Automatic Speech Recognition and Large Language Model research pipelines to responsive browser interfaces for rapid researcher evaluation.',
    architectureHighlights: [
      'Streaming request/response adapters bridging Python research inference backends with clean web UIs.',
      'Prompt evaluation & transcript visualization workflows tailored for speech-to-LLM experimentation.',
      'Containerized service scripts enabling reproducible lab demos across research workstations.',
    ],
    metrics: [
      { label: 'LAB_FOCUS', value: 'ASR + LLM Web' },
      { label: 'INTERFACE', value: 'Realtime Streaming' },
      { label: 'RUNTIME', value: 'Python Web Services' },
    ],
    techStack: ['Python', 'FastAPI', 'LLM Serving', 'ASR Pipelines', 'TypeScript', 'Linux'],
    githubUrl: 'https://github.com/MoLerSTH',
    accessLabel: 'ASR LAB RESEARCH SERVICE',
  },
  {
    id: 'animal-collection-mobile',
    slug: 'animal-collection-offline-first',
    title: 'Animal-Collection',
    subtitle: 'Offline-First React Native Field Collector with MinIO S3 Object Sync',
    category: 'MOBILE & OFFLINE-FIRST',
    featured: false,
    accent: 'mint',
    period: 'MOBILE_SYSTEMS',
    role: 'Mobile & Storage Systems Builder',
    summary:
      'Resilient offline-first React Native mobile application designed for uninterrupted local field capture and deterministic media synchronization against self-hosted MinIO S3 object storage.',
    architectureHighlights: [
      'Local-first persistence queue storing structured records and captured imagery reliably when offline.',
      'Presigned multipart media synchronization workflow targeting MinIO S3 buckets upon network recovery.',
      'Conflict-safe upload state machine preventing duplicate object writes on flaky mobile connections.',
    ],
    metrics: [
      { label: 'OFFLINE_MODE', value: 'Local-First Queue' },
      { label: 'OBJECT_STORE', value: 'MinIO S3 Compatible' },
      { label: 'CLIENT', value: 'React Native' },
    ],
    techStack: ['React Native', 'TypeScript', 'MinIO S3', 'Offline-First', 'Docker'],
    githubUrl: 'https://github.com/MoLerSTH',
    accessLabel: 'GITHUB // MoLerSTH',
  },
  {
    id: 'web-audio-bass-piano',
    slug: '6-string-bass-and-multiplayer-piano',
    title: '6-String Web Audio Bass & Multiplayer Electron Piano',
    subtitle: 'Low-Latency DSP Synthesis & Real-Time Networked Desktop Instrument Suite',
    category: 'WEB AUDIO & CREATIVE TECH',
    featured: false,
    accent: 'yellow',
    period: 'CREATIVE_AUDIO_LAB',
    role: 'Audio & Creative Systems Engineer',
    summary:
      'Dual interactive music-tech build: a browser-based 6-string bass synthesizer powered by raw Web Audio API DSP nodes, paired with a networked multiplayer desktop piano built in Electron.',
    architectureHighlights: [
      'Custom Web Audio oscillator, envelope, and filter routing simulating 6-string bass pluck dynamics with minimal latency.',
      'Electron IPC + real-time socket event synchronization letting multiple players jam simultaneously on a shared virtual keyboard.',
      'Keyboard-mapped polyphonic triggering engineered for snappy musical playability.',
    ],
    metrics: [
      { label: 'AUDIO_DSP', value: 'Web Audio API' },
      { label: 'DESKTOP_HOST', value: 'Electron Multi-Player' },
      { label: 'POLYPHONY', value: 'Real-Time Low Latency' },
    ],
    techStack: ['Web Audio API', 'Electron', 'TypeScript', 'JavaScript', 'WebSockets'],
    githubUrl: 'https://github.com/MoLerSTH',
    accessLabel: 'GITHUB // MoLerSTH',
  },
];

export const FEATURED_PROJECTS: ProjectItem[] = PROJECTS_DATA.filter(
  (project) => project.featured
).sort((a, b) => (a.highlightOrder ?? 99) - (b.highlightOrder ?? 99));

export const EXPERIENCE_TIMELINE: ExperienceItem[] = [
  {
    id: 'exp-gistda',
    title: 'Software Engineering Intern (Satellite Data Backend)',
    organization: 'GISTDA — Geo-Informatics and Space Technology Development Agency',
    type: 'INTERNSHIP',
    period: 'INTERNSHIP // SATELLITE SYSTEMS',
    location: 'Thailand',
    accent: 'yellow',
    summary:
      'Architected and built backend web services for calibrating and validating Thai satellite imagery (THEOS-1 & THEOS-2) with modern asynchronous Python tooling.',
    achievements: [
      'Implemented async FastAPI endpoints backed by PostgreSQL & SQLAlchemy AsyncSession.',
      'Integrated GDAL geospatial raster processing with Redis caching inside Dockerized deployments.',
    ],
    techTags: ['FastAPI', 'PostgreSQL', 'AsyncSession', 'Redis', 'GDAL', 'Docker'],
  },
  {
    id: 'exp-asr-lab',
    title: 'Research Assistant Intern (LLM Web Services)',
    organization: 'ASR Lab',
    type: 'INTERNSHIP',
    period: 'INTERNSHIP // AI RESEARCH',
    location: 'Thammasat University / Lab',
    accent: 'cobalt',
    summary:
      'Built web interfaces and backend service wrappers connecting Automatic Speech Recognition and LLM research workflows to live browser interaction.',
    achievements: [
      'Translated experimental Python LLM/ASR pipelines into responsive web-accessible APIs.',
      'Streamlined model testing and qualitative transcript evaluation for lab researchers.',
    ],
    techTags: ['Python', 'LLM Web Services', 'ASR', 'FastAPI', 'TypeScript'],
  },
  {
    id: 'exp-kbtg-2026',
    title: 'Anti-Scam Risk Engine Architect (Team iLoveKBTG)',
    organization: 'KBTG Kampus Hackathon 2026',
    type: 'HACKATHON',
    period: '2026 // FINTECH HACKATHON',
    location: 'Bangkok, Thailand',
    accent: 'mint',
    summary:
      'Designed and prototyped a real-time transaction risk-scoring feature for K PLUS inspired by Flagright AI forensics and Blacklistseller crowd-sourced fraud intelligence.',
    achievements: [
      'Engineered multi-signal risk scoring evaluating behavioral velocity and mule-account indicators.',
      'Delivered end-to-end UX and backend telemetry demonstration under hackathon time pressure.',
    ],
    techTags: ['Risk Scoring', 'AI Forensics', 'FastAPI', 'K PLUS Flow', 'Next.js'],
  },
  {
    id: 'exp-icpc',
    title: 'Competitive Programmer',
    organization: 'ICPC Thailand National Contest',
    type: 'COMPETITION',
    period: 'NATIONAL CONTEST // ALGORITHMS',
    location: 'Thailand',
    accent: 'coral',
    summary:
      'Competed in algorithmic problem solving, graph theory, dynamic programming, and time-critical C++/Python implementation at the national collegiate level.',
    achievements: [
      'Solved complex algorithmic optimization challenges under strict 5-hour contest constraints.',
      'Sharpened data structures, complexity analysis, and team debugging velocity.',
    ],
    techTags: ['Algorithms', 'Data Structures', 'Graph Theory', 'DP', 'Competitive Coding'],
  },
  {
    id: 'exp-microsoft-ai',
    title: 'AI Systems Builder',
    organization: 'Microsoft AI Hackathon',
    type: 'HACKATHON',
    period: 'HACKATHON // AI ARCHITECTURE',
    location: 'Thailand',
    accent: 'cobalt',
    summary:
      'Rapidly prototyped AI-powered workflows and intelligent application pipelines combining modern LLM orchestration with resilient backend services.',
    achievements: [
      'Built working end-to-end AI prototype from concept to live demo within hackathon sprint.',
      'Focused on practical prompt/tool reliability and crisp user interaction.',
    ],
    techTags: ['AI Orchestration', 'Python', 'Web Services', 'Rapid Prototyping'],
  },
  {
    id: 'exp-cyber-warrior',
    title: 'Security & Systems Competitor',
    organization: 'Cyber Warrior Hackathon',
    type: 'HACKATHON',
    period: 'HACKATHON // CYBERSECURITY',
    location: 'Thailand',
    accent: 'yellow',
    summary:
      'Tackled defensive and offensive cybersecurity engineering challenges across web architecture, traffic analysis, and hardened Linux environments.',
    achievements: [
      'Applied security-first threat modeling and Linux systems diagnostics under competitive pressure.',
      'Strengthened backend validation and defensive system design instincts.',
    ],
    techTags: ['Cybersecurity', 'Linux', 'Network Analysis', 'Threat Modeling'],
  },
];

export const TECH_STACK_MATRIX: TechSkillCategory[] = [
  {
    id: 'stack-backend-systems',
    category: 'BACKEND & SYSTEMS CORE',
    code: 'SYS_01',
    accent: 'yellow',
    skills: [
      { name: 'Python', role: 'Primary Systems & AI Language', level: 'CORE', core: true },
      { name: 'FastAPI', role: 'Async High-Throughput APIs', level: 'CORE', core: true },
      { name: 'Java', role: 'Enterprise & OOP Architecture', level: 'CORE', core: true },
      { name: 'Spring Boot', role: 'JVM Backend Microservices', level: 'CORE', core: true },
      { name: 'PostgreSQL', role: 'Relational & Geospatial Persistence', level: 'CORE', core: true },
      { name: 'Redis', role: 'Low-Latency Cache & Queues', level: 'PROD', core: false },
    ],
  },
  {
    id: 'stack-frontend-webgl',
    category: 'FRONTEND & CREATIVE WEBGL',
    code: 'UI_02',
    accent: 'mint',
    skills: [
      { name: 'Next.js', role: 'App Router & Fullstack React', level: 'CORE', core: true },
      { name: 'Three.js', role: 'Pure Procedural 3D & GLSL Shaders', level: 'CORE', core: true },
      { name: 'TypeScript', role: 'Strict Type-Safe Interfaces', level: 'CORE', core: true },
      { name: 'GSAP', role: 'ScrollTrigger & Timeline Motion', level: 'PROD', core: false },
      { name: 'Web Audio API', role: 'Real-Time Browser Synthesis', level: 'LAB', core: false },
      { name: 'React Native', role: 'Offline-First Mobile Systems', level: 'PROD', core: false },
    ],
  },
  {
    id: 'stack-ai-infra',
    category: 'AI PIPELINES & INFRASTRUCTURE',
    code: 'OPS_03',
    accent: 'coral',
    skills: [
      { name: 'Docker', role: 'Reproducible Multi-Service Containers', level: 'CORE', core: true },
      { name: 'Linux', role: 'CLI, Shell, System Diagnostics', level: 'CORE', core: true },
      { name: 'Ollama', role: 'Local LLM Inference Pipelines', level: 'PROD', core: false },
      { name: 'Typhoon OCR', role: 'Handwritten Thai/EN Document OCR', level: 'PROD', core: false },
      { name: 'GDAL', role: 'Satellite Raster Geospatial Engine', level: 'PROD', core: false },
      { name: 'Playwright', role: 'Automated Browser Verification', level: 'PROD', core: false },
    ],
  },
];
