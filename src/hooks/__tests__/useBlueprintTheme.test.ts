import { describe, expect, it } from 'vitest';
import { applyThemeAttributeWithTransition } from '../useBlueprintTheme';

describe('useBlueprintTheme helpers', () => {
  it('safely no-ops DOM theme transition in SSR / Node environments without document', () => {
    expect(() => applyThemeAttributeWithTransition(true)).not.toThrow();
    expect(() => applyThemeAttributeWithTransition(false)).not.toThrow();
  });
});
