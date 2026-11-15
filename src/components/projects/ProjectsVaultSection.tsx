'use client';

import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Box,
  Layers,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  FEATURED_PROJECTS,
  PROJECTS_DATA,
  type ProjectItem,
} from '@/data/portfolioData';
import {
  filterVaultProjects,
  type VaultCategoryFilter,
} from '@/lib/portfolioSectionControllers';
import {
  ACCENT_STYLES,
  NeoBadge,
  NeoButton,
  NeoCard,
  NeoSectionHeader,
} from '@/components/ui/NeoBrutalPrimitives';
import { ProjectTiltCard } from '@/components/projects/ProjectTiltCard';
import { ProjectVaultModal } from '@/components/projects/ProjectVaultModal';

export const GUSTO_INSPECT_PROJECT_EVENT = 'gusto:inspect-project';
export const GUSTO_FOCUS_3D_NODE_EVENT = 'gusto:focus-3d-node';

const VAULT_CATEGORY_FILTERS: readonly VaultCategoryFilter[] = [
  'ALL',
  'BACKEND & SATELLITE',
  'AI & FINTECH SECURITY',
  'FULLSTACK & AI PIPELINE',
  'LLM & RESEARCH',
  'MOBILE & OFFLINE-FIRST',
  'WEB AUDIO & CREATIVE TECH',
];

/**
 * Dispatches a global custom event asking ProjectsVaultSection to open the
 * top-layer architecture modal for `projectId`. Safe no-op in SSR/Node.
 */
export function dispatchInspectProject(projectId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<{ projectId: string }>(GUSTO_INSPECT_PROJECT_EVENT, {
      detail: { projectId },
    })
  );
}

/**
 * Dispatches a global custom event asking GustoCanvasStage to focus a
 * featured orbital node in the 3D scene. Safe no-op in SSR/Node.
 */
export function dispatchFocus3DNode(projectId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<{ projectId: string }>(GUSTO_FOCUS_3D_NODE_EVENT, {
      detail: { projectId },
    })
  );
}

/**
 * Resolves any project in `projects` by its exact ID, returning null if absent.
 */
export function resolveProjectById(
  projects: readonly ProjectItem[],
  projectId: string | null | undefined
): ProjectItem | null {
  if (!projectId) return null;
  return projects.find((project) => project.id === projectId) ?? null;
}

/**
 * Interactive Phase 4 Projects section combining Top 3 3D-tilt Featured cards,
 * a searchable/filterable 6-Project Engineering Vault, and top-layer <dialog>
 * specification inspector synced with GustoCanvasStage.
 */
export function ProjectsVaultSection() {
  const [inspectedProject, setInspectedProject] = useState<ProjectItem | null>(
    null
  );
  const [categoryFilter, setCategoryFilter] =
    useState<VaultCategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleInspectEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId?: string }>).detail;
      const matched = resolveProjectById(PROJECTS_DATA, detail?.projectId);
      if (matched) {
        setInspectedProject(matched);
      }
    };

    window.addEventListener(GUSTO_INSPECT_PROJECT_EVENT, handleInspectEvent);
    return () => {
      window.removeEventListener(
        GUSTO_INSPECT_PROJECT_EVENT,
        handleInspectEvent
      );
    };
  }, []);

  const handleFocusOrbitalNode = (projectId: string) => {
    dispatchFocus3DNode(projectId);
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('main-content')?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const filteredProjects = filterVaultProjects(PROJECTS_DATA, {
    category: categoryFilter,
    searchQuery,
  });

  const handleResetFilters = () => {
    setCategoryFilter('ALL');
    setSearchQuery('');
  };

  return (
    <section
      id="projects"
      aria-labelledby="heading-projects"
      className="neo-section-deferred scroll-mt-24 space-y-10"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <NeoSectionHeader
          indexCode="02 // FEATURED SYSTEMS & 6-PROJECT VAULT"
          title="SHIPPED PRODUCTION WORK & SYSTEMS VAULT"
          subtitle="Top 3 flagship engineering cores rendered with pointer-cached 3D tilt, followed by the full filterable 6-project architecture archive."
          accent="coral"
          headingId="heading-projects"
          className="flex-1"
        />
        <NeoButton href="#vault-explorer" variant="yellow" size="sm">
          INSPECT FULL VAULT (6)
        </NeoButton>
      </div>

      {/* Top 3 Flagship Featured Cards */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            FLAGSHIP ORBITAL CORES // TOP 3 FEATURED
          </h3>
          <NeoBadge variant="mint" pulseDot dotVariant="coral">
            3D TILT + TOP-LAYER SPEC READY
          </NeoBadge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {FEATURED_PROJECTS.map((project) => (
            <ProjectTiltCard
              key={project.id}
              project={project}
              onInspectProject={setInspectedProject}
              onFocusOrbitalNode={handleFocusOrbitalNode}
            />
          ))}
        </div>
      </div>

      {/* Full 6-Projects Engineering Vault Explorer */}
      <NeoCard
        variant="white"
        headerVariant="dark"
        windowTitle="FULL_VAULT_EXPLORER // 6_SYSTEMS_INDEXED"
        windowTag={`SHOWING ${filteredProjects.length}/${PROJECTS_DATA.length}`}
        className="scroll-mt-24"
        bodyClassName="space-y-6"
      >
        <div id="vault-explorer" className="scroll-mt-24 space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">
                FULL 6-PROJECTS ENGINEERING VAULT
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Filter by domain track or search across titles, roles, stack
                modules, and system architecture highlights.
              </p>
            </div>

            <div className="w-full lg:max-w-sm">
              <label
                htmlFor="vault-search-input"
                className="mb-1.5 block font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]"
              >
                Search Vault Modules & Architecture
              </label>
              <div className="relative flex items-center">
                <Search
                  className="pointer-events-none absolute left-3 size-4 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <input
                  id="vault-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Next.js, Python, Three.js, RAG, Web Audio..."
                  className="neo-border w-full bg-[var(--bg-canvas)] py-2 pr-3 pl-9 font-mono text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>
          </div>

          <div
            role="group"
            aria-label="Filter projects by engineering category"
            className="flex flex-wrap gap-2"
          >
            {VAULT_CATEGORY_FILTERS.map((category) => {
              const isSelected = categoryFilter === category;
              const matchCount = filterVaultProjects(PROJECTS_DATA, {
                category,
              }).length;

              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setCategoryFilter(category)}
                  className={`neo-btn-tactile cursor-pointer px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider ${
                    isSelected
                      ? 'bg-[#0A0A0A] text-[#FFFFFF]'
                      : 'bg-[var(--bg-canvas)] text-[var(--text-primary)]'
                  }`}
                >
                  {category} ({matchCount})
                </button>
              );
            })}
          </div>

          <p
            role="status"
            aria-live="polite"
            className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
          >
            VAULT INDEX: {filteredProjects.length} OF {PROJECTS_DATA.length}{' '}
            SYSTEMS MATCHING CRITERIA
          </p>

          {filteredProjects.length === 0 ? (
            <div className="neo-border flex flex-col items-start justify-between gap-4 bg-[var(--bg-canvas)] p-6 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <p className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  NO SYSTEMS MATCH ACTIVE FILTER QUERY
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Clear the search query or switch back to ALL categories to
                  restore all 6 production systems.
                </p>
              </div>
              <NeoButton
                type="button"
                variant="yellow"
                size="sm"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw className="size-3.5" />}
              >
                RESET FILTERS
              </NeoButton>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredProjects.map((project) => {
                const accentToken = ACCENT_STYLES[project.accent];

                return (
                  <article
                    key={project.id}
                    className="neo-border flex h-full flex-col justify-between gap-4 bg-[var(--bg-canvas)] p-5"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <NeoBadge variant={project.accent}>
                          {project.category}
                        </NeoBadge>
                        <span className="font-mono text-[11px] font-bold text-[var(--text-muted)]">
                          {project.period}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-display text-xl font-bold text-[var(--text-primary)]">
                          {project.title}
                        </h4>
                        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          {project.subtitle} · {project.role}
                        </p>
                      </div>

                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        {project.summary}
                      </p>

                      <dl className="grid grid-cols-3 gap-2">
                        {project.metrics.map((metric) => (
                          <div
                            key={metric.label}
                            className="border border-[var(--ui-border-color)] bg-[var(--bg-surface)] p-2"
                          >
                            <dt className="font-mono text-[10px] font-bold uppercase text-[var(--text-muted)]">
                              {metric.label}
                            </dt>
                            <dd className="mt-0.5 font-mono text-xs font-bold text-[var(--text-primary)]">
                              {metric.value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      {project.architectureHighlights[0] ? (
                        <p className="flex items-start gap-2 border border-[var(--ui-border-color)] bg-[var(--bg-surface)] p-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                          <Layers
                            className="mt-0.5 size-3.5 shrink-0"
                            style={{ color: accentToken.dotColor }}
                            aria-hidden="true"
                          />
                          <span>{project.architectureHighlights[0]}</span>
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-1.5">
                        {project.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="border border-[var(--ui-border-color)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-primary)]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t-2 border-[var(--ui-border-color)] pt-3">
                      <NeoButton
                        type="button"
                        variant={project.accent}
                        size="sm"
                        onClick={() => setInspectedProject(project)}
                        rightIcon={<ArrowUpRight className="size-3.5" />}
                      >
                        OPEN ARCHITECTURE SPEC
                      </NeoButton>

                      {project.featured ? (
                        <NeoButton
                          type="button"
                          variant="white"
                          size="sm"
                          onClick={() => handleFocusOrbitalNode(project.id)}
                          leftIcon={<Box className="size-3.5" />}
                        >
                          FOCUS 3D NODE
                        </NeoButton>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </NeoCard>

      <ProjectVaultModal
        project={inspectedProject}
        allProjects={PROJECTS_DATA}
        onClose={() => setInspectedProject(null)}
        onSelectProject={(nextProject) => setInspectedProject(nextProject)}
      />
    </section>
  );
}
