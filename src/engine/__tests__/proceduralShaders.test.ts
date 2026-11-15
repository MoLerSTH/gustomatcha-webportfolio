import { describe, it, expect } from 'vitest';
import {
  CORE_VERTEX_SHADER,
  CORE_FRAGMENT_SHADER,
  SATELLITE_NODE_SPECS,
  computeSatelliteWorldPosition,
} from '../proceduralShaders';
import { FEATURED_PROJECTS } from '@/data/portfolioData';

describe('proceduralShaders & Satellite Node Specs', () => {
  it('defines GLSL vertex and fragment shaders with required reactive uniforms', () => {
    expect(CORE_VERTEX_SHADER).toContain('uniform float uTime;');
    expect(CORE_VERTEX_SHADER).toContain('uniform float uPointerVelocity;');
    expect(CORE_VERTEX_SHADER).toContain('uniform float uAudioPulse;');
    expect(CORE_VERTEX_SHADER).toContain('uniform float uShockwave;');
    expect(CORE_FRAGMENT_SHADER).toContain('uniform vec3 uPrimaryColor;');
    expect(CORE_FRAGMENT_SHADER).toContain('uniform float uOverclockMode;');
  });

  it('maps all 3 satellite nodes to the exact Top 3 Featured Project IDs', () => {
    expect(SATELLITE_NODE_SPECS).toHaveLength(3);
    expect(SATELLITE_NODE_SPECS.map((s) => s.projectId)).toEqual(
      FEATURED_PROJECTS.map((p) => p.id)
    );
  });

  it('computes finite orbital 3D coordinates across time and scroll expansion', () => {
    const pos0 = computeSatelliteWorldPosition(SATELLITE_NODE_SPECS[0], 0, 1);
    const pos1 = computeSatelliteWorldPosition(SATELLITE_NODE_SPECS[0], 2.5, 1.4);
    expect(Number.isFinite(pos0.x)).toBe(true);
    expect(Number.isFinite(pos0.y)).toBe(true);
    expect(Number.isFinite(pos0.z)).toBe(true);
    expect(pos0.x).not.toBe(pos1.x);
  });
});
