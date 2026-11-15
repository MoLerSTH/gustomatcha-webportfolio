'use client';

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type RefObject,
} from 'react';
import { Cpu, ShieldCheck, Terminal } from 'lucide-react';
import type { BootSequenceState } from '@/lib/bootSequence';
import { cn } from '@/lib/utils';
import { ACCENT_STYLES, NeoBadge, NeoCard } from '@/components/ui/NeoBrutalPrimitives';

let supportsDisplayTransitionCache: boolean | undefined;

const subscribeNoop = () => () => {};
const getServerDisplayTransitionFallback = () => false;

/**
 * Runtime probe verifying whether the browser actually animates `display`
 * under `transition-behavior: allow-discrete` (guards Firefox bug 1882408).
 */
export function canTransitionDisplay(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  if (supportsDisplayTransitionCache !== undefined) {
    return supportsDisplayTransitionCache;
  }
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    supportsDisplayTransitionCache = false;
    return false;
  }

  const probe = document.createElement('div');
  probe.style.cssText =
    'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransitionCache = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransitionCache;
}

/**
 * Formats a single deterministic telemetry status line for the boot HUD.
 */
export function formatBootTelemetryLine(state: BootSequenceState): string {
  return `${state.phase} // ${state.progressPercent}% // ${state.statusHeadline}`;
}

/**
 * Resolves `[hidden]` vs `[data-closing]` attributes so native discrete-display
 * browsers transition `hidden` directly while fallback browsers keep display open
 * until opacity/translate complete.
 */
export function resolveOverlayAttributes(
  isVisible: boolean,
  isClosing: boolean,
  supportsDisplayTransition: boolean
): { hidden: boolean; closing: boolean } {
  if (isVisible) {
    return { hidden: false, closing: false };
  }
  if (isClosing) {
    return {
      hidden: supportsDisplayTransition,
      closing: true,
    };
  }
  return { hidden: true, closing: false };
}

export interface TerminalBootOverlayProps {
  state: BootSequenceState;
  isVisible: boolean;
  isClosing: boolean;
  onSkip: () => void;
  overlayRef?: RefObject<HTMLDivElement | null>;
}

/**
 * Strictly <= 3.0s `GUSTO_OS v2.6` Terminal Boot HUD synchronized with
 * the Pure Three.js wireframe-to-solid procedural sculpture assembly.
 */
export function TerminalBootOverlay({
  state,
  isVisible,
  isClosing,
  onSkip,
  overlayRef,
}: TerminalBootOverlayProps) {
  const skipButtonRef = useRef<HTMLButtonElement | null>(null);
  const supportsDisplayTransition = useSyncExternalStore(
    subscribeNoop,
    canTransitionDisplay,
    getServerDisplayTransitionFallback
  );

  useEffect(() => {
    if (!isVisible || isClosing) return;

    const rafId = window.requestAnimationFrame(() => {
      skipButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, isClosing, onSkip]);

  const { hidden, closing } = resolveOverlayAttributes(
    isVisible,
    isClosing,
    supportsDisplayTransition
  );

  const progressStyle = {
    '--boot-progress-01': String(state.progress01),
  } as CSSProperties;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="gusto-boot-title"
      hidden={hidden}
      data-closing={closing ? '' : undefined}
      className="neo-boot-overlay fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-canvas)]/78 backdrop-blur-[2px] p-4 sm:p-6"
    >
      {/* Corner Instant Skip Control */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-10">
        <button
          ref={skipButtonRef}
          type="button"
          onClick={onSkip}
          className="neo-btn-tactile inline-flex items-center justify-center gap-2 bg-[#FFE600] text-[#0A0A0A] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <span aria-hidden="true">[</span>
          <span>SKIP INTRO</span>
          <span aria-hidden="true">-&gt;]</span>
        </button>
      </div>

      {/* Neo-Brutalist Kernel Boot Terminal Window */}
      <div className="w-full max-w-2xl">
        <NeoCard
          variant="white"
          headerVariant="yellow"
          windowTitle="GUSTO_OS v2.6 // KERNEL_BOOT_SEQUENCE"
          windowTag={`${state.progressPercent}%`}
          className="neo-shadow-lg"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Terminal className="size-5 shrink-0" aria-hidden="true" />
                <h2
                  id="gusto-boot-title"
                  className="font-mono text-base sm:text-lg font-bold tracking-tight"
                >
                  {state.statusHeadline}
                </h2>
              </div>
              <NeoBadge variant={state.isComplete ? 'mint' : 'coral'} pulseDot dotVariant="yellow">
                {state.phase}
              </NeoBadge>
            </div>

            {/* Native <progress> for Assistive Tech + Compositor ScaleX Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xs font-bold">
                <label htmlFor="gusto-boot-progress" className="inline-flex items-center gap-1.5">
                  <Cpu className="size-3.5" aria-hidden="true" />
                  <span>3D_WIREFRAME_ASSEMBLY: {state.progressPercent}%</span>
                </label>
                <span className="text-[var(--ink-muted)]">BUDGET &lt;= 3.0s</span>
              </div>

              <progress
                id="gusto-boot-progress"
                max={100}
                value={state.progressPercent}
                className="visually-hidden"
              />

              <div
                aria-hidden="true"
                className="neo-border h-5 w-full bg-[var(--bg-surface)] p-0.5 overflow-hidden"
              >
                <div
                  style={progressStyle}
                  className="neo-boot-progress-fill h-full w-full bg-[#00F5D4] border-r-2 border-[#0A0A0A]"
                />
              </div>
            </div>

            {/* High-Speed Kernel Log Stream */}
            <ul
              aria-label="Kernel initialization log"
              className="neo-border bg-[var(--bg-surface)] p-3 sm:p-4 space-y-2 font-mono text-xs"
            >
              {state.visibleLogs.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-dashed border-[var(--ui-border-color)]/35 pb-1.5 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-[var(--ink)]">
                      [{entry.timestampLabel}] {entry.subsystem}
                    </span>
                    <div className="text-[var(--ink-muted)] truncate">{entry.message}</div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 self-start sm:self-center border-2 border-[var(--ui-border-color)] px-2 py-0.5 text-[10px] font-bold',
                      ACCENT_STYLES[entry.accent].surfaceClass
                    )}
                  >
                    {entry.status}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                {formatBootTelemetryLine(state)}
              </span>
              <span>ESC OR CLICK TOP-RIGHT TO SKIP</span>
            </div>
          </div>
        </NeoCard>
      </div>
    </div>
  );
}
