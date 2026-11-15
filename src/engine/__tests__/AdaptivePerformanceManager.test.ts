import { describe, it, expect } from 'vitest';
import {
  computeQualityProfile,
  RollingFpsMonitor,
} from '../AdaptivePerformanceManager';

describe('AdaptivePerformanceManager', () => {
  it('caps devicePixelRatio strictly at 2 even on 3x/4x displays', () => {
    const profile = computeQualityProfile({
      hardwareConcurrency: 12,
      screenWidth: 1920,
      devicePixelRatio: 3.5,
      prefersReducedMotion: false,
    });
    expect(profile.tier).toBe('high');
    expect(profile.pixelRatio).toBe(2);
    expect(profile.coreSubdivisions).toBeGreaterThanOrEqual(4);
  });

  it('assigns low tier with reduced geometry subdivisions on mobile/low-core devices', () => {
    const profile = computeQualityProfile({
      hardwareConcurrency: 2,
      screenWidth: 390,
      devicePixelRatio: 2,
      prefersReducedMotion: false,
    });
    expect(profile.tier).toBe('low');
    expect(profile.pixelRatio).toBeLessThanOrEqual(1.25);
    expect(profile.coreSubdivisions).toBeLessThan(4);
  });

  it('dampens motionScale when prefersReducedMotion is enabled', () => {
    const profile = computeQualityProfile({
      hardwareConcurrency: 8,
      screenWidth: 1440,
      devicePixelRatio: 2,
      prefersReducedMotion: true,
    });
    expect(profile.motionScale).toBeLessThanOrEqual(0.2);
  });

  it('detects sustained sub-42 FPS frame times in RollingFpsMonitor', () => {
    const monitor = new RollingFpsMonitor(5);
    for (let i = 0; i < 5; i++) {
      monitor.recordFrame(33.3); // ~30 FPS
    }
    expect(monitor.getAverageFps()).toBeLessThan(35);
    expect(monitor.shouldDowngrade()).toBe(true);
  });
});
