'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type SyntheticEvent,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  ExternalLink,
  Layers,
  X,
} from 'lucide-react';
import type { ProjectItem } from '@/data/portfolioData';
import { canTransitionDisplay } from '@/components/hero/TerminalBootOverlay';
import { isPointOutsideDialogRect } from '@/lib/portfolioSectionControllers';
import {
  ACCENT_STYLES,
  NeoBadge,
  NeoButton,
} from '@/components/ui/NeoBrutalPrimitives';

export interface ProjectVaultModalProps {
  project: ProjectItem | null;
  allProjects: readonly ProjectItem[];
  onClose: () => void;
  onSelectProject: (project: ProjectItem) => void;
}

/**
 * Checks browser capability for native top-layer discrete transitions.
 */
export function supportsTopLayerExit(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof CSS === 'undefined' ||
    typeof CSS.supports !== 'function'
  ) {
    return false;
  }

  return (
    canTransitionDisplay() &&
    CSS.supports('transition-behavior', 'allow-discrete') &&
    CSS.supports('overlay', 'auto')
  );
}

/**
 * Cycles backwards or forwards cleanly across the project vault.
 */
export function resolveAdjacentProject(
  projects: readonly ProjectItem[],
  currentId: string,
  direction: 'prev' | 'next'
): ProjectItem | null {
  if (projects.length === 0) {
    return null;
  }

  const currentIndex = projects.findIndex((item) => item.id === currentId);
  if (currentIndex === -1) {
    return projects[0] ?? null;
  }

  const step = direction === 'next' ? 1 : -1;
  const targetIndex = (currentIndex + step + projects.length) % projects.length;
  return projects[targetIndex] ?? null;
}

/**
 * Plays a [data-closing] transition while waiting on active subtree CSS animations
 * with a fallback timeout cap, then closes the native modal dialog.
 */
export async function closeDialogWithTransition(
  dialogEl: HTMLDialogElement | null,
  onClosed?: () => void,
  fallbackTimeoutMs = 280
): Promise<void> {
  if (!dialogEl || !dialogEl.open) {
    onClosed?.();
    return;
  }

  if (dialogEl.hasAttribute('data-closing')) {
    return;
  }

  dialogEl.setAttribute('data-closing', '');

  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

  try {
    const animations = dialogEl.getAnimations?.({ subtree: true }) ?? [];
    if (animations.length > 0) {
      const finishedPromise = Promise.allSettled(
        animations.map((animation) => animation.finished)
      );
      const timeoutPromise = new Promise<void>((resolve) => {
        fallbackTimer = setTimeout(resolve, fallbackTimeoutMs);
      });
      await Promise.race([finishedPromise, timeoutPromise]);
    }
  } finally {
    if (fallbackTimer !== undefined) {
      clearTimeout(fallbackTimer);
    }
    dialogEl.removeAttribute('data-closing');
  }

  if (dialogEl.open) {
    if ('returnValue' in dialogEl) {
      dialogEl.returnValue = '';
    }
    dialogEl.close();
  }

  onClosed?.();
}

/**
 * Native top-layer <dialog> inspecting a single project's architecture breakdown.
 */
export function ProjectVaultModal({
  project,
  allProjects,
  onClose,
  onSelectProject,
}: ProjectVaultModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handledByTransitionRef = useRef(false);
  const pressedOutsideRef = useRef(false);

  const requestAnimatedClose = useCallback(async () => {
    const dialog = dialogRef.current;
    handledByTransitionRef.current = true;
    try {
      await closeDialogWithTransition(dialog, onClose);
    } finally {
      handledByTransitionRef.current = false;
    }
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (project) {
      dialog.removeAttribute('data-closing');
      if (!dialog.open) {
        dialog.showModal();
        const closeTrigger = dialog.querySelector<HTMLElement>(
          '[data-dialog-close]'
        );
        if (closeTrigger && !dialog.contains(document.activeElement)) {
          closeTrigger.focus({ preventScroll: true });
        }
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [project]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !project) return;

    // Older Safari/Firefox builds lack native `closedby="any"`; require both
    // pointerdown and pointerup outside the dialog box so drags do not dismiss.
    const supportsNativeClosedBy = 'closedBy' in HTMLDialogElement.prototype;
    if (supportsNativeClosedBy) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || event.target !== dialog) {
        pressedOutsideRef.current = false;
        return;
      }
      pressedOutsideRef.current = isPointOutsideDialogRect(
        event.clientX,
        event.clientY,
        dialog.getBoundingClientRect()
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      const wasPressedOutside = pressedOutsideRef.current;
      pressedOutsideRef.current = false;

      if (!wasPressedOutside || event.target !== dialog) {
        return;
      }

      const releasedOutside = isPointOutsideDialogRect(
        event.clientX,
        event.clientY,
        dialog.getBoundingClientRect()
      );
      if (releasedOutside) {
        void requestAnimatedClose();
      }
    };

    const handlePointerCancel = () => {
      pressedOutsideRef.current = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    dialog.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
      dialog.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [project, requestAnimatedClose]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    void requestAnimatedClose();
  };

  const handleNativeClose = () => {
    const dialog = dialogRef.current;
    if (dialog && 'returnValue' in dialog) {
      dialog.returnValue = '';
    }
    if (!handledByTransitionRef.current) {
      onClose();
    }
  };

  const prevProject = project
    ? resolveAdjacentProject(allProjects, project.id, 'prev')
    : null;
  const nextProject = project
    ? resolveAdjacentProject(allProjects, project.id, 'next')
    : null;
  const accentToken = project ? ACCENT_STYLES[project.accent] : ACCENT_STYLES.yellow;

  return (
    <dialog
      ref={dialogRef}
      id="project-vault-dialog"
      aria-labelledby={project ? 'vault-modal-title' : undefined}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      className="neo-dialog w-[min(56rem,calc(100vw-2rem))] border-2 border-[var(--ui-border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] neo-shadow-lg"
      {...({ closedby: 'any' } as Record<string, string>)}
    >
      {project ? (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden bg-[var(--bg-surface)]">
          <header
            className={`flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--ui-border-color)] px-5 py-3.5 ${accentToken.headerBgClass}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                {project.orbitalNodeLabel ?? project.slug.toUpperCase()}
              </span>
              <span className="neo-border bg-[var(--bg-canvas)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--text-primary)]">
                {project.period}
              </span>
            </div>

            <NeoButton
              type="button"
              variant="dark"
              size="sm"
              data-dialog-close=""
              onClick={() => {
                void requestAnimatedClose();
              }}
              leftIcon={<X className="size-3.5" />}
            >
              CLOSE
            </NeoButton>
          </header>

          <div
            key={project.id}
            className="flex-1 space-y-6 overflow-y-auto overscroll-y-contain p-5 sm:p-6"
          >
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <NeoBadge variant={project.accent}>{project.category}</NeoBadge>
                {project.featured ? (
                  <NeoBadge variant="dark" pulseDot dotVariant={project.accent}>
                    FEATURED VAULT ENTRY
                  </NeoBadge>
                ) : null}
              </div>

              <h2
                id="vault-modal-title"
                className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl"
              >
                {project.title}
              </h2>

              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {project.subtitle} · {project.role}
              </p>

              <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                {project.summary}
              </p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-3">
              {project.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="neo-border bg-[var(--bg-canvas)] p-3"
                >
                  <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {metric.label}
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-bold text-[var(--text-primary)]">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="vault-highlights-heading" className="space-y-3">
              <h3
                id="vault-highlights-heading"
                className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]"
              >
                <Layers className="size-4" aria-hidden="true" />
                <span>Architecture Highlights</span>
              </h3>

              <ul className="space-y-2">
                {project.architectureHighlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="neo-border bg-[var(--bg-canvas)] p-3 text-sm leading-relaxed text-[var(--text-secondary)]"
                  >
                    <span className="mr-2 font-mono font-bold text-[var(--text-primary)]">
                      ▸
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="vault-stack-heading" className="space-y-2.5">
              <h3
                id="vault-stack-heading"
                className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]"
              >
                <Cpu className="size-4" aria-hidden="true" />
                <span>Verified Tech Stack</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="neo-border bg-[var(--bg-canvas)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--text-primary)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[var(--ui-border-color)] bg-[var(--bg-canvas)] px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              {prevProject ? (
                <NeoButton
                  type="button"
                  variant="white"
                  size="sm"
                  onClick={() => onSelectProject(prevProject)}
                  leftIcon={<ChevronLeft className="size-3.5" />}
                >
                  PREV PROJECT
                </NeoButton>
              ) : null}
              {nextProject ? (
                <NeoButton
                  type="button"
                  variant="white"
                  size="sm"
                  onClick={() => onSelectProject(nextProject)}
                  rightIcon={<ChevronRight className="size-3.5" />}
                >
                  NEXT PROJECT
                </NeoButton>
              ) : null}
            </div>

            <NeoButton
              href={project.githubUrl}
              external
              variant={project.accent}
              size="sm"
              rightIcon={<ExternalLink className="size-3.5" />}
            >
              VIEW SOURCE REPO
            </NeoButton>
          </footer>
        </div>
      ) : null}
    </dialog>
  );
}
