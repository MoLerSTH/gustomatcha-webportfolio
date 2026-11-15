'use client';

import { useCallback, useEffect, useState } from 'react';

const THEME_ATTR = 'data-theme';
const OVERCLOCK_VALUE = 'overclock';
const THEME_EVENT = 'gusto:theme-change';

/**
 * Synchronized client hook managing the `data-theme="overclock"` root attribute
 * across independent UI controls without prop-drilling.
 */
export function useBlueprintTheme() {
  const [isOverclock, setIsOverclock] = useState(false);

  useEffect(() => {
    const syncFromDom = () => {
      setIsOverclock(document.documentElement.getAttribute(THEME_ATTR) === OVERCLOCK_VALUE);
    };

    syncFromDom();
    window.addEventListener(THEME_EVENT, syncFromDom);
    return () => window.removeEventListener(THEME_EVENT, syncFromDom);
  }, []);

  const setOverclock = useCallback((next: boolean) => {
    if (next) {
      document.documentElement.setAttribute(THEME_ATTR, OVERCLOCK_VALUE);
    } else {
      document.documentElement.removeAttribute(THEME_ATTR);
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const toggleOverclock = useCallback(() => {
    const current = document.documentElement.getAttribute(THEME_ATTR) === OVERCLOCK_VALUE;
    setOverclock(!current);
  }, [setOverclock]);

  return { isOverclock, setOverclock, toggleOverclock };
}
