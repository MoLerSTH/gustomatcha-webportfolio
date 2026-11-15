import { describe, expect, it } from 'vitest';
import {
  normalizeSectionHref,
  resolveActiveSectionHref,
  resolveInitialScrollspyHref,
  type NavLinkItem,
} from '../NeoNavbar';

const LINKS: NavLinkItem[] = [
  { label: 'SYSTEM', href: '#architecture' },
  { label: 'PROJECTS', href: '#projects' },
  { label: 'EXPERIENCE', href: '#experience' },
  { label: 'STACK', href: '#stack' },
  { label: 'CONTACT', href: '#contact' },
];

describe('NeoNavbar scrollspy helpers', () => {
  it('extracts clean section IDs from fragment hrefs and rejects external URLs', () => {
    expect(normalizeSectionHref('#projects')).toBe('projects');
    expect(normalizeSectionHref('#architecture')).toBe('architecture');
    expect(normalizeSectionHref('https://example.com')).toBeNull();
    expect(normalizeSectionHref('#')).toBeNull();
  });

  it('resolves the first matching nav link in document order from visible sections', () => {
    expect(resolveActiveSectionHref(['experience', 'stack'], LINKS)).toBe(
      '#experience',
    );
    expect(resolveActiveSectionHref([], LINKS, '#projects')).toBe('#projects');
    expect(resolveActiveSectionHref([], LINKS, null)).toBe('#architecture');
  });

  it('syncs initial native scrollspy href from :target-current match or valid URL hash', () => {
    expect(resolveInitialScrollspyHref(LINKS, '#stack', '#projects')).toBe(
      '#stack',
    );
    expect(resolveInitialScrollspyHref(LINKS, null, '#projects')).toBe(
      '#projects',
    );
    expect(resolveInitialScrollspyHref(LINKS, null, '#unknown')).toBe(
      '#architecture',
    );
  });
});
