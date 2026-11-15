import {
  BOOT_EXIT_TRANSITION_MS,
  BOOT_TOTAL_DURATION_MS,
  computeBootSequenceState,
  type BootSequenceState,
} from '@/lib/bootSequence';

export type HeroBootStage = 'idle' | 'booting' | 'closing' | 'done';

export interface AutoStartBootInput {
  alreadyBooted: boolean;
  prefersReducedMotion: boolean;
}

export interface HeroBootViewState {
  isOverlayVisible: boolean;
  isOverlayClosing: boolean;
  isBooting: boolean;
  assemblyProgress: number;
  bootState: BootSequenceState;
}

export interface AnimatableElementLike {
  getAnimations?: () => Array<{ finished: Promise<unknown> }>;
}

export interface RestoreFocusOnBootEndInput {
  isUserSkip: boolean;
  overlayContainsActiveElement: boolean;
}

/**
 * Resolves the active boot stage immediately on client render when an explicit
 * runtime override (replay/closing/done) has not superseded initial eligibility.
 */
export function resolveEffectiveBootStage(
  stageOverride: HeroBootStage | null,
  autoBootEligible: boolean
): HeroBootStage {
  return stageOverride ?? (autoBootEligible ? 'booting' : 'idle');
}

/**
 * Determines whether focus should move to `#main-content` before hiding the
 * boot overlay (explicit Skip always moves focus; natural completion moves
 * focus whenever keyboard/SR focus remained inside the dialog).
 */
export function shouldRestoreFocusToMainOnBootEnd({
  isUserSkip,
  overlayContainsActiveElement,
}: RestoreFocusOnBootEndInput): boolean {
  return isUserSkip || overlayContainsActiveElement;
}

/**
 * Determines whether initial client mount should auto-launch the <= 3.0s
 * terminal boot overlay. Bypasses repeat sessions and reduced-motion users.
 */
export function shouldAutoStartBoot({
  alreadyBooted,
  prefersReducedMotion,
}: AutoStartBootInput): boolean {
  return !alreadyBooted && !prefersReducedMotion;
}

/**
 * Maps internal Hero boot stage and elapsed timer into synchronized overlay
 * visibility flags and [0..1] procedural 3D assembly progress.
 */
export function deriveHeroBootViewState(
  stage: HeroBootStage,
  elapsedMs: number
): HeroBootViewState {
  if (stage === 'booting') {
    const bootState = computeBootSequenceState(elapsedMs, BOOT_TOTAL_DURATION_MS);
    return {
      isOverlayVisible: true,
      isOverlayClosing: false,
      isBooting: true,
      assemblyProgress: bootState.progress01,
      bootState,
    };
  }

  const completedState = computeBootSequenceState(
    BOOT_TOTAL_DURATION_MS,
    BOOT_TOTAL_DURATION_MS
  );

  if (stage === 'closing') {
    return {
      isOverlayVisible: false,
      isOverlayClosing: true,
      isBooting: false,
      assemblyProgress: 1,
      bootState: completedState,
    };
  }

  return {
    isOverlayVisible: false,
    isOverlayClosing: false,
    isBooting: false,
    assemblyProgress: 1,
    bootState: completedState,
  };
}

/**
 * Waits for CSS/WAAPI exit animations on the overlay element, resolving
 * immediately when reduced motion or absent animations leave `getAnimations()`
 * empty, and capping wait duration with a deterministic timeout fallback.
 */
export async function waitForOverlayExitAnimations(
  element: AnimatableElementLike | null | undefined,
  fallbackTimeoutMs = BOOT_EXIT_TRANSITION_MS + 60
): Promise<void> {
  const animations = element?.getAnimations?.() ?? [];
  if (animations.length === 0) {
    return;
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, fallbackTimeoutMs);
  });

  try {
    await Promise.race([
      Promise.allSettled(animations.map((animation) => animation.finished)),
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
