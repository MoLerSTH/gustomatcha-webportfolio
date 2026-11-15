import { describe, it, expect } from 'vitest';
import {
  GUSTO_PROFILE,
  PROJECTS_DATA,
  FEATURED_PROJECTS,
  EXPERIENCE_TIMELINE,
  TECH_STACK_MATRIX,
} from '../portfolioData';

describe('Gusto Portfolio Data Layer Integrity', () => {
  it('contains exact core identity and contact fields for Hattakorn Pongsawai (Gusto)', () => {
    expect(GUSTO_PROFILE.fullName).toBe('Hattakorn Pongsawai');
    expect(GUSTO_PROFILE.alias).toBe('Gusto');
    expect(GUSTO_PROFILE.githubHandle).toBe('MoLerSTH');
    expect(GUSTO_PROFILE.email).toBe('hattakorn49@gmail.com');
    expect(GUSTO_PROFILE.university).toContain('Thammasat University');
    expect(GUSTO_PROFILE.program).toContain('TEP/TEPE');
  });

  it('provides exactly 3 Featured Highlight Projects in order and 6 total vault projects', () => {
    expect(FEATURED_PROJECTS).toHaveLength(3);
    expect(FEATURED_PROJECTS[0].highlightOrder).toBe(1);
    expect(FEATURED_PROJECTS[0].title).toContain('GISTDA Satellite Cal-Val');
    expect(FEATURED_PROJECTS[1].highlightOrder).toBe(2);
    expect(FEATURED_PROJECTS[1].title).toContain('KBTG Kampus Hackathon 2026');
    expect(FEATURED_PROJECTS[2].highlightOrder).toBe(3);
    expect(FEATURED_PROJECTS[2].title).toContain('RoPA2077 / Assignier AI');
    expect(PROJECTS_DATA.length).toBeGreaterThanOrEqual(6);

    for (const project of PROJECTS_DATA) {
      expect(project.title.trim().length).toBeGreaterThan(0);
      expect(project.summary.trim().length).toBeGreaterThan(20);
      expect(project.techStack.length).toBeGreaterThan(0);
      expect(project.architectureHighlights.length).toBeGreaterThan(0);
    }
  });

  it('includes internships, competitive builder hackathons, and required tech stack skills', () => {
    expect(EXPERIENCE_TIMELINE.length).toBeGreaterThanOrEqual(6);
    const orgs = EXPERIENCE_TIMELINE.map((e) => `${e.title} @ ${e.organization}`).join(' | ');
    expect(orgs).toContain('GISTDA');
    expect(orgs).toContain('ASR Lab');
    expect(orgs).toContain('KBTG Kampus Hackathon 2026');
    expect(orgs).toContain('ICPC Thailand');
    expect(orgs).toContain('Microsoft AI Hackathon');
    expect(orgs).toContain('Cyber Warrior Hackathon');

    const allSkills = TECH_STACK_MATRIX.flatMap((c) => c.skills.map((s) => s.name));
    expect(allSkills).toEqual(
      expect.arrayContaining([
        'Python',
        'FastAPI',
        'Java',
        'Spring Boot',
        'Next.js',
        'Three.js',
        'PostgreSQL',
        'Docker',
        'Linux',
      ])
    );
  });

  it('defines intrinsic 2400x1600 WebP portrait metadata with non-cliche alt text', () => {
    expect(GUSTO_PROFILE.portrait.src).toBe('/images/gusto-portrait.webp');
    expect(GUSTO_PROFILE.portrait.width).toBe(2400);
    expect(GUSTO_PROFILE.portrait.height).toBe(1600);
    expect(GUSTO_PROFILE.portrait.defaultBackdrop).toBe('yellow');
    expect(GUSTO_PROFILE.portrait.alt.length).toBeGreaterThan(20);
    expect(GUSTO_PROFILE.portrait.alt.toLowerCase()).not.toMatch(
      /^(image|picture|photo) of\b/,
    );
  });
});
