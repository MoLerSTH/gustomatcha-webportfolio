'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type JSX,
} from 'react';
import {
  ArrowUpRight,
  Code2,
  GraduationCap,
  Mail,
  RotateCcw,
} from 'lucide-react';
import { GUSTO_PROFILE, PROJECTS_DATA } from '@/data/portfolioData';
import {
  BOOT_EXIT_TRANSITION_MS,
  BOOT_TOTAL_DURATION_MS,
  hasSessionBooted,
  markSessionBooted,
} from '@/lib/bootSequence';
import { NeoBadge, NeoButton } from '@/components/ui/NeoBrutalPrimitives';
import { GustoCanvasStage } from '@/components/three/GustoCanvasStage';
import { KonamiGameBoyWidget } from './KonamiGameBoyWidget';
import { TerminalBootOverlay } from './TerminalBootOverlay';
import {
  deriveHeroBootViewState,
  resolveEffectiveBootStage,
  shouldAutoStartBoot,
  shouldRestoreFocusToMainOnBootEnd,
  waitForOverlayExitAnimations,
  type HeroBootStage,
} from './heroBootController';

interface BootControllerState {
  stageOverride: HeroBootStage | null;
  elapsedMs: number;
  runId: number;
}

const INITIAL_BOOT_CONTROLLER: BootControllerState = {
  stageOverride: null,
  elapsedMs: 0,
  runId: 0,
};

const subscribeNoop = () => () => {};
const getServerAutoBootFallback = () => false;

function getClientAutoBootEligible(): boolean {
  const alreadyBooted = hasSessionBooted();
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return shouldAutoStartBoot({ alreadyBooted, prefersReducedMotion });
}

/**
 * Interactive Phase 3 Hero Section pairing zero-delay SSR LCP typography
 * with a synchronized 5.0s `GUSTO_OS v2.6` terminal boot overlay and
 * procedural 3D wireframe-to-solid core assembly.
 */
export function HeroSection(): JSX.Element {
  const autoBootEligible = useSyncExternalStore(
    subscribeNoop,
    getClientAutoBootEligible,
    getServerAutoBootFallback
  );
  const [controller, setController] = useState<BootControllerState>(
    INITIAL_BOOT_CONTROLLER
  );
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const activeStage = resolveEffectiveBootStage(
    controller.stageOverride,
    autoBootEligible
  );

  const restoreFocusToMainIfNeeded = useCallback((isUserSkip: boolean) => {
    if (typeof document === 'undefined') return;

    const overlayContainsActiveElement = Boolean(
      overlayRef.current?.contains(document.activeElement)
    );
    if (
      shouldRestoreFocusToMainOnBootEnd({
        isUserSkip,
        overlayContainsActiveElement,
      })
    ) {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, []);

  // Drive 5000ms boot progression and lock synchronized 3D wireframe->solid timeline
  useEffect(() => {
    if (activeStage !== 'booting') return;

    const activeRunId = controller.runId;
    let rafId = 0;
    let startTimeMs: number | null = null;

    const stepTimeline = (nowMs: number) => {
      if (startTimeMs === null) {
        startTimeMs = nowMs;
      }

      const elapsedMs = Math.min(
        BOOT_TOTAL_DURATION_MS,
        Math.max(0, nowMs - startTimeMs)
      );

      if (elapsedMs >= BOOT_TOTAL_DURATION_MS) {
        markSessionBooted();
        restoreFocusToMainIfNeeded(false);
        setController((prev) =>
          prev.runId === activeRunId &&
          (prev.stageOverride === null || prev.stageOverride === 'booting')
            ? {
                stageOverride: 'closing',
                elapsedMs: BOOT_TOTAL_DURATION_MS,
                runId: prev.runId,
              }
            : prev
        );
        return;
      }

      setController((prev) =>
        prev.runId === activeRunId &&
        (prev.stageOverride === null || prev.stageOverride === 'booting')
          ? { ...prev, elapsedMs }
          : prev
      );
      rafId = window.requestAnimationFrame(stepTimeline);
    };

    rafId = window.requestAnimationFrame(stepTimeline);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [activeStage, controller.runId, restoreFocusToMainIfNeeded]);

  // Settle discrete @starting-style / [data-closing] exit transition before unmounting visibility
  useEffect(() => {
    if (activeStage !== 'closing') return;

    const activeRunId = controller.runId;
    let cancelled = false;

    void waitForOverlayExitAnimations(
      overlayRef.current,
      BOOT_EXIT_TRANSITION_MS + 60
    ).then(() => {
      if (cancelled) return;
      setController((prev) =>
        prev.runId === activeRunId && prev.stageOverride === 'closing'
          ? { ...prev, stageOverride: 'done' }
          : prev
      );
    });

    return () => {
      cancelled = true;
    };
  }, [activeStage, controller.runId]);

  const handleSkipBoot = useCallback(() => {
    markSessionBooted();
    restoreFocusToMainIfNeeded(true);

    setController((prev) =>
      prev.stageOverride === null || prev.stageOverride === 'booting'
        ? {
            stageOverride: 'closing',
            elapsedMs: BOOT_TOTAL_DURATION_MS,
            runId: prev.runId + 1,
          }
        : prev
    );
  }, [restoreFocusToMainIfNeeded]);

  const handleReplayBoot = useCallback(() => {
    setController((prev) =>
      prev.stageOverride === 'booting' || prev.stageOverride === 'closing'
        ? prev
        : {
            stageOverride: 'booting',
            elapsedMs: 0,
            runId: prev.runId + 1,
          }
    );
  }, []);

  const viewState = useMemo(
    () => deriveHeroBootViewState(activeStage, controller.elapsedMs),
    [activeStage, controller.elapsedMs]
  );

  return (
    <>
      <section
        aria-labelledby="main-content"
        className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start"
      >
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <NeoBadge variant="yellow" pulseDot dotVariant="coral">
              GUSTO_OS v2.6 // ONLINE
            </NeoBadge>
            <NeoBadge variant="mint">{GUSTO_PROFILE.handle}</NeoBadge>
            <NeoBadge variant="white">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="size-3.5" aria-hidden="true" />
                TU_SE (TEP/TEPE) YR.3
              </span>
            </NeoBadge>
            <NeoBadge variant="cobalt">GISTDA • ASR LAB • KBTG 2026</NeoBadge>
          </div>

          <h1
            id="main-content"
            tabIndex={-1}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.03] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE600]"
          >
            Hi, I&apos;m{' '}
            <span className="inline-block border-[3px] border-[var(--ui-border-color)] bg-[#FFE600] text-[#0A0A0A] px-3 py-0.5 neo-shadow-sm">
              {GUSTO_PROFILE.alias}
            </span>{' '}
            — {GUSTO_PROFILE.fullName}
          </h1>

          <p className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-[var(--ink)] border-l-4 border-[#00F5D4] pl-3">
            {GUSTO_PROFILE.roleHeadline}
          </p>

          <p className="max-w-2xl text-lg sm:text-xl text-[var(--ink-muted)] leading-relaxed">
            {GUSTO_PROFILE.storyLead}
          </p>

          <div className="flex flex-wrap gap-3.5 pt-1">
            <NeoButton
              href="#projects"
              variant="yellow"
              size="lg"
              rightIcon={<ArrowUpRight className="size-5" />}
            >
              VIEW {PROJECTS_DATA.length} PROJECTS VAULT
            </NeoButton>
            <NeoButton
              href={GUSTO_PROFILE.githubUrl}
              external
              variant="white"
              size="lg"
              leftIcon={<Code2 className="size-5" />}
            >
              GITHUB // {GUSTO_PROFILE.githubHandle}
            </NeoButton>
            <NeoButton
              href={`mailto:${GUSTO_PROFILE.email}`}
              variant="mint"
              size="lg"
              leftIcon={<Mail className="size-5" />}
            >
              DIRECT UPLINK
            </NeoButton>
            <NeoButton
              type="button"
              variant="white"
              size="lg"
              onClick={handleReplayBoot}
              disabled={viewState.isBooting || viewState.isOverlayClosing}
              leftIcon={<RotateCcw className="size-5" />}
            >
              [REPLAY BOOT_SEQ]
            </NeoButton>
          </div>

          {/* 4-Column Architectural Telemetry Strip */}
          <dl className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-4">
            {GUSTO_PROFILE.telemetrySpecs.map((spec) => (
              <div
                key={spec.label}
                className="neo-border bg-[var(--bg-surface)] px-3.5 py-3 neo-shadow-sm"
              >
                <dt className="font-mono text-[11px] font-bold tracking-wider text-[var(--ink-muted)]">
                  {spec.label}
                </dt>
                <dd className="mt-1 font-mono text-xs sm:text-sm font-bold text-[var(--ink)] break-words">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Interactive Konami Code Pocket Console */}
          <KonamiGameBoyWidget />
        </div>

        {/* 3D Procedural Stage & Telemetry */}
        <div className="lg:col-span-5">
          <GustoCanvasStage
            assemblyProgress={viewState.assemblyProgress}
            isBooting={viewState.isBooting}
          />
        </div>
      </section>

      <TerminalBootOverlay
        state={viewState.bootState}
        isVisible={viewState.isOverlayVisible}
        isClosing={viewState.isOverlayClosing}
        onSkip={handleSkipBoot}
        overlayRef={overlayRef}
      />
    </>
  );
}
