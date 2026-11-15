import { Cpu, GraduationCap, MapPin, Radio, Terminal } from 'lucide-react';
import { GUSTO_PROFILE } from '@/data/portfolioData';
import {
  NeoBadge,
  NeoCard,
  NeoSectionHeader,
} from '@/components/ui/NeoBrutalPrimitives';
import { Phase1PrimitiveLab } from '@/components/phase1/Phase1PrimitiveLab';

const ENGINEERING_PILLARS = [
  {
    code: 'PILLAR_01',
    accent: 'yellow' as const,
    title: 'ASYNC BACKEND & GEOSPATIAL',
    description:
      'High-throughput Python FastAPI workers, Redis queues, PostGIS spatial pipelines, and fault-tolerant satellite telemetry calibration.',
  },
  {
    code: 'PILLAR_02',
    accent: 'mint' as const,
    title: 'REAL-TIME AI & RISK FORENSICS',
    description:
      'End-to-end fraud intelligence pipelines pairing graph topology, multi-factor ensemble scoring, LLM RAG verification, and LINE webhooks.',
  },
  {
    code: 'PILLAR_03',
    accent: 'coral' as const,
    title: 'PROCEDURAL WEBGL & AUDIO DSP',
    description:
      'Decoupled Pure Three.js worlds, custom GLSL procedural surface shaders, compositor-only 3D UI motion, and Web Audio DSP synthesis.',
  },
] as const;

/**
 * Section 01: System Architect Dossier (#architecture) + Searchable Phase 1 Design System Lab.
 */
export function AboutArchitectureSection() {
  return (
    <section
      id="architecture"
      tabIndex={-1}
      aria-labelledby="heading-architecture"
      className="scroll-mt-24 space-y-8"
    >
      <NeoSectionHeader
        indexCode="01 // ABOUT & ARCHITECTURE SYSTEM"
        title="SYSTEM ARCHITECT DOSSIER & UI LABORATORY"
        subtitle={GUSTO_PROFILE.storyLead}
        accent="yellow"
        headingId="heading-architecture"
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Narrative Dossier */}
        <NeoCard
          variant="white"
          headerVariant="yellow"
          windowTitle={`OPERATOR_DOSSIER // ${GUSTO_PROFILE.handle}`}
          windowTag={GUSTO_PROFILE.githubHandle}
          className="lg:col-span-7"
          bodyClassName="space-y-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <NeoBadge variant="dark" pulseDot dotVariant="mint">
              SYSTEM ARCHITECT
            </NeoBadge>
            <NeoBadge variant="mint">{GUSTO_PROFILE.alias}</NeoBadge>
          </div>

          <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {GUSTO_PROFILE.fullName} — {GUSTO_PROFILE.roleHeadline}
          </h3>

          <div className="space-y-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            {GUSTO_PROFILE.storyBody.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {GUSTO_PROFILE.telemetrySpecs.map((spec) => (
              <div
                key={spec.label}
                className="neo-border bg-[var(--bg-canvas)] p-3"
              >
                <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {spec.label}
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-[var(--text-primary)]">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </NeoCard>

        {/* Academic & Telemetry Specs */}
        <NeoCard
          variant="white"
          headerVariant="dark"
          windowTitle="ACADEMIC_NODE // TU_SE"
          windowTag="ACTIVE"
          className="lg:col-span-5"
          bodyClassName="flex flex-col justify-between gap-5"
        >
          <div className="space-y-4">
            <div className="neo-border bg-[var(--bg-canvas)] p-4">
              <div className="mb-1 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <GraduationCap className="size-4" aria-hidden="true" />
                <span>Academic Credentials</span>
              </div>
              <p className="font-display text-base font-bold text-[var(--text-primary)]">
                {GUSTO_PROFILE.university}
              </p>
              <p className="mt-1 font-mono text-xs font-semibold text-[var(--text-secondary)]">
                {GUSTO_PROFILE.program}
              </p>
              <p className="mt-1 font-mono text-xs font-bold text-[var(--text-primary)]">
                {GUSTO_PROFILE.yearLevel}
              </p>
            </div>

            <div className="neo-border bg-[var(--bg-canvas)] p-4">
              <div className="mb-1 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <MapPin className="size-4" aria-hidden="true" />
                <span>Base Location & Availability</span>
              </div>
              <p className="font-mono text-sm font-bold text-[var(--text-primary)]">
                {GUSTO_PROFILE.location}
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-[var(--text-secondary)]">
                <Radio className="size-3.5 text-[#00A896]" aria-hidden="true" />
                <span>Open to Backend, AI Systems &amp; Creative Tech roles</span>
              </p>
            </div>
          </div>

          <div className="neo-border bg-[#0A0A0A] p-4 font-mono text-xs text-[#FFFFFF]">
            <p className="font-bold text-[#FFE600]">
              {'// ARCHITECTURE_GUARANTEE'}
            </p>
            <p className="mt-1 text-neutral-300">
              Pure Three.js scene orchestration isolated from React reconcilers,
              layered onto semantic HTML5 landmarks and GPU-composited micro-motion.
            </p>
          </div>
        </NeoCard>
      </div>

      {/* 3 Engineering Pillars */}
      <div className="grid gap-5 md:grid-cols-3">
        {ENGINEERING_PILLARS.map((pillar) => (
          <NeoCard
            key={pillar.code}
            variant="white"
            headerVariant={pillar.accent}
            windowTitle={pillar.code}
            windowTag="CORE"
          >
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-[var(--text-primary)]">
                <Cpu className="size-4 shrink-0" aria-hidden="true" />
                <span>{pillar.title}</span>
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {pillar.description}
              </p>
            </div>
          </NeoCard>
        ))}
      </div>

      {/* Native Find-in-Page Searchable Disclosure for Phase 1 Primitive Lab */}
      <details className="neo-border bg-[var(--bg-surface)] neo-shadow-sm">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border-color)] px-5 py-4 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <Terminal className="size-4" aria-hidden="true" />
            <span>
              DESIGN SYSTEM // INSPECT PHASE 1 NEO-BRUTALIST PRIMITIVES &amp;
              TOKEN LAB
            </span>
          </span>
          <NeoBadge variant="yellow">EXPAND MODULE</NeoBadge>
        </summary>
        <div className="p-5 sm:p-6">
          <Phase1PrimitiveLab />
        </div>
      </details>
    </section>
  );
}
