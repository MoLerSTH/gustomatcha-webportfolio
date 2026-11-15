'use client';

import { useState } from 'react';
import { ArrowUpRight, Layers } from 'lucide-react';
import { PROJECTS_DATA, TECH_STACK_MATRIX } from '@/data/portfolioData';
import { buildSkillProjectMap } from '@/lib/portfolioSectionControllers';
import {
  NeoBadge,
  NeoCard,
  NeoSectionHeader,
} from '@/components/ui/NeoBrutalPrimitives';
import { dispatchInspectProject } from '@/components/projects/ProjectsVaultSection';

/**
 * Section 04: Interactive Tech Stack Matrix (#stack) with direct project vault links.
 */
export function TechStackMatrixSection() {
  const [coreOnly, setCoreOnly] = useState(false);

  const skillProjectMap = buildSkillProjectMap(PROJECTS_DATA, TECH_STACK_MATRIX);

  const handleInspectLinkedProject = (projectId: string) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('projects')?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    dispatchInspectProject(projectId);
  };

  return (
    <section
      id="stack"
      aria-labelledby="heading-stack"
      className="neo-section-deferred space-y-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <NeoSectionHeader
          indexCode="04 // TECH STACK MATRIX & SKILL CROSS-REFERENCES"
          title="VERIFIED PRODUCTION STACK & ARCHITECTURE LINKS"
          subtitle="Core languages, frameworks, and tools cross-referenced directly to shipped projects in the 6-System Vault."
          accent="cobalt"
          headingId="heading-stack"
          className="flex-1"
        />

        <div
          role="group"
          aria-label="Filter skill proficiency display"
          className="flex shrink-0 items-center gap-2"
        >
          <button
            type="button"
            aria-pressed={!coreOnly}
            onClick={() => setCoreOnly(false)}
            className={`neo-btn-tactile cursor-pointer px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
              !coreOnly
                ? 'bg-[#0A0A0A] text-[#FFFFFF]'
                : 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
            }`}
          >
            ALL MODULES
          </button>
          <button
            type="button"
            aria-pressed={coreOnly}
            onClick={() => setCoreOnly(true)}
            className={`neo-btn-tactile cursor-pointer px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
              coreOnly
                ? 'bg-[#0A0A0A] text-[#FFFFFF]'
                : 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
            }`}
          >
            CORE ONLY
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {TECH_STACK_MATRIX.map((group) => {
          const visibleSkills = coreOnly
            ? group.skills.filter((skill) => skill.core)
            : group.skills;

          return (
            <NeoCard
              key={group.code}
              variant="white"
              headerVariant={group.accent}
              windowTitle={group.code}
              windowTag={`${visibleSkills.length} MODULES`}
              bodyClassName="space-y-3"
            >
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-[var(--text-primary)]">
                <Layers className="size-4 shrink-0" aria-hidden="true" />
                <span>{group.category}</span>
              </h3>

              <ul className="space-y-3">
                {visibleSkills.map((skill) => {
                  const linkedProjects = skillProjectMap[skill.name] ?? [];

                  return (
                    <li
                      key={skill.name}
                      className="neo-border space-y-2 bg-[var(--bg-canvas)] p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
                          {skill.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {skill.core ? (
                            <NeoBadge variant={group.accent}>CORE</NeoBadge>
                          ) : null}
                          <span className="border border-[var(--ui-border-color)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[var(--text-muted)]">
                            {skill.level}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                        {skill.role}
                      </p>

                      {linkedProjects.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="font-mono text-[10px] font-bold uppercase text-[var(--text-muted)]">
                            Projects:
                          </span>
                          {linkedProjects.map((project) => (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() =>
                                handleInspectLinkedProject(project.id)
                              }
                              className="inline-flex cursor-pointer items-center gap-1 border border-[var(--ui-border-color)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[var(--text-primary)] transition-colors hover:bg-[#FFE600] hover:text-[#0A0A0A]"
                            >
                              <span>{project.title.split(' ')[0]}</span>
                              <ArrowUpRight
                                className="size-3"
                                aria-hidden="true"
                              />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </NeoCard>
          );
        })}
      </div>
    </section>
  );
}
