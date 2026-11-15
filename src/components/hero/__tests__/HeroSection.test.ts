import { describe, expect, it } from 'vitest';
import {
  BOOT_EXIT_TRANSITION_MS,
  BOOT_TOTAL_DURATION_MS,
} from '@/lib/bootSequence';
import {
  deriveHeroBootViewState,
  resolveEffectiveBootStage,
  shouldAutoStartBoot,
  shouldRestoreFocusToMainOnBootEnd,
  waitForOverlayExitAnimations,
} from '../heroBootController';

describe('heroBootController', () => {
  it('auto-starts boot only when session is fresh and reduced motion is off', () => {
    expect(
      shouldAutoStartBoot({
        alreadyBooted: false,
        prefersReducedMotion: false,
      })
    ).toBe(true);

    expect(
      shouldAutoStartBoot({
        alreadyBooted: true,
        prefersReducedMotion: false,
      })
    ).toBe(false);

    expect(
      shouldAutoStartBoot({
        alreadyBooted: false,
        prefersReducedMotion: true,
      })
    ).toBe(false);
  });

  it('derives SSR-safe solid idle/done state and active wireframe-to-solid booting state', () => {
    const idleView = deriveHeroBootViewState('idle', 0);
    expect(idleView.isOverlayVisible).toBe(false);
    expect(idleView.isOverlayClosing).toBe(false);
    expect(idleView.isBooting).toBe(false);
    expect(idleView.assemblyProgress).toBe(1);
    expect(idleView.bootState.isComplete).toBe(true);

    const bootStart = deriveHeroBootViewState('booting', 0);
    expect(bootStart.isOverlayVisible).toBe(true);
    expect(bootStart.isOverlayClosing).toBe(false);
    expect(bootStart.isBooting).toBe(true);
    expect(bootStart.assemblyProgress).toBe(0);

    const bootMid = deriveHeroBootViewState('booting', BOOT_TOTAL_DURATION_MS / 2);
    expect(bootMid.assemblyProgress).toBeCloseTo(0.5, 4);
    expect(bootMid.isBooting).toBe(true);

    const closingView = deriveHeroBootViewState('closing', BOOT_TOTAL_DURATION_MS);
    expect(closingView.isOverlayVisible).toBe(false);
    expect(closingView.isOverlayClosing).toBe(true);
    expect(closingView.isBooting).toBe(false);
    expect(closingView.assemblyProgress).toBe(1);

    const doneView = deriveHeroBootViewState('done', BOOT_TOTAL_DURATION_MS);
    expect(doneView.isOverlayVisible).toBe(false);
    expect(doneView.isOverlayClosing).toBe(false);
    expect(doneView.isBooting).toBe(false);
    expect(doneView.assemblyProgress).toBe(1);
  });

  it('resolves exit wait immediately when no element or zero animations exist', async () => {
    await expect(waitForOverlayExitAnimations(null, 50)).resolves.toBeUndefined();
    await expect(
      waitForOverlayExitAnimations({ getAnimations: () => [] }, 50)
    ).resolves.toBeUndefined();
  });

  it('waits for pending overlay exit animations or caps at fallback timeout', async () => {
    let settled = false;
    const fastElement = {
      getAnimations: () => [
        {
          finished: new Promise<void>((resolve) => {
            setTimeout(() => {
              settled = true;
              resolve();
            }, 15);
          }),
        },
      ],
    };

    await waitForOverlayExitAnimations(fastElement, BOOT_EXIT_TRANSITION_MS + 60);
    expect(settled).toBe(true);

    const stalledElement = {
      getAnimations: () => [
        {
          finished: new Promise<void>(() => {
            // Never resolves to simulate interrupted WAAPI transition.
          }),
        },
      ],
    };

    await expect(
      waitForOverlayExitAnimations(stalledElement, 20)
    ).resolves.toBeUndefined();
  });

  it('resolves effective boot stage without waiting for client effects on fresh sessions', () => {
    expect(resolveEffectiveBootStage(null, false)).toBe('idle');
    expect(resolveEffectiveBootStage(null, true)).toBe('booting');
    expect(resolveEffectiveBootStage('closing', true)).toBe('closing');
    expect(resolveEffectiveBootStage('done', false)).toBe('done');
    expect(resolveEffectiveBootStage('booting', false)).toBe('booting');
  });

  it('restores focus to #main-content on user skip OR natural completion when focus stayed inside overlay', () => {
    expect(
      shouldRestoreFocusToMainOnBootEnd({
        isUserSkip: true,
        overlayContainsActiveElement: false,
      })
    ).toBe(true);

    expect(
      shouldRestoreFocusToMainOnBootEnd({
        isUserSkip: false,
        overlayContainsActiveElement: true,
      })
    ).toBe(true);

    expect(
      shouldRestoreFocusToMainOnBootEnd({
        isUserSkip: false,
        overlayContainsActiveElement: false,
      })
    ).toBe(false);
  });
});
