import { describe, expect, it } from 'vitest';
import {
  EXPERIENCE_TIMELINE,
  PROJECTS_DATA,
  TECH_STACK_MATRIX,
} from '@/data/portfolioData';
import {
  buildSkillProjectMap,
  computeCardTiltTransform,
  computeExperienceTrackCounts,
  filterExperienceTimeline,
  filterVaultProjects,
  isPointOutsideDialogRect,
} from '../portfolioSectionControllers';

describe('portfolioSectionControllers', () => {
  const sampleRect = { left: 100, top: 200, width: 400, height: 300 };

  it('computes bounded 3D card tilt angles and clamps reduced-motion or invalid rects to 0deg', () => {
    const center = computeCardTiltTransform({
      clientX: 300,
      clientY: 350,
      rect: sampleRect,
      maxTiltDeg: 8,
    });
    expect(center.rotateXDeg).toBeCloseTo(0, 3);
    expect(center.rotateYDeg).toBeCloseTo(0, 3);
    expect(center.glareXPercent).toBeCloseTo(50, 2);
    expect(center.glareYPercent).toBeCloseTo(50, 2);
    expect(center.isActive).toBe(true);

    const topLeft = computeCardTiltTransform({
      clientX: 100,
      clientY: 200,
      rect: sampleRect,
      maxTiltDeg: 8,
    });
    expect(topLeft.rotateXDeg).toBe(8);
    expect(topLeft.rotateYDeg).toBe(-8);

    const overflow = computeCardTiltTransform({
      clientX: -999,
      clientY: 9999,
      rect: sampleRect,
      maxTiltDeg: 6,
    });
    expect(Math.abs(overflow.rotateXDeg)).toBeLessThanOrEqual(6);
    expect(Math.abs(overflow.rotateYDeg)).toBeLessThanOrEqual(6);
    expect(overflow.glareXPercent).toBeGreaterThanOrEqual(0);
    expect(overflow.glareYPercent).toBeLessThanOrEqual(100);

    const reducedMotion = computeCardTiltTransform({
      clientX: 120,
      clientY: 220,
      rect: sampleRect,
      prefersReducedMotion: true,
    });
    expect(reducedMotion).toEqual({
      rotateXDeg: 0,
      rotateYDeg: 0,
      glareXPercent: 50,
      glareYPercent: 50,
      isActive: false,
    });

    const invalidRect = computeCardTiltTransform({
      clientX: Number.NaN,
      clientY: 250,
      rect: { left: 0, top: 0, width: 0, height: 0 },
    });
    expect(invalidRect.isActive).toBe(false);
    expect(invalidRect.rotateXDeg).toBe(0);
  });

  it('evaluates dialog backdrop outside-click bounds safely without false positives on zero rects or NaN', () => {
    expect(isPointOutsideDialogRect(250, 300, sampleRect)).toBe(false);
    expect(isPointOutsideDialogRect(99, 300, sampleRect)).toBe(true);
    expect(isPointOutsideDialogRect(501, 300, sampleRect)).toBe(true);
    expect(isPointOutsideDialogRect(250, 199, sampleRect)).toBe(true);
    expect(isPointOutsideDialogRect(250, 501, sampleRect)).toBe(true);

    expect(isPointOutsideDialogRect(10, 10, null)).toBe(false);
    expect(
      isPointOutsideDialogRect(10, 10, { left: 0, top: 0, width: 0, height: 0 })
    ).toBe(false);
    expect(isPointOutsideDialogRect(Number.NaN, 300, sampleRect)).toBe(false);
  });

  it('filters all 6 vault projects by category, featured flag, and search query', () => {
    expect(filterVaultProjects(PROJECTS_DATA)).toHaveLength(6);
    expect(
      filterVaultProjects(PROJECTS_DATA, { onlyFeatured: true })
    ).toHaveLength(3);
    expect(
      filterVaultProjects(PROJECTS_DATA, { category: 'MOBILE & OFFLINE-FIRST' }).map(
        (p) => p.id
      )
    ).toEqual(['animal-collection-mobile']);
    expect(
      filterVaultProjects(PROJECTS_DATA, { searchQuery: 'typhoon ocr' }).map(
        (p) => p.id
      )
    ).toEqual(['ropa2077-assignier']);
    expect(
      filterVaultProjects(PROJECTS_DATA, { searchQuery: 'theos-2' }).map(
        (p) => p.id
      )
    ).toEqual(['gistda-calval']);
  });

  it('filters experience timeline by track and computes exact track counts', () => {
    const counts = computeExperienceTrackCounts(EXPERIENCE_TIMELINE);
    expect(counts).toEqual({
      ALL: 6,
      INTERNSHIP: 2,
      HACKATHON: 3,
      COMPETITION: 1,
    });

    expect(
      filterExperienceTimeline(EXPERIENCE_TIMELINE, 'INTERNSHIP').map((e) => e.id)
    ).toEqual(['exp-gistda', 'exp-asr-lab']);
    expect(
      filterExperienceTimeline(EXPERIENCE_TIMELINE, 'COMPETITION').map((e) => e.id)
    ).toEqual(['exp-icpc']);
  });

  it('maps Tech Stack Matrix skills to the real projects in PROJECTS_DATA that use them', () => {
    const map = buildSkillProjectMap(PROJECTS_DATA, TECH_STACK_MATRIX);
    expect(map['FastAPI']?.map((p) => p.id)).toContain('gistda-calval');
    expect(map['FastAPI']?.map((p) => p.id)).toContain('kbtg-anti-scam');
    expect(map['Typhoon OCR']?.map((p) => p.id)).toEqual(['ropa2077-assignier']);
    expect(map['React Native']?.map((p) => p.id)).toEqual([
      'animal-collection-mobile',
    ]);
    expect(map['Web Audio API']?.map((p) => p.id)).toEqual([
      'web-audio-bass-piano',
    ]);
  });
});
