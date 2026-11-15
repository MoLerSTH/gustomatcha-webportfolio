'use client';

import { useEffect, useRef, useState } from 'react';
import { Radio, X } from 'lucide-react';
import { NeoButton } from '@/components/ui/NeoBrutalPrimitives';
import {
  computeSynthFrequency,
  computeToolbarNextFocusIndex,
  SYNTH_PAD_SPECS,
  type SynthOctaveShift,
  type SynthPadSpec,
  type SynthWaveform,
} from '@/lib/overclockSynthController';

export interface OverclockSynthDeckProps {
  isOpen: boolean;
  onTriggerPad: (
    pad: SynthPadSpec,
    freqHz: number,
    waveform: SynthWaveform,
  ) => void;
  onExitOverclock: () => void;
  onSettingsChange?: (
    waveform: SynthWaveform,
    octaveShift: SynthOctaveShift,
  ) => void;
}

const WAVEFORM_OPTIONS: readonly {
  value: SynthWaveform;
  shortLabel: string;
  ariaLabel: string;
}[] = [
  { value: 'sawtooth', shortLabel: 'SAW', ariaLabel: 'Sawtooth waveform' },
  { value: 'square', shortLabel: 'SQR', ariaLabel: 'Square waveform' },
  { value: 'triangle', shortLabel: 'TRI', ariaLabel: 'Triangle waveform' },
  { value: 'sine', shortLabel: 'SIN', ariaLabel: 'Sine waveform' },
];

const OCTAVE_OPTIONS: readonly {
  value: SynthOctaveShift;
  shortLabel: string;
  ariaLabel: string;
}[] = [
  { value: -1, shortLabel: 'SUB -1', ariaLabel: 'Sub octave minus 1' },
  { value: 0, shortLabel: 'LEAD 0', ariaLabel: 'Lead octave 0' },
  { value: 1, shortLabel: 'HIGH +1', ariaLabel: 'High octave plus 1' },
];

/**
 * Animates the Synth-Dimension deck exit via `[data-closing]` before setting
 * `hidden = true`, awaiting active CSS animations with a hard timeout safety net.
 */
export async function hideDeckWithTransition(
  deckEl: HTMLElement | null,
  onHidden?: () => void,
  timeoutMs = 450,
): Promise<void> {
  if (!deckEl) {
    await Promise.resolve();
    onHidden?.();
    return;
  }

  if (deckEl.hidden) {
    deckEl.removeAttribute('data-closing');
    await Promise.resolve();
    onHidden?.();
    return;
  }

  deckEl.setAttribute('data-closing', '');

  const animations =
    typeof deckEl.getAnimations === 'function' ? deckEl.getAnimations() : [];

  if (animations.length === 0) {
    await Promise.resolve();
  } else {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.allSettled(animations.map((animation) => animation.finished)),
        new Promise<void>((resolve) => {
          timerId = setTimeout(resolve, timeoutMs);
        }),
      ]);
    } finally {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    }
  }

  // Abort hiding if Overclock re-opened while exit animations were running.
  if (!deckEl.hasAttribute('data-closing')) {
    return;
  }

  deckEl.removeAttribute('data-closing');
  deckEl.hidden = true;
  onHidden?.();
}

/**
 * Playable 3D Synth-Dimension soundboard revealed only inside Overclock Mode.
 * Uses native `focusgroup="toolbar wrap"` with roving-tabindex fallback when unsupported.
 */
export function OverclockSynthDeck({
  isOpen,
  onTriggerPad,
  onExitOverclock,
  onSettingsChange,
}: OverclockSynthDeckProps) {
  const deckRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [waveform, setWaveform] = useState<SynthWaveform>('sawtooth');
  const [octaveShift, setOctaveShift] = useState<SynthOctaveShift>(0);
  const [lastTriggerText, setLastTriggerText] = useState<string | null>(null);

  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    setIsClosing(!isOpen);
  }

  useEffect(() => {
    const deckEl = deckRef.current;
    if (!deckEl) {
      return;
    }

    if (isOpen) {
      deckEl.removeAttribute('data-closing');
      deckEl.hidden = false;
      return;
    }

    if (isClosing) {
      void hideDeckWithTransition(deckEl, () => {
        setIsClosing(false);
      });
    }
  }, [isOpen, isClosing]);

  // Progressive enhancement: only attach roving tabindex when native focusgroup is unavailable.
  useEffect(() => {
    const toolbarEl = toolbarRef.current;
    if (
      !toolbarEl ||
      typeof HTMLElement === 'undefined' ||
      'focusGroup' in HTMLElement.prototype
    ) {
      return;
    }

    const buttons = Array.from(
      toolbarEl.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
    );
    if (buttons.length === 0) {
      return;
    }

    let activeIndex = buttons.findIndex(
      (button) => button.getAttribute('aria-pressed') === 'true',
    );
    if (activeIndex < 0) {
      activeIndex = 0;
    }

    const applyRovingTabIndex = (targetIndex: number) => {
      activeIndex = targetIndex;
      buttons.forEach((button, index) => {
        button.tabIndex = index === targetIndex ? 0 : -1;
      });
    };

    applyRovingTabIndex(activeIndex);

    const handleFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLButtonElement)) {
        return;
      }
      const nextIndex = buttons.indexOf(event.target);
      if (nextIndex >= 0) {
        applyRovingTabIndex(nextIndex);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const nextIndex = computeToolbarNextFocusIndex({
        currentIndex: activeIndex,
        itemCount: buttons.length,
        key: event.key,
        isRtl: getComputedStyle(toolbarEl).direction === 'rtl',
      });
      if (nextIndex === null) {
        return;
      }
      event.preventDefault();
      applyRovingTabIndex(nextIndex);
      buttons[nextIndex].focus();
    };

    toolbarEl.addEventListener('focusin', handleFocusIn);
    toolbarEl.addEventListener('keydown', handleKeyDown);
    return () => {
      toolbarEl.removeEventListener('focusin', handleFocusIn);
      toolbarEl.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleWaveformSelect = (nextWaveform: SynthWaveform) => {
    setWaveform(nextWaveform);
    onSettingsChange?.(nextWaveform, octaveShift);
    setLastTriggerText(
      `OSC WAVEFORM :: ${nextWaveform.toUpperCase()} (${octaveShift >= 0 ? `+${octaveShift}` : octaveShift} OCT)`,
    );
  };

  const handleOctaveSelect = (nextOctave: SynthOctaveShift) => {
    setOctaveShift(nextOctave);
    onSettingsChange?.(waveform, nextOctave);
    setLastTriggerText(
      `OCTAVE SHIFT :: ${nextOctave >= 0 ? `+${nextOctave}` : nextOctave} (${waveform.toUpperCase()})`,
    );
  };

  const handlePadClick = (pad: SynthPadSpec) => {
    const freqHz = computeSynthFrequency(pad.baseFreqHz, octaveShift);
    setLastTriggerText(
      `SYNTH PULSE :: ${pad.code} (${pad.noteLabel} · ${freqHz.toFixed(1)} Hz · ${waveform.toUpperCase()})`,
    );
    onTriggerPad(pad, freqHz, waveform);
  };

  return (
    <section
      ref={deckRef}
      hidden={!isOpen && !isClosing}
      aria-label="GUSTO_OVERCLOCK Synth-Dimension Synthesizer"
      className="neo-overclock-deck mt-4 border-t-2 border-[var(--ui-border-color)] pt-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 border-2 border-[var(--ui-border-color)] bg-[#FFE600] px-2.5 py-1 font-mono text-xs font-extrabold uppercase tracking-wider text-[#0A0A0A]">
            <Radio className="size-3.5" aria-hidden="true" />
            GUSTO_OVERCLOCK // SYNTH-DIMENSION
          </span>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            KEYS [1-6] · TOGGLE [ALT+O]
          </span>
        </div>

        <NeoButton
          type="button"
          variant="white"
          size="sm"
          onClick={onExitOverclock}
          leftIcon={<X className="size-3.5" />}
        >
          [EXIT OVERCLOCK]
        </NeoButton>
      </div>

      {/* WAI-ARIA Toolbar with declarative focusgroup and [aria-pressed] styling */}
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Synth-Dimension waveform and octave controls"
        aria-controls="synth-pad-matrix"
        className="flex flex-wrap items-center gap-2"
        {...({ focusgroup: 'toolbar wrap' } as Record<string, string>)}
      >
        <div
          role="group"
          aria-label="Oscillator waveform"
          className="flex flex-wrap items-center gap-1.5"
        >
          {WAVEFORM_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.ariaLabel}
              aria-pressed={waveform === option.value}
              onClick={() => handleWaveformSelect(option.value)}
              className="neo-toolbar-btn inline-flex items-center justify-center px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-transform active:translate-x-[1px] active:translate-y-[1px]"
            >
              {option.shortLabel}
            </button>
          ))}
        </div>

        <span
          role="separator"
          aria-orientation="vertical"
          className="hidden sm:inline-block h-8 w-0 border-l-2 border-[var(--ui-border-color)]"
        />

        <div
          role="group"
          aria-label="Octave shift"
          className="flex flex-wrap items-center gap-1.5"
        >
          {OCTAVE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.ariaLabel}
              aria-pressed={octaveShift === option.value}
              onClick={() => handleOctaveSelect(option.value)}
              className="neo-toolbar-btn inline-flex items-center justify-center px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-transform active:translate-x-[1px] active:translate-y-[1px]"
            >
              {option.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Poly-Synth Pads mapped to portfolio satellite nodes */}
      <div
        id="synth-pad-matrix"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
      >
        {SYNTH_PAD_SPECS.map((pad) => {
          const freqHz = computeSynthFrequency(pad.baseFreqHz, octaveShift);
          return (
            <button
              key={pad.id}
              type="button"
              onClick={() => handlePadClick(pad)}
              aria-label={`Trigger ${pad.code} ${pad.noteLabel} synth pad (${Math.round(freqHz)} Hz, shortcut ${pad.keyHint})`}
              className="neo-btn-tactile flex flex-col justify-between gap-1.5 border-2 border-[var(--ui-border-color)] bg-[var(--bg-canvas)] px-3 py-2.5 text-left font-mono text-[var(--text-primary)] cursor-pointer min-h-[4.25rem]"
            >
              <span className="flex items-center justify-between gap-2 w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  [KEY {pad.keyHint}]
                </span>
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-6 border border-[var(--ui-border-color)]"
                  style={{ backgroundColor: pad.colorHex }}
                />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-tight text-[var(--text-primary)]">
                {pad.code}
              </span>
              <span className="flex items-center justify-between gap-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                <span>{pad.noteLabel}</span>
                <span>{Math.round(freqHz)} Hz</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Live region kept outside role="toolbar" for accessible status announcements */}
      <p
        role="status"
        aria-live="polite"
        className="border-2 border-[var(--ui-border-color)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs font-semibold text-[var(--text-secondary)]"
      >
        {lastTriggerText ??
          'SYNTH STANDBY // SELECT WAVEFORM OR TRIGGER PADS [1-6] TO PULSE 3D RING'}
      </p>
    </section>
  );
}
