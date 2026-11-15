import { describe, expect, it } from 'vitest';
import {
  SYNTH_PAD_SPECS,
  computeSynthFrequency,
  computeToolbarNextFocusIndex,
  resolveSynthShortcutAction,
} from '../overclockSynthController';

describe('overclockSynthController', () => {
  it('defines 6 playable cyber-synth pads with positive base frequencies', () => {
    expect(SYNTH_PAD_SPECS).toHaveLength(6);
    expect(SYNTH_PAD_SPECS.map((p) => p.noteLabel)).toEqual([
      'E3',
      'G3',
      'A3',
      'B3',
      'D4',
      'E4',
    ]);
  });

  it('scales frequencies accurately across -1, 0, and +1 octave shifts', () => {
    expect(computeSynthFrequency(220, -1)).toBeCloseTo(110, 2);
    expect(computeSynthFrequency(220, 0)).toBeCloseTo(220, 2);
    expect(computeSynthFrequency(220, 1)).toBeCloseTo(440, 2);
    expect(computeSynthFrequency(-50, 0)).toBe(220);
  });

  it('resolves Alt+O overclock toggle and 1-6 pad shortcuts while ignoring editable targets', () => {
    expect(
      resolveSynthShortcutAction({
        key: 'o',
        altKey: true,
        isOverclockActive: false,
        isEditableTarget: false,
      })
    ).toEqual({ type: 'toggle-overclock' });

    expect(
      resolveSynthShortcutAction({
        key: '1',
        isOverclockActive: true,
        isEditableTarget: false,
      })
    ).toEqual({ type: 'trigger-pad', pad: SYNTH_PAD_SPECS[0] });

    expect(
      resolveSynthShortcutAction({
        key: '1',
        isOverclockActive: false,
        isEditableTarget: false,
      })
    ).toBeNull();

    expect(
      resolveSynthShortcutAction({
        key: '1',
        isOverclockActive: true,
        isEditableTarget: true,
      })
    ).toBeNull();
  });

  it('computes wrapping roving-tabindex positions for horizontal, RTL, and vertical toolbars', () => {
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 0,
        itemCount: 5,
        key: 'ArrowRight',
      })
    ).toBe(1);
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 0,
        itemCount: 5,
        key: 'ArrowLeft',
      })
    ).toBe(4);
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 0,
        itemCount: 5,
        key: 'ArrowRight',
        isRtl: true,
      })
    ).toBe(4);
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 3,
        itemCount: 5,
        key: 'Home',
      })
    ).toBe(0);
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 1,
        itemCount: 5,
        key: 'End',
      })
    ).toBe(4);
    expect(
      computeToolbarNextFocusIndex({
        currentIndex: 1,
        itemCount: 5,
        key: 'Tab',
      })
    ).toBeNull();
  });
});
