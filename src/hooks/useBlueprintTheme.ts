'use client';

import { useCallback, useEffect, useState } from 'react';

const THEME_ATTR = 'data-theme';
const OVERCLOCK_VALUE = 'overclock';
const THEME_EVENT = 'gusto:theme-change';

/**
 * Applies or clears `data-theme="overclock"` on the root element, wrapping DOM
 * updates in `document.startViewTransition()` when supported and reduced motion
 * is not requested. Safely no-ops during SSR/Node execution.
 */
export function applyThemeAttributeWithTransition(nextOverclock: boolean): void {
  if (typeof document === 'undefined') {
    return;
  }

  const commitDomUpdate = () => {
    if (nextOverclock) {
      document.documentElement.setAttribute(THEME_ATTR, OVERCLOCK_VALUE);
    } else {
      document.documentElement.removeAttribute(THEME_ATTR);
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const docWithTransition = document as Document & {
    startViewTransition?: (updateCallback: () => void) => unknown;
  };

  if (
    !prefersReducedMotion &&
    typeof docWithTransition.startViewTransition === 'function'
  ) {
    try {
      docWithTransition.startViewTransition(commitDomUpdate);
      return;
    } catch {
      // Fall back to direct attribute mutation if view transition is skipped
    }
  }

  commitDomUpdate();
}

/**
 * Synchronized client hook managing the `data-theme="overclock"` root attribute
 * across independent UI controls without prop-drilling.
 */
export function useBlueprintTheme() {
  const [isOverclock, setIsOverclock] = useState(false);

  useEffect(() => {
    const syncFromDom = () => {
      setIsOverclock(
        document.documentElement.getAttribute(THEME_ATTR) === OVERCLOCK_VALUE
      );
    };

    syncFromDom();
    window.addEventListener(THEME_EVENT, syncFromDom);
    return () => window.removeEventListener(THEME_EVENT, syncFromDom);
  }, []);

  const setOverclock = useCallback((next: boolean) => {
    applyThemeAttributeWithTransition(next);
  }, []);

  const toggleOverclock = useCallback(() => {
    const current =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute(THEME_ATTR) === OVERCLOCK_VALUE;
    setOverclock(!current);
  }, [setOverclock]);

  return { isOverclock, setOverclock, toggleOverclock };
}
