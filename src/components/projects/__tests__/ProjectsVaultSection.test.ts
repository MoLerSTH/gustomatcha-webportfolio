import { describe, expect, it } from 'vitest';
import { PROJECTS_DATA } from '@/data/portfolioData';
import {
  dispatchFocus3DNode,
  dispatchInspectProject,
  resolveProjectById,
} from '../ProjectsVaultSection';

describe('ProjectsVaultSection helpers', () => {
  it('resolves any of the 6 projects by id and returns null for unknown ids', () => {
    expect(resolveProjectById(PROJECTS_DATA, 'gistda-calval')?.title).toContain(
      'GISTDA'
    );
    expect(
      resolveProjectById(PROJECTS_DATA, 'web-audio-bass-piano')?.title
    ).toContain('6-String');
    expect(resolveProjectById(PROJECTS_DATA, 'non-existent')).toBeNull();
    expect(resolveProjectById(PROJECTS_DATA, null)).toBeNull();
  });

  it('safely no-ops custom event dispatch in SSR / Node environments without window', () => {
    expect(() => dispatchInspectProject('gistda-calval')).not.toThrow();
    expect(() => dispatchFocus3DNode('kbtg-anti-scam')).not.toThrow();
  });
});
