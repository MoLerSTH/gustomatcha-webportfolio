'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Menu, Volume2, VolumeX, Cpu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioSync } from '@/hooks/useAudioSync';
import { useBlueprintTheme } from '@/hooks/useBlueprintTheme';
import { NeoBadge, NeoButton } from './NeoBrutalPrimitives';

export interface NavLinkItem {
  label: string;
  href: string;
}

const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { label: 'SYSTEM', href: '#architecture' },
  { label: 'PROJECTS', href: '#projects' },
  { label: 'EXPERIENCE', href: '#experience' },
  { label: 'STACK', href: '#stack' },
  { label: 'CONTACT', href: '#contact' },
];

/**
 * Extracts a clean section ID from an in-page `#fragment` href while rejecting
 * empty `#` hashes or external URLs.
 */
export function normalizeSectionHref(href: string): string | null {
  if (!href.startsWith('#')) {
    return null;
  }
  const id = href.slice(1).trim();
  return id.length > 0 ? id : null;
}

/**
 * Resolves the active navigation fragment href in navbar document order from
 * currently visible section IDs, preserving `currentActiveHref` when between sections.
 */
export function resolveActiveSectionHref(
  visibleSectionIds: readonly string[],
  links: readonly NavLinkItem[],
  currentActiveHref?: string | null,
): string | null {
  const visibleSet = new Set(visibleSectionIds);
  for (const item of links) {
    const id = normalizeSectionHref(item.href);
    if (id && visibleSet.has(id)) {
      return item.href;
    }
  }
  if (currentActiveHref) {
    return currentActiveHref;
  }
  return links[0]?.href ?? null;
}

/**
 * Resolves initial or hash-navigation active href when native `scroll-target-group`
 * is supported, checking `:target-current` first and falling back to the URL hash.
 */
export function resolveInitialScrollspyHref(
  links: readonly NavLinkItem[],
  targetCurrentHref?: string | null,
  hashHref?: string | null,
): string | null {
  const validHrefs = new Set(links.map((item) => item.href));
  if (targetCurrentHref && validHrefs.has(targetCurrentHref)) {
    return targetCurrentHref;
  }
  if (hashHref && validHrefs.has(hashHref)) {
    return hashHref;
  }
  return links[0]?.href ?? null;
}

const subscribeNoop = () => () => {};

function useSupportsNativeScrollTarget(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () =>
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('scroll-target-group: auto'),
    () => false,
  );
}

export interface NeoNavbarProps {
  links?: NavLinkItem[];
  audioSyncEnabled?: boolean;
  onToggleAudioSync?: () => void;
  overclockActive?: boolean;
  onToggleOverclock?: () => void;
}

/**
 * Sticky Neo-Brutalist HUD Navbar with single <nav> landmark,
 * scrollspy active-link synchronization, accessible mobile disclosure,
 * and reactive Overclock preview switch.
 */
export function NeoNavbar({
  links = DEFAULT_NAV_LINKS,
  audioSyncEnabled: controlledAudioSync,
  onToggleAudioSync,
  overclockActive: controlledOverclock,
  onToggleOverclock,
}: NeoNavbarProps) {
  const { audioEnabled: hookAudioSync, toggleAudioSync: toggleHookAudioSync } = useAudioSync();
  const { isOverclock: hookOverclock, toggleOverclock: toggleHookOverclock } = useBlueprintTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(
    () => links[0]?.href ?? null,
  );
  const supportsNativeScrollTarget = useSupportsNativeScrollTarget();

  useEffect(() => {
    if (supportsNativeScrollTarget) {
      let isMounted = true;
      const readTargetCurrentHref = (): string | null => {
        try {
          const matched = document.querySelector<HTMLAnchorElement>(
            '.neo-nav-scrollspy a:target-current',
          );
          return matched?.getAttribute('href') ?? null;
        } catch {
          return null;
        }
      };

      const syncInitialOrHash = () => {
        if (!isMounted) {
          return;
        }
        setActiveHref(
          resolveInitialScrollspyHref(
            links,
            readTargetCurrentHref(),
            window.location.hash,
          ),
        );
      };

      const handleScrollEnd = () => {
        const nextHref = readTargetCurrentHref();
        if (nextHref && normalizeSectionHref(nextHref)) {
          setActiveHref(nextHref);
        }
      };

      queueMicrotask(syncInitialOrHash);
      window.addEventListener('scrollend', handleScrollEnd, { passive: true });
      window.addEventListener('hashchange', syncInitialOrHash, { passive: true });
      return () => {
        isMounted = false;
        window.removeEventListener('scrollend', handleScrollEnd);
        window.removeEventListener('hashchange', syncInitialOrHash);
      };
    }

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const visibleIds = new Set<string>();
    const sections = links
      .map((item) => normalizeSectionHref(item.href))
      .filter((id): id is string => id !== null)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id);
          } else {
            visibleIds.delete(entry.target.id);
          }
        }
        setActiveHref((current) =>
          resolveActiveSectionHref(Array.from(visibleIds), links, current),
        );
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, [links, supportsNativeScrollTarget]);

  const isAudioSync = controlledAudioSync ?? hookAudioSync;
  const isOverclock = controlledOverclock ?? hookOverclock;

  const handleAudioClick = () => {
    if (onToggleAudioSync) {
      onToggleAudioSync();
      return;
    }
    void toggleHookAudioSync();
  };

  const handleOverclockClick = () => {
    if (onToggleOverclock) {
      onToggleOverclock();
      return;
    }
    toggleHookOverclock();
  };

  return (
    <header className="neo-navbar-reveal sticky top-0 z-40 w-full border-b-[3px] border-[var(--ui-border-color)] bg-[var(--bg-canvas)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Identity Link */}
        <div className="flex items-center gap-3">
          <a
            href="#main-content"
            className="inline-flex min-h-11 items-center gap-2.5 border-[3px] border-[var(--ui-border-color)] bg-[#FFE600] px-3.5 py-1.5 font-mono text-sm font-bold text-[#0A0A0A] neo-shadow-sm no-underline"
          >
            <span aria-hidden="true" className="inline-block size-2.5 bg-[#0A0A0A]" />
            <span>GUSTO_OS v2.6</span>
          </a>
          <NeoBadge variant="mint" pulseDot dotVariant="coral" className="hidden xl:inline-flex">
            60 FPS READY
          </NeoBadge>
        </div>

        {/* Desktop Primary Navigation */}
        <nav aria-label="Primary" className="neo-nav-scrollspy hidden lg:flex items-center gap-1.5">
          {links.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => setActiveHref(item.href)}
                className={cn(
                  'neo-nav-link inline-flex min-h-11 items-center gap-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-2 border-transparent hover:border-[var(--ui-border-color)] hover:bg-[#FFE600] hover:text-[#0A0A0A] transition-colors no-underline',
                  !supportsNativeScrollTarget && isActive && 'target-current',
                )}
              >
                <span aria-hidden="true" className="neo-nav-link-dot" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* System Telemetry Actions */}
        <div className="flex items-center gap-2.5">
          <NeoButton
            variant={isAudioSync ? 'mint' : 'white'}
            size="sm"
            aria-pressed={isAudioSync}
            onClick={handleAudioClick}
            leftIcon={isAudioSync ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            className="hidden sm:inline-flex"
          >
            [AUDIO_SYNC: {isAudioSync ? 'ON' : 'OFF'}]
          </NeoButton>

          <NeoButton
            variant={isOverclock ? 'coral' : 'cobalt'}
            size="sm"
            aria-pressed={isOverclock}
            onClick={handleOverclockClick}
            leftIcon={<Cpu className="size-4" />}
            className="hidden md:inline-flex"
          >
            [BLUEPRINT: {isOverclock ? 'ON' : 'OFF'}]
          </NeoButton>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-primary-nav"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="neo-btn-tactile inline-flex lg:hidden items-center justify-center bg-[var(--bg-surface)] text-[var(--ink)] p-2.5 cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        id="mobile-primary-nav"
        hidden={!mobileMenuOpen}
        className={cn(
          'border-t-[3px] border-[var(--ui-border-color)] bg-[var(--bg-surface)] px-4 py-4 lg:hidden'
        )}
      >
        <nav aria-label="Mobile" className="neo-nav-scrollspy flex flex-col gap-2">
          {links.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => {
                  setActiveHref(item.href);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  'neo-nav-link inline-flex min-h-11 items-center justify-between border-2 border-[var(--ui-border-color)] bg-[var(--bg-canvas)] px-4 py-2 font-mono text-sm font-bold text-[var(--ink)] no-underline',
                  !supportsNativeScrollTarget && isActive && 'target-current',
                )}
              >
                <span className="inline-flex items-center gap-2.5">
                  <span aria-hidden="true" className="neo-nav-link-dot" />
                  <span>{item.label}</span>
                </span>
                <span aria-hidden="true">-&gt;</span>
              </a>
            );
          })}
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <NeoButton
              variant={isAudioSync ? 'mint' : 'white'}
              size="sm"
              aria-pressed={isAudioSync}
              onClick={handleAudioClick}
              leftIcon={
                isAudioSync ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />
              }
            >
              [AUDIO_SYNC: {isAudioSync ? 'ON' : 'OFF'}]
            </NeoButton>
            <NeoButton
              variant={isOverclock ? 'coral' : 'cobalt'}
              size="sm"
              aria-pressed={isOverclock}
              onClick={handleOverclockClick}
              leftIcon={<Cpu className="size-4" />}
            >
              [BLUEPRINT: {isOverclock ? 'ON' : 'OFF'}]
            </NeoButton>
          </div>
        </nav>
      </div>
    </header>
  );
}
