import type {
  ExperienceItem,
  ProjectCategory,
  ProjectItem,
  TechSkillCategory,
} from '@/data/portfolioData';

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CardTiltInput {
  clientX: number;
  clientY: number;
  rect: RectLike | null;
  maxTiltDeg?: number;
  prefersReducedMotion?: boolean;
}

export interface CardTiltState {
  rotateXDeg: number;
  rotateYDeg: number;
  glareXPercent: number;
  glareYPercent: number;
  isActive: boolean;
}

export type VaultCategoryFilter = ProjectCategory | 'ALL';

export interface VaultFilterInput {
  category?: VaultCategoryFilter;
  searchQuery?: string;
  onlyFeatured?: boolean;
}

export type ExperienceFilterType = 'ALL' | ExperienceItem['type'];

export interface ExperienceTrackCounts {
  ALL: number;
  INTERNSHIP: number;
  HACKATHON: number;
  COMPETITION: number;
}

const DEFAULT_TILT_STATE: CardTiltState = {
  rotateXDeg: 0,
  rotateYDeg: 0,
  glareXPercent: 50,
  glareYPercent: 50,
  isActive: false,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function hasValidRect(rect: RectLike | null | undefined): rect is RectLike {
  return Boolean(
    rect &&
      Number.isFinite(rect.left) &&
      Number.isFinite(rect.top) &&
      Number.isFinite(rect.width) &&
      Number.isFinite(rect.height) &&
      rect.width > 0 &&
      rect.height > 0
  );
}

/**
 * Computes bounded 3D perspective tilt angles and glare focus percentages
 * from pointer coordinates against a cached element bounding rect.
 */
export function computeCardTiltTransform({
  clientX,
  clientY,
  rect,
  maxTiltDeg = 7,
  prefersReducedMotion = false,
}: CardTiltInput): CardTiltState {
  if (
    prefersReducedMotion ||
    !hasValidRect(rect) ||
    !Number.isFinite(clientX) ||
    !Number.isFinite(clientY)
  ) {
    return DEFAULT_TILT_STATE;
  }

  const safeMaxTilt =
    Number.isFinite(maxTiltDeg) && maxTiltDeg > 0 ? maxTiltDeg : 0;

  const nx = clamp01((clientX - rect.left) / rect.width);
  const ny = clamp01((clientY - rect.top) / rect.height);

  const rotateXDeg = Number(((0.5 - ny) * 2 * safeMaxTilt).toFixed(2)) || 0;
  const rotateYDeg = Number(((nx - 0.5) * 2 * safeMaxTilt).toFixed(2)) || 0;
  const glareXPercent = Number((nx * 100).toFixed(2)) || 0;
  const glareYPercent = Number((ny * 100).toFixed(2)) || 0;

  return {
    rotateXDeg,
    rotateYDeg,
    glareXPercent,
    glareYPercent,
    isActive: true,
  };
}

/**
 * Hit-tests whether a pointer coordinate lies strictly outside the visible
 * `<dialog>` box (used by the Safari/older-browser light-dismiss fallback).
 */
export function isPointOutsideDialogRect(
  clientX: number,
  clientY: number,
  rect: RectLike | null
): boolean {
  if (!hasValidRect(rect) || !Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return false;
  }

  return (
    clientX < rect.left ||
    clientX > rect.left + rect.width ||
    clientY < rect.top ||
    clientY > rect.top + rect.height
  );
}

/**
 * Filters `PROJECTS_DATA` deterministically by featured flag, project category,
 * and case-insensitive substring query across metadata, stack, and metrics.
 */
export function filterVaultProjects(
  projects: readonly ProjectItem[],
  filter: VaultFilterInput = {}
): ProjectItem[] {
  const { category = 'ALL', searchQuery = '', onlyFeatured = false } = filter;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return projects.filter((project) => {
    if (onlyFeatured && !project.featured) {
      return false;
    }
    if (category !== 'ALL' && project.category !== category) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      project.title,
      project.subtitle,
      project.role,
      project.category,
      project.summary,
      ...project.techStack,
      ...project.metrics.flatMap((m) => [m.label, m.value]),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

/**
 * Filters `EXPERIENCE_TIMELINE` entries by competitive/internship track.
 */
export function filterExperienceTimeline(
  items: readonly ExperienceItem[],
  typeFilter: ExperienceFilterType = 'ALL'
): ExperienceItem[] {
  if (typeFilter === 'ALL') {
    return [...items];
  }
  return items.filter((item) => item.type === typeFilter);
}

/**
 * Counts entries per experience track for filter pill badges.
 */
export function computeExperienceTrackCounts(
  items: readonly ExperienceItem[]
): ExperienceTrackCounts {
  const counts: ExperienceTrackCounts = {
    ALL: items.length,
    INTERNSHIP: 0,
    HACKATHON: 0,
    COMPETITION: 0,
  };

  for (const item of items) {
    counts[item.type] += 1;
  }

  return counts;
}

/**
 * Maps each skill name in `TECH_STACK_MATRIX` to every real project in
 * `PROJECTS_DATA` that employs that technology.
 */
export function buildSkillProjectMap(
  projects: readonly ProjectItem[],
  matrix: readonly TechSkillCategory[]
): Record<string, ProjectItem[]> {
  const map: Record<string, ProjectItem[]> = {};

  for (const group of matrix) {
    for (const skill of group.skills) {
      const needle = skill.name.trim().toLowerCase();
      map[skill.name] = projects.filter((project) => {
        if (project.techStack.some((t) => t.toLowerCase() === needle)) {
          return true;
        }
        const narrative = [project.summary, ...project.architectureHighlights]
          .join(' ')
          .toLowerCase();
        return narrative.includes(needle);
      });
    }
  }

  return map;
}
