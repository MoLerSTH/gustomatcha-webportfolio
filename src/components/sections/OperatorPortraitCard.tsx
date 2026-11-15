'use client';

import Image from 'next/image';
import { useState } from 'react';
import { GUSTO_PROFILE, type AccentColor } from '@/data/portfolioData';
import { cn } from '@/lib/utils';
import { NeoCard } from '@/components/ui/NeoBrutalPrimitives';

export interface PortraitBackdropSwatch {
  accent: AccentColor;
  label: string;
  shortCode: string;
  hex: string;
  stageBgClass: string;
}

export const PORTRAIT_BACKDROP_SWATCHES: readonly PortraitBackdropSwatch[] = [
  {
    accent: 'yellow',
    label: 'Switch sticker stage background to Electric Yellow',
    shortCode: 'YELLOW',
    hex: '#FFE600',
    stageBgClass: 'bg-[#FFE600]',
  },
  {
    accent: 'mint',
    label: 'Switch sticker stage background to Cyber Mint',
    shortCode: 'MINT',
    hex: '#00F5D4',
    stageBgClass: 'bg-[#00F5D4]',
  },
  {
    accent: 'coral',
    label: 'Switch sticker stage background to Coral Pop',
    shortCode: 'CORAL',
    hex: '#FF5D8F',
    stageBgClass: 'bg-[#FF5D8F]',
  },
  {
    accent: 'cobalt',
    label: 'Switch sticker stage background to Cobalt Blue',
    shortCode: 'COBALT',
    hex: '#3A86FF',
    stageBgClass: 'bg-[#3A86FF]',
  },
] as const;

/**
 * Resolves a Neo-Brutalist brand backdrop swatch by accent key, safely
 * falling back to Electric Yellow (`#FFE600`) for unrecognized inputs.
 */
export function resolvePortraitBackdropSpec(
  accent?: AccentColor | string | null,
): PortraitBackdropSwatch {
  if (accent) {
    const matched = PORTRAIT_BACKDROP_SWATCHES.find(
      (swatch) => swatch.accent === accent,
    );
    if (matched) {
      return matched;
    }
  }
  return PORTRAIT_BACKDROP_SWATCHES[0];
}

/**
 * Die-cut stage portrait card displaying `gusto-portrait.webp` over a switchable
 * halftone Friendly Neo-Brutalist brand stage with explicit dimensions to prevent CLS.
 */
export function OperatorPortraitCard() {
  const { portrait } = GUSTO_PROFILE;
  const [activeAccent, setActiveAccent] = useState<AccentColor>(
    portrait.defaultBackdrop,
  );
  const activeSwatch = resolvePortraitBackdropSpec(activeAccent);

  return (
    <NeoCard
      variant="white"
      headerVariant={activeSwatch.accent}
      windowTitle="OPERATOR_PORTRAIT // GUSTO.WEBP"
      windowTag={activeSwatch.shortCode}
      bodyClassName="space-y-3"
    >
      <figure className="space-y-3">
        <div
          className={cn(
            'neo-border neo-sticker-stage relative aspect-[3/2] w-full overflow-hidden',
            activeSwatch.stageBgClass,
          )}
          data-backdrop={activeSwatch.accent}
        >
          <span className="absolute top-2.5 left-2.5 z-20 inline-flex items-center gap-1.5 border-2 border-[#0A0A0A] bg-[#FFFFFF] px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#0A0A0A]">
            <span
              aria-hidden="true"
              className="inline-block size-2 bg-[#00A896]"
            />
            <span>{portrait.badgeLabel}</span>
          </span>

          <Image
            src={portrait.src}
            alt={portrait.alt}
            width={portrait.width}
            height={portrait.height}
            loading="lazy"
            sizes="(min-width: 1024px) 440px, (min-width: 640px) 600px, 100vw"
            className="neo-sticker-cutout relative z-10 h-full w-full object-contain object-bottom select-none"
          />
        </div>

        <figcaption className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {portrait.caption}
        </figcaption>
      </figure>

      <div
        role="group"
        aria-label="Select brand background color for portrait sticker"
        className="flex flex-wrap items-center gap-1.5"
      >
        {PORTRAIT_BACKDROP_SWATCHES.map((swatch) => (
          <button
            key={swatch.accent}
            type="button"
            aria-label={swatch.label}
            aria-pressed={activeAccent === swatch.accent}
            onClick={() => setActiveAccent(swatch.accent)}
            className="neo-btn-tactile neo-filter-pill inline-flex min-h-9 min-w-9 cursor-pointer items-center gap-1.5 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider"
          >
            <span
              aria-hidden="true"
              className="inline-block size-2.5 shrink-0 border border-[var(--ui-border-color)]"
              style={{ backgroundColor: swatch.hex }}
            />
            <span>{swatch.shortCode}</span>
          </button>
        ))}
      </div>
    </NeoCard>
  );
}
