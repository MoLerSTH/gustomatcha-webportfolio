'use client';

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowUpRight, Box, Layers } from 'lucide-react';
import type { ProjectItem } from '@/data/portfolioData';
import {
  computeCardTiltTransform,
  type RectLike,
} from '@/lib/portfolioSectionControllers';
import {
  ACCENT_STYLES,
  NeoBadge,
  NeoButton,
  NeoCard,
} from '@/components/ui/NeoBrutalPrimitives';

export interface ProjectTiltCardProps {
  project: ProjectItem;
  onInspectProject: (project: ProjectItem) => void;
  onFocusOrbitalNode?: (projectId: string) => void;
}

/**
 * Interactive 3D-tilt Neo-Brutalist portfolio card with cached rect geometry.
 * Uses CSS custom properties for compositor-only 60fps transforms without React re-renders.
 */
export function ProjectTiltCard({
  project,
  onInspectProject,
  onFocusOrbitalNode,
}: ProjectTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cachedRectRef = useRef<RectLike | null>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mediaQuery.matches;

    const handleMotionChange = () => {
      reducedMotionRef.current = mediaQuery.matches;
      if (reducedMotionRef.current && cardRef.current) {
        cardRef.current.removeAttribute('data-tilting');
        cardRef.current.style.setProperty('--card-rx', '0deg');
        cardRef.current.style.setProperty('--card-ry', '0deg');
      }
    };

    const invalidateCachedRect = () => {
      cachedRectRef.current = null;
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    window.addEventListener('scroll', invalidateCachedRect, { passive: true });
    window.addEventListener('resize', invalidateCachedRect, { passive: true });

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('scroll', invalidateCachedRect);
      window.removeEventListener('resize', invalidateCachedRect);
    };
  }, []);

  const applyTilt = (clientX: number, clientY: number) => {
    const el = cardRef.current;
    if (!el || reducedMotionRef.current) return;

    if (!cachedRectRef.current) {
      cachedRectRef.current = el.getBoundingClientRect();
    }

    const state = computeCardTiltTransform({
      clientX,
      clientY,
      rect: cachedRectRef.current,
      prefersReducedMotion: reducedMotionRef.current,
    });

    el.style.setProperty('--card-rx', `${state.rotateXDeg}deg`);
    el.style.setProperty('--card-ry', `${state.rotateYDeg}deg`);
    el.style.setProperty('--card-glare-x', `${state.glareXPercent}%`);
    el.style.setProperty('--card-glare-y', `${state.glareYPercent}%`);
    if (state.isActive) {
      el.setAttribute('data-tilting', 'true');
    } else {
      el.removeAttribute('data-tilting');
    }
  };

  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || reducedMotionRef.current || !cardRef.current) {
      return;
    }
    cachedRectRef.current = cardRef.current.getBoundingClientRect();
    applyTilt(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || reducedMotionRef.current) {
      return;
    }
    applyTilt(event.clientX, event.clientY);
  };

  const handlePointerLeave = () => {
    cachedRectRef.current = null;
    const el = cardRef.current;
    if (!el) return;
    el.removeAttribute('data-tilting');
    el.style.setProperty('--card-rx', '0deg');
    el.style.setProperty('--card-ry', '0deg');
    el.style.setProperty('--card-glare-x', '50%');
    el.style.setProperty('--card-glare-y', '50%');
  };

  const accentToken = ACCENT_STYLES[project.accent];

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="neo-tilt-card relative h-full"
    >
      <NeoCard
        as="article"
        interactive
        headerVariant={project.accent}
        windowTitle={project.orbitalNodeLabel ?? project.slug.toUpperCase()}
        windowTag={project.period}
        className="relative flex h-full flex-col"
        bodyClassName="flex flex-1 flex-col justify-between gap-5"
      >
        <div aria-hidden="true" className="neo-tilt-glare absolute inset-0 z-20" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <NeoBadge variant={project.accent}>{project.category}</NeoBadge>
            {project.featured ? (
              <NeoBadge variant="dark" pulseDot dotVariant={project.accent}>
                FEATURED CORE
              </NeoBadge>
            ) : null}
          </div>

          <header className="space-y-1.5">
            <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {project.title}
            </h3>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {project.subtitle}
            </p>
            <p className="font-mono text-xs text-[var(--text-muted)]">
              Role: {project.role}
            </p>
          </header>

          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {project.summary}
          </p>

          <dl className="grid grid-cols-3 gap-2">
            {project.metrics.map((metric) => (
              <div
                key={metric.label}
                className="neo-border bg-[var(--bg-canvas)] p-2.5"
              >
                <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {metric.label}
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-[var(--text-primary)]">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>

          {project.architectureHighlights[0] ? (
            <div className="neo-border bg-[var(--bg-canvas)] p-3">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <span
                  aria-hidden="true"
                  className="inline-block size-2 border border-[var(--ui-border-color)]"
                  style={{ backgroundColor: accentToken.dotColor }}
                />
                <Layers className="size-3.5" aria-hidden="true" />
                <span>Primary Highlight</span>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {project.architectureHighlights[0]}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="border border-[var(--ui-border-color)] bg-[var(--bg-canvas)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-primary)]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <footer className="relative z-10 flex flex-wrap items-center gap-2 border-t-2 border-[var(--ui-border-color)] pt-4">
          <NeoButton
            type="button"
            variant={project.accent}
            size="sm"
            onClick={() => onInspectProject(project)}
            rightIcon={<ArrowUpRight className="size-3.5" />}
          >
            INSPECT ARCHITECTURE
          </NeoButton>

          {project.featured && onFocusOrbitalNode ? (
            <NeoButton
              type="button"
              variant="white"
              size="sm"
              onClick={() => onFocusOrbitalNode(project.id)}
              leftIcon={<Box className="size-3.5" />}
            >
              FOCUS 3D NODE
            </NeoButton>
          ) : null}
        </footer>
      </NeoCard>
    </div>
  );
}
