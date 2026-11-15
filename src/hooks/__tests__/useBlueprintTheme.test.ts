import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyThemeAttributeWithTransition } from '../useBlueprintTheme';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useBlueprintTheme helpers', () => {
  it('safely no-ops DOM theme transition in SSR / Node environments without document', () => {
    expect(() => applyThemeAttributeWithTransition(true)).not.toThrow();
    expect(() => applyThemeAttributeWithTransition(false)).not.toThrow();
  });

  it('applies and clears data-theme="overclock" through document.startViewTransition when allowed', () => {
    const attrs = new Map<string, string>();
    const dispatchEvent = vi.fn();
    const startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return { finished: Promise.resolve() };
    });

    vi.stubGlobal('document', {
      documentElement: {
        setAttribute: (k: string, v: string) => attrs.set(k, v),
        removeAttribute: (k: string) => attrs.delete(k),
      },
      startViewTransition,
    });
    vi.stubGlobal('window', {
      dispatchEvent,
      matchMedia: () => ({ matches: false }),
    });

    applyThemeAttributeWithTransition(true);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(attrs.get('data-theme')).toBe('overclock');
    expect(dispatchEvent).toHaveBeenCalledTimes(1);

    applyThemeAttributeWithTransition(false);
    expect(startViewTransition).toHaveBeenCalledTimes(2);
    expect(attrs.has('data-theme')).toBe(false);
    expect(dispatchEvent).toHaveBeenCalledTimes(2);
  });

  it('skips document.startViewTransition when prefers-reduced-motion: reduce is active', () => {
    const attrs = new Map<string, string>();
    const dispatchEvent = vi.fn();
    const startViewTransition = vi.fn();

    vi.stubGlobal('document', {
      documentElement: {
        setAttribute: (k: string, v: string) => attrs.set(k, v),
        removeAttribute: (k: string) => attrs.delete(k),
      },
      startViewTransition,
    });
    vi.stubGlobal('window', {
      dispatchEvent,
      matchMedia: () => ({ matches: true }),
    });

    applyThemeAttributeWithTransition(true);
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(attrs.get('data-theme')).toBe('overclock');
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
  });
});
