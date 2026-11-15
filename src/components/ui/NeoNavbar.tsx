'use client';

import { useState } from 'react';
import { Menu, Volume2, VolumeX, Cpu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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

export interface NeoNavbarProps {
  links?: NavLinkItem[];
  audioSyncEnabled?: boolean;
  onToggleAudioSync?: () => void;
  overclockActive?: boolean;
  onToggleOverclock?: () => void;
}

/**
 * Sticky Neo-Brutalist HUD Navbar with single <nav> landmark,
 * accessible mobile disclosure, and reactive Overclock preview switch.
 */
export function NeoNavbar({
  links = DEFAULT_NAV_LINKS,
  audioSyncEnabled: controlledAudioSync,
  onToggleAudioSync,
  overclockActive: controlledOverclock,
  onToggleOverclock,
}: NeoNavbarProps) {
  const [localAudioSync, setLocalAudioSync] = useState(false);
  const { isOverclock: hookOverclock, toggleOverclock: toggleHookOverclock } = useBlueprintTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAudioSync = controlledAudioSync ?? localAudioSync;
  const isOverclock = controlledOverclock ?? hookOverclock;

  const handleAudioClick = () => {
    if (onToggleAudioSync) {
      onToggleAudioSync();
      return;
    }
    setLocalAudioSync((prev) => !prev);
  };

  const handleOverclockClick = () => {
    if (onToggleOverclock) {
      onToggleOverclock();
      return;
    }
    toggleHookOverclock();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b-[3px] border-[var(--ui-border-color)] bg-[var(--bg-canvas)]">
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
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-1.5">
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-2 border-transparent hover:border-[var(--ui-border-color)] hover:bg-[#FFE600] hover:text-[#0A0A0A] transition-colors no-underline"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* System Telemetry Actions */}
        <div className="flex items-center gap-2.5">
          <NeoButton
            variant={isAudioSync ? 'mint' : 'white'}
            size="sm"
            onClick={handleAudioClick}
            leftIcon={isAudioSync ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            className="hidden sm:inline-flex"
          >
            [AUDIO_SYNC: {isAudioSync ? 'ON' : 'OFF'}]
          </NeoButton>

          <NeoButton
            variant={isOverclock ? 'coral' : 'cobalt'}
            size="sm"
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
        <nav aria-label="Mobile" className="flex flex-col gap-2">
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex min-h-11 items-center justify-between border-2 border-[var(--ui-border-color)] bg-[var(--bg-canvas)] px-4 py-2 font-mono text-sm font-bold text-[var(--ink)] no-underline"
            >
              <span>{item.label}</span>
              <span aria-hidden="true">-&gt;</span>
            </a>
          ))}
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <NeoButton
              variant={isAudioSync ? 'mint' : 'white'}
              size="sm"
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
