import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
  it('merges Tailwind classes and resolves conflicts deterministically', () => {
    expect(cn('px-4 py-2 bg-[#FFE600]', false && 'hidden', 'px-6')).toBe(
      'py-2 bg-[#FFE600] px-6'
    );
  });

  it('handles undefined and conditional class values cleanly', () => {
    expect(cn('neo-border', undefined, null, 'neo-shadow')).toBe(
      'neo-border neo-shadow'
    );
  });
});
