'use client';

import { useState } from 'react';
import { Sparkles, Terminal, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { NeoBadge, NeoButton, NeoCard } from '@/components/ui/NeoBrutalPrimitives';
import { useBlueprintTheme } from '@/hooks/useBlueprintTheme';
import type { AccentColor } from '@/data/portfolioData';

const ACCENT_CHIPS: {
  id: AccentColor;
  name: string;
  hex: string;
  role: string;
}[] = [
  { id: 'yellow', name: 'ELECTRIC YELLOW', hex: '#FFE600', role: 'PRIMARY CTA / SATELLITE NODE' },
  { id: 'mint', name: 'CYBER MINT', hex: '#00F5D4', role: 'AI / LIVE TELEMETRY / OVERCLOCK' },
  { id: 'coral', name: 'CORAL POP', hex: '#FF5D8F', role: 'CREATIVE ACCENT / ASSIGNIER NODE' },
  { id: 'cobalt', name: 'COBALT BLUE', hex: '#3A86FF', role: 'SYSTEM LINKS / RESEARCH BADGE' },
];

/**
 * Interactive Phase 1 verification sandbox for Friendly Neo-Brutalist tokens,
 * tactile physics, disabled state guards, and Overclock theme switching.
 */
export function Phase1PrimitiveLab() {
  const [selectedAccent, setSelectedAccent] = useState<AccentColor>('yellow');
  const [pressCount, setPressCount] = useState(0);
  const { isOverclock: blueprintActive, toggleOverclock: toggleBlueprint } = useBlueprintTheme();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <NeoCard
        variant="white"
        headerVariant={selectedAccent}
        windowTitle="NEO_PRIMITIVES // TACTILE_LAB.TSX"
        windowTag={`PRESS_COUNT: ${pressCount}`}
        className="lg:col-span-7"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight">
              Interactive Tactile Controls &amp; Accent Palette
            </h3>
            <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
              Click or press <kbd className="border-2 border-[var(--ui-border-color)] px-1.5 py-0.5 font-mono text-xs font-bold">Enter</kbd> / <kbd className="border-2 border-[var(--ui-border-color)] px-1.5 py-0.5 font-mono text-xs font-bold">Space</kbd> on any button to inspect hard-shadow depression physics (`translate(4px, 4px)`), focus rings, and WCAG AA contrast.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {ACCENT_CHIPS.map((chip) => (
              <NeoButton
                key={chip.id}
                variant={chip.id}
                size="md"
                onClick={() => {
                  setSelectedAccent(chip.id);
                  setPressCount((c) => c + 1);
                }}
                leftIcon={<Sparkles className="size-4" />}
              >
                {chip.name}
              </NeoButton>
            ))}

            <NeoButton variant="white" size="md" disabled>
              DISABLED_STATE
            </NeoButton>
          </div>

          <div
            role="status"
            aria-live="polite"
            className="neo-border neo-surface p-4 font-mono text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              <span>
                ACTIVE_TOKEN: <strong>{selectedAccent.toUpperCase()}</strong> (
                {ACCENT_CHIPS.find((c) => c.id === selectedAccent)?.hex}) —{' '}
                {ACCENT_CHIPS.find((c) => c.id === selectedAccent)?.role}
              </span>
            </div>
            <NeoBadge variant={selectedAccent}>VERIFIED AA</NeoBadge>
          </div>
        </div>
      </NeoCard>

      <NeoCard
        variant="white"
        headerVariant="mint"
        windowTitle="OVERCLOCK_THEME_TOKENS // CSS_VARS"
        windowTag={blueprintActive ? 'MODE: OVERCLOCK' : 'MODE: DAYLIGHT'}
        className="lg:col-span-5"
      >
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-bold tracking-tight">
              Blueprint Token Reactivity Preview
            </h3>
            <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
              Phase 1 wires semantic CSS variables on <code className="font-mono font-semibold">:root[data-theme=&quot;overclock&quot;]</code> so the entire UI inverts cleanly to Blueprint Wireframe mode for Phase 5.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="border-2 border-[var(--ui-border-color)] p-3 neo-surface">
              <div className="text-[var(--ink-muted)]">CANVAS_BG</div>
              <div className="mt-1 font-bold">{blueprintActive ? '#050B14' : '#FFFFFF'}</div>
            </div>
            <div className="border-2 border-[var(--ui-border-color)] p-3 neo-surface">
              <div className="text-[var(--ink-muted)]">INK_BORDER</div>
              <div className="mt-1 font-bold">{blueprintActive ? '#00F5D4' : '#0A0A0A'}</div>
            </div>
            <div className="border-2 border-[var(--ui-border-color)] p-3 neo-surface">
              <div className="text-[var(--ink-muted)]">GRID_STEP</div>
              <div className="mt-1 font-bold">32px / 3px BORDER</div>
            </div>
            <div className="border-2 border-[var(--ui-border-color)] p-3 neo-surface">
              <div className="text-[var(--ink-muted)]">PHASE_GATE</div>
              <div className="mt-1 font-bold">PHASE 01 // READY</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <NeoButton
              variant={blueprintActive ? 'coral' : 'dark'}
              size="md"
              onClick={toggleBlueprint}
              leftIcon={<Terminal className="size-4" />}
            >
              {blueprintActive ? 'RESTORE WHITE NEO-BRUTAL' : 'PREVIEW BLUEPRINT THEME'}
            </NeoButton>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs text-[var(--ink-muted)]">
            <Layers className="size-4" aria-hidden="true" />
            <span>3px solid borders</span>
            <span aria-hidden="true">•</span>
            <ShieldCheck className="size-4" aria-hidden="true" />
            <span>Reduced-motion &amp; High-contrast safe</span>
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
