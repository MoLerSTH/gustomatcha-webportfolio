'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
} from 'react';
import { useAudioSync } from '@/hooks/useAudioSync';
import {
  INITIAL_KONAMI_STATE,
  KONAMI_BUTTON_SPECS,
  KONAMI_HINT_TEXT,
  KONAMI_SEQUENCE,
  KONAMI_TROLL_COPY,
  KONAMI_UNLOCK_ARPEGGIO_HZ,
  formatKonamiLiveAnnouncement,
  resetKonamiState,
  resolveKonamiKeyboardInput,
  stepKonamiInput,
  type KonamiButtonId,
  type KonamiInputSource,
  type KonamiState,
} from '@/lib/konamiController';

export interface KonamiGameBoyDeckProps {
  state: KonamiState;
  activeFlashButton: KonamiButtonId | null;
  isConsoleFocused: boolean;
  onPressButton: (button: KonamiButtonId, source: KonamiInputSource) => void;
  onReset: () => void;
}

const DPAD_BUTTON_LAYOUT: readonly {
  id: Extract<KonamiButtonId, 'UP' | 'LEFT' | 'RIGHT' | 'DOWN'>;
  placementClass: string;
}[] = [
  { id: 'UP', placementClass: 'col-start-2 row-start-1' },
  { id: 'LEFT', placementClass: 'col-start-1 row-start-2' },
  { id: 'RIGHT', placementClass: 'col-start-3 row-start-2' },
  { id: 'DOWN', placementClass: 'col-start-2 row-start-3' },
] as const;

const AB_BUTTON_LAYOUT: readonly {
  id: Extract<KonamiButtonId, 'B' | 'A'>;
  variant: 'b' | 'a';
  offsetClass: string;
}[] = [
  { id: 'B', variant: 'b', offsetClass: 'mt-4' },
  { id: 'A', variant: 'a', offsetClass: '-mt-4' },
] as const;

const BUTTON_FLASH_MS = 160;

/**
 * Pure Neo-Brutalist pocket Game Boy Konami Code UI view rendered both SSR
 * and inside the interactive client wrapper.
 */
export function KonamiGameBoyDeck({
  state,
  activeFlashButton,
  isConsoleFocused,
  onPressButton,
  onReset,
}: KonamiGameBoyDeckProps): JSX.Element {
  const lastSpec = state.lastPressed
    ? KONAMI_BUTTON_SPECS[state.lastPressed]
    : null;
  const sourceBadge = state.lastSource === 'keyboard' ? 'KEYBOARD' : 'CLICK';
  const isUnlocked = state.status === 'unlocked';

  return (
    <section
      aria-labelledby="konami-console-heading"
      className="neo-gameboy-shell mt-1 p-3.5 sm:p-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] md:items-center">
        {/* Bezel & Pixel Dot-Matrix LCD */}
        <div className="neo-gameboy-bezel p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="neo-live-dot"
                style={{
                  backgroundColor: isUnlocked ? '#FFE600' : '#FF5D8F',
                }}
                aria-hidden="true"
              />
              <h2
                id="konami-console-heading"
                className="font-mono text-[10px] font-extrabold tracking-widest uppercase"
              >
                GUSTO_BOY // KONAMI_01
              </h2>
            </div>
            <span
              className={`border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase ${
                isConsoleFocused
                  ? 'border-[#FFE600] bg-[#FFE600] text-[#0A0A0A]'
                  : 'border-white/35 bg-white/10 text-white/85'
              }`}
            >
              {isConsoleFocused ? 'KB: LOCKED' : 'KB: READY'}
            </span>
          </div>

          <p className="mt-1.5 font-mono text-[10px] font-bold tracking-wider text-amber-300">
            HINT: {KONAMI_HINT_TEXT}
          </p>

          <div
            data-status={state.status}
            className="neo-gameboy-lcd mt-2 flex min-h-[144px] flex-col justify-between p-2.5 sm:p-3 font-mono"
          >
            {isUnlocked ? (
              <>
                <div className="flex items-center justify-between gap-2 border-b border-current/35 pb-1 text-[10px] font-extrabold tracking-widest uppercase">
                  <span>{KONAMI_TROLL_COPY.eyebrow}</span>
                  <span>[ ;P ]</span>
                </div>

                <div className="my-1.5">
                  <p className="text-sm font-black leading-snug tracking-tight">
                    {KONAMI_TROLL_COPY.headline}
                  </p>
                  <p className="mt-1 text-[11px] font-bold leading-tight opacity-90">
                    {KONAMI_TROLL_COPY.subline}
                  </p>
                </div>

                <div className="border-t border-current/35 pt-1 text-[10px] font-bold tracking-wider uppercase">
                  {state.totalPressCount > KONAMI_SEQUENCE.length && lastSpec
                    ? `PRESSED [${lastSpec.shortLabel}] // STILL NOTHING TO PLAY LOL`
                    : 'NO BONUS LEVEL // PRESS RESET TO CLEAR'}
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between text-[10px] font-extrabold tracking-wider uppercase">
                    <span>CODE PROGRESS</span>
                    <span>
                      {state.matchedCount}/{KONAMI_SEQUENCE.length}
                    </span>
                  </div>

                  <div
                    className="mt-1.5 grid grid-cols-10 gap-1"
                    aria-hidden="true"
                  >
                    {KONAMI_SEQUENCE.map((expectedButton, idx) => {
                      const isMatched = idx < state.matchedCount;
                      const isNext = idx === state.matchedCount;
                      const slotState = isMatched
                        ? 'matched'
                        : isNext
                          ? 'next'
                          : 'idle';
                      return (
                        <span
                          key={`${expectedButton}-${idx}`}
                          data-state={slotState}
                          className={`neo-lcd-slot flex h-5 items-center justify-center border text-[10px] font-black leading-none ${
                            isMatched
                              ? ''
                              : isNext
                                ? 'bg-current/15 font-extrabold'
                                : 'border-current/40 opacity-50'
                          }`}
                        >
                          {isMatched
                            ? KONAMI_BUTTON_SPECS[expectedButton].glyph
                            : '·'}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="my-2 flex flex-wrap items-center justify-between gap-2 border-y border-current/30 py-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black tracking-wide uppercase">
                    <span className="opacity-75">KEY:</span>
                    {lastSpec ? (
                      <span>
                        [ {lastSpec.glyph} {lastSpec.shortLabel} ]
                      </span>
                    ) : (
                      <span>WAITING INPUT</span>
                    )}
                  </div>
                  <span className="border border-current px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase">
                    {lastSpec ? sourceBadge : 'CLICK OR KB'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
                  <span className="mr-0.5 uppercase opacity-75">LOG:</span>
                  {state.pressedLog.length === 0 ? (
                    <span className="opacity-75">NONE YET</span>
                  ) : (
                    state.pressedLog.map((pressedId, idx) => {
                      const spec = KONAMI_BUTTON_SPECS[pressedId];
                      const isLatest = idx === state.pressedLog.length - 1;
                      return (
                        <span
                          key={`${pressedId}-${state.totalPressCount - state.pressedLog.length + idx}`}
                          className={`inline-flex min-w-[1.2rem] items-center justify-center border border-current px-1 py-0.5 leading-none ${
                            isLatest ? 'font-black underline' : 'opacity-80'
                          }`}
                        >
                          {spec.glyph}
                        </span>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ergonomic Game Boy Controls Cluster */}
        <div className="flex flex-col justify-between gap-4 px-1 py-0.5">
          <div className="flex items-center justify-around gap-3 sm:justify-between sm:px-2">
            {/* Cross D-Pad */}
            <div
              role="group"
              aria-label="Konami directional pad"
              className="neo-dpad-grid"
            >
              {DPAD_BUTTON_LAYOUT.map(({ id, placementClass }) => {
                const spec = KONAMI_BUTTON_SPECS[id];
                const isActive = activeFlashButton === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-label={spec.ariaLabel}
                    data-active={isActive ? 'true' : undefined}
                    onClick={(event) =>
                      onPressButton(
                        id,
                        event.detail === 0 ? 'keyboard' : 'pointer'
                      )
                    }
                    className={`neo-dpad-btn ${placementClass}`}
                  >
                    <span aria-hidden="true">{spec.glyph}</span>
                  </button>
                );
              })}
              <div
                aria-hidden="true"
                className="neo-dpad-pivot col-start-2 row-start-2 flex items-center justify-center"
              >
                <span className="h-2.5 w-2.5 rounded-full border border-white/25 bg-black/45" />
              </div>
            </div>

            {/* Angled A / B Arcade Buttons */}
            <div
              role="group"
              aria-label="Konami action buttons"
              className="flex items-center gap-3.5 py-2"
            >
              {AB_BUTTON_LAYOUT.map(({ id, variant, offsetClass }) => {
                const spec = KONAMI_BUTTON_SPECS[id];
                const isActive = activeFlashButton === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-label={spec.ariaLabel}
                    data-variant={variant}
                    data-active={isActive ? 'true' : undefined}
                    onClick={(event) =>
                      onPressButton(
                        id,
                        event.detail === 0 ? 'keyboard' : 'pointer'
                      )
                    }
                    className={`neo-ab-btn ${offsetClass}`}
                  >
                    {spec.glyph}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center-Bottom Utility Reset + Key Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[var(--ui-border-color)]/25 pt-3">
            <button
              type="button"
              onClick={onReset}
              aria-label="Reset Konami Code progress and pressed key log"
              className="neo-reset-pill"
            >
              RESET
            </button>
            <span className="font-mono text-[10px] font-bold tracking-wider text-[var(--ink-muted)] uppercase">
              KEYS: ARROWS · B · A · ESC
            </span>
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {formatKonamiLiveAnnouncement(state)}
      </p>
    </section>
  );
}

/**
 * Stateful interactive wrapper binding pointer clicks, hybrid keyboard input,
 * hardware button press pulses, and 8-bit square-wave chiptune tones.
 */
export function KonamiGameBoyWidget(): JSX.Element {
  const { audioEnabled, triggerSynthNote } = useAudioSync();
  const [state, setState] = useState<KonamiState>(INITIAL_KONAMI_STATE);
  const [activeFlashButton, setActiveFlashButton] =
    useState<KonamiButtonId | null>(null);
  const [isConsoleFocused, setIsConsoleFocused] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<KonamiState>(INITIAL_KONAMI_STATE);
  const audioEnabledRef = useRef<boolean>(audioEnabled);
  const flashTimerRef = useRef<number | null>(null);
  const arpeggioTimersRef = useRef<number[]>([]);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  const clearScheduledTimers = useCallback(() => {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    for (const timerId of arpeggioTimersRef.current) {
      window.clearTimeout(timerId);
    }
    arpeggioTimersRef.current = [];
  }, []);

  useEffect(() => clearScheduledTimers, [clearScheduledTimers]);

  const triggerButtonFlash = useCallback((button: KonamiButtonId) => {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
    setActiveFlashButton(button);
    flashTimerRef.current = window.setTimeout(() => {
      setActiveFlashButton(null);
      flashTimerRef.current = null;
    }, BUTTON_FLASH_MS);
  }, []);

  const handlePressButton = useCallback(
    (button: KonamiButtonId, source: KonamiInputSource) => {
      const prev = stateRef.current;
      const next = stepKonamiInput(prev, button, source);
      stateRef.current = next;
      setState(next);
      triggerButtonFlash(button);

      if (!audioEnabledRef.current) {
        return;
      }

      if (prev.status === 'entering' && next.status === 'unlocked') {
        for (const timerId of arpeggioTimersRef.current) {
          window.clearTimeout(timerId);
        }
        arpeggioTimersRef.current = [];

        KONAMI_UNLOCK_ARPEGGIO_HZ.forEach((freqHz, idx) => {
          const timerId = window.setTimeout(() => {
            triggerSynthNote(freqHz, 0.14, 'square');
          }, idx * 95);
          arpeggioTimersRef.current.push(timerId);
        });
      } else {
        triggerSynthNote(KONAMI_BUTTON_SPECS[button].freqHz, 0.08, 'square');
      }
    },
    [triggerButtonFlash, triggerSynthNote]
  );

  const handleReset = useCallback(() => {
    clearScheduledTimers();
    const fresh = resetKonamiState();
    stateRef.current = fresh;
    setState(fresh);
    setActiveFlashButton(null);

    if (audioEnabledRef.current) {
      triggerSynthNote(392.0, 0.07, 'square');
      const timerId = window.setTimeout(() => {
        triggerSynthNote(261.63, 0.11, 'square');
      }, 75);
      arpeggioTimersRef.current.push(timerId);
    }
  }, [clearScheduledTimers, triggerSynthNote]);

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      const targetEl =
        event.target instanceof HTMLElement ? event.target : null;
      const isEditableTarget =
        targetEl !== null &&
        (targetEl.tagName === 'INPUT' ||
          targetEl.tagName === 'TEXTAREA' ||
          targetEl.tagName === 'SELECT' ||
          targetEl.isContentEditable);
      const isModalOpen = document.querySelector('dialog[open]') !== null;
      const isToolbarTarget =
        targetEl !== null && targetEl.closest('[role="toolbar"]') !== null;
      const consoleFocusedNow = Boolean(
        containerRef.current?.contains(document.activeElement)
      );

      const resolution = resolveKonamiKeyboardInput({
        key: event.key,
        repeat: event.repeat,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        isEditableTarget,
        isModalOpen,
        isToolbarTarget,
        isConsoleFocused: consoleFocusedNow,
      });

      if (!resolution) {
        return;
      }

      if (resolution.shouldPreventDefault) {
        event.preventDefault();
      }

      if (resolution.action === 'reset') {
        handleReset();
        return;
      }

      handlePressButton(resolution.button, 'keyboard');
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [handlePressButton, handleReset]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onPointerDownCapture={() => {
        if (
          containerRef.current &&
          !containerRef.current.contains(document.activeElement)
        ) {
          containerRef.current.focus({ preventScroll: true });
        }
      }}
      onFocusCapture={() => setIsConsoleFocused(true)}
      onBlurCapture={(event) => {
        const nextFocused = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(nextFocused)) {
          setIsConsoleFocused(false);
        }
      }}
      className="outline-none"
    >
      <KonamiGameBoyDeck
        state={state}
        activeFlashButton={activeFlashButton}
        isConsoleFocused={isConsoleFocused}
        onPressButton={handlePressButton}
        onReset={handleReset}
      />
    </div>
  );
}
