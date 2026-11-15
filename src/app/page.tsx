import { ArrowUpRight, Code2, GraduationCap, Mail, Terminal } from 'lucide-react';
import {
  EXPERIENCE_TIMELINE,
  FEATURED_PROJECTS,
  GUSTO_PROFILE,
  PROJECTS_DATA,
  TECH_STACK_MATRIX,
} from '@/data/portfolioData';
import {
  NeoBadge,
  NeoButton,
  NeoCard,
  NeoSectionHeader,
} from '@/components/ui/NeoBrutalPrimitives';
import { NeoNavbar } from '@/components/ui/NeoNavbar';
import { Phase1PrimitiveLab } from '@/components/phase1/Phase1PrimitiveLab';
import { GustoCanvasStage } from '@/components/three/GustoCanvasStage';

export default function HomePage() {
  return (
    <>
      <NeoNavbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 space-y-20">
        {/* HERO FOUNDATION SHELL */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <NeoBadge variant="yellow" pulseDot dotVariant="coral">
                PHASE 1 // FOUNDATION &amp; DESIGN SYSTEM
              </NeoBadge>
              <NeoBadge variant="mint">{GUSTO_PROFILE.handle}</NeoBadge>
              <NeoBadge variant="white">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="size-3.5" aria-hidden="true" />
                  TU_SE (TEP/TEPE) YR.3
                </span>
              </NeoBadge>
            </div>

            <h1
              id="main-content"
              tabIndex={-1}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.03]"
            >
              Hi, I&apos;m{' '}
              <span className="inline-block border-[3px] border-[var(--ui-border-color)] bg-[#FFE600] text-[#0A0A0A] px-3 py-0.5 neo-shadow-sm">
                {GUSTO_PROFILE.alias}
              </span>{' '}
              — {GUSTO_PROFILE.fullName}
            </h1>

            <p className="max-w-2xl text-lg sm:text-xl text-[var(--ink-muted)] leading-relaxed">
              {GUSTO_PROFILE.storyLead}
            </p>

            <div className="flex flex-wrap gap-3.5 pt-1">
              <NeoButton
                href="#projects"
                variant="yellow"
                size="lg"
                rightIcon={<ArrowUpRight className="size-5" />}
              >
                VIEW {PROJECTS_DATA.length} PROJECTS VAULT
              </NeoButton>
              <NeoButton
                href={GUSTO_PROFILE.githubUrl}
                external
                variant="white"
                size="lg"
                leftIcon={<Code2 className="size-5" />}
              >
                GITHUB // {GUSTO_PROFILE.githubHandle}
              </NeoButton>
              <NeoButton
                href={`mailto:${GUSTO_PROFILE.email}`}
                variant="mint"
                size="lg"
                leftIcon={<Mail className="size-5" />}
              >
                DIRECT UPLINK
              </NeoButton>
            </div>
          </div>

          {/* 3D PROCEDURAL STAGE & TELEMETRY */}
          <div className="lg:col-span-5">
            <GustoCanvasStage />
          </div>
        </section>

        {/* SECTION 01: DESIGN SYSTEM PRIMITIVES LAB */}
        <section id="architecture" className="space-y-8">
          <NeoSectionHeader
            indexCode="01 // DESIGN SYSTEM & PRIMITIVES"
            headingId="heading-architecture"
            title="Friendly Neo-Brutalist UI Architecture"
            subtitle="Reusable tactile UI components, WCAG AA contrast tokens, reduced-motion safety, and blueprint theme reactivity verified in Phase 1."
            accent="yellow"
          />
          <Phase1PrimitiveLab />
        </section>

        {/* SECTION 02: TOP 3 FEATURED PROJECTS DATA PREVIEW */}
        <section id="projects" className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <NeoSectionHeader
              indexCode="02 // FEATURED SYSTEMS (3 OF 6)"
              headingId="heading-projects"
              title="Production Backends, Risk Engines & AI Pipelines"
              subtitle="Zero-placeholder typed dataset ready for 3D-tilt floating cards, Three.js raycasting node triggers, and the full 6+ projects drawer in Phase 4."
              accent="mint"
            />
            <NeoBadge variant="coral">TOTAL VAULT: {PROJECTS_DATA.length} PROJECTS</NeoBadge>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {FEATURED_PROJECTS.map((project) => (
              <NeoCard
                key={project.id}
                as="article"
                interactive
                variant="white"
                headerVariant={project.accent}
                windowTitle={project.orbitalNodeLabel ?? `HIGHLIGHT_0${project.highlightOrder}`}
                windowTag={project.period}
              >
                <div className="flex h-full flex-col justify-between gap-5">
                  <div className="space-y-3">
                    <div className="font-mono text-xs font-bold uppercase text-[var(--ink-muted)]">
                      {project.category}
                    </div>
                    <h3 className="text-xl font-bold tracking-tight leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                      {project.summary}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="border-2 border-[var(--ui-border-color)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs font-semibold"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="border-t-2 border-[var(--ui-border-color)] pt-3 font-mono text-xs font-bold flex items-center justify-between gap-2">
                      <span>{project.accessLabel}</span>
                      <span aria-hidden="true">NODE #{project.highlightOrder}</span>
                    </div>
                  </div>
                </div>
              </NeoCard>
            ))}
          </div>
        </section>

        {/* SECTION 03: EXPERIENCE TIMELINE PREVIEW */}
        <section id="experience" className="space-y-8">
          <NeoSectionHeader
            indexCode="03 // INTERNSHIPS & COMPETITIVE TRACK"
            headingId="heading-experience"
            title="Real-World Engineering & Hackathon Pressure"
            subtitle="From calibrating national satellite imagery at GISTDA and LLM services at ASR Lab to KBTG Kampus 2026 and ICPC Thailand."
            accent="coral"
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {EXPERIENCE_TIMELINE.map((exp) => (
              <NeoCard
                key={exp.id}
                as="article"
                variant="white"
                headerVariant={exp.accent}
                windowTitle={exp.type}
                windowTag={exp.period}
              >
                <div className="space-y-3">
                  <h3 className="text-lg font-bold tracking-tight">{exp.title}</h3>
                  <div className="font-mono text-xs font-bold text-[var(--ink-muted)]">
                    {exp.organization}
                  </div>
                  <p className="text-sm text-[var(--ink-muted)]">{exp.summary}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {exp.techTags.map((tag) => (
                      <span
                        key={tag}
                        className="border-2 border-[var(--ui-border-color)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </NeoCard>
            ))}
          </div>
        </section>

        {/* SECTION 04: TECH STACK MATRIX */}
        <section id="stack" className="space-y-8">
          <NeoSectionHeader
            indexCode="04 // TECH STACK MATRIX"
            headingId="heading-stack"
            title="Core Engineering Arsenal"
            subtitle="Battle-tested backend concurrency, fullstack type safety, procedural WebGL shaders, and Linux/Docker infrastructure."
            accent="cobalt"
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {TECH_STACK_MATRIX.map((group) => (
              <NeoCard
                key={group.id}
                variant="white"
                headerVariant={group.accent}
                windowTitle={group.code}
                windowTag={`${group.skills.length} MODULES`}
              >
                <h3 className="mb-4 font-mono text-sm font-bold uppercase tracking-wider">
                  {group.category}
                </h3>
                <ul className="space-y-3">
                  {group.skills.map((skill) => (
                    <li
                      key={skill.name}
                      className="flex items-center justify-between gap-3 border-2 border-[var(--ui-border-color)] bg-[var(--bg-surface)] px-3 py-2"
                    >
                      <div>
                        <div className="font-bold text-sm">{skill.name}</div>
                        <div className="text-xs text-[var(--ink-muted)]">{skill.role}</div>
                      </div>
                      <NeoBadge variant={skill.core ? group.accent : 'white'}>
                        {skill.level}
                      </NeoBadge>
                    </li>
                  ))}
                </ul>
              </NeoCard>
            ))}
          </div>
        </section>

        {/* SECTION 05: CONTACT UPLINK */}
        <section id="contact">
          <NeoCard
            variant="white"
            headerVariant="yellow"
            windowTitle="COMMS_UPLINK // DIRECT_DISPATCH"
            windowTag="THAMMASAT // THAILAND"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <h2 id="heading-contact" className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Ready to Architect Something Unforgettable?
                </h2>
                <p className="max-w-2xl text-sm sm:text-base text-[var(--ink-muted)]">
                  Reach out directly via <span className="font-mono font-bold text-[var(--ink)]">{GUSTO_PROFILE.email}</span> or inspect repositories at{' '}
                  <span className="font-mono font-bold text-[var(--ink)]">github.com/{GUSTO_PROFILE.githubHandle}</span>.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <NeoButton
                  href={`mailto:${GUSTO_PROFILE.email}`}
                  variant="yellow"
                  size="md"
                  leftIcon={<Mail className="size-4" />}
                >
                  {GUSTO_PROFILE.email}
                </NeoButton>
                <NeoButton
                  href={GUSTO_PROFILE.githubUrl}
                  external
                  variant="mint"
                  size="md"
                  leftIcon={<Terminal className="size-4" />}
                >
                  GITHUB // MoLerSTH
                </NeoButton>
              </div>
            </div>
          </NeoCard>
        </section>
      </main>

      <footer className="border-t-[3px] border-[var(--ui-border-color)] bg-[var(--bg-surface)] mt-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 font-mono text-xs">
          <div className="font-bold">
            GUSTO_OS v2.6 // {GUSTO_PROFILE.fullName} ({GUSTO_PROFILE.githubHandle})
          </div>
          <div className="text-[var(--ink-muted)]">
            {GUSTO_PROFILE.program} • {GUSTO_PROFILE.university}
          </div>
        </div>
      </footer>
    </>
  );
}
