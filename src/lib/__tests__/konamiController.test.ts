import { describe, expect, it } from 'vitest';
import {
  INITIAL_KONAMI_STATE,
  KONAMI_BUTTON_SPECS,
  KONAMI_HINT_TEXT,
  KONAMI_SEQUENCE,
  MAX_PRESSED_LOG,
  computeLongestKonamiPrefix,
  formatKonamiLiveAnnouncement,
  resetKonamiState,
  resolveKonamiKeyboardInput,
  stepKonamiInput,
  type KonamiButtonId,
} from '../konamiController';

describe('konamiController', () => {
  it('defines exact 10-step Konami sequence, hint string, and 8-bit square frequencies', () => {
    expect(KONAMI_SEQUENCE).toEqual([
      'UP',
      'UP',
      'DOWN',
      'DOWN',
      'LEFT',
      'RIGHT',
      'LEFT',
      'RIGHT',
      'B',
      'A',
    ]);
    expect(KONAMI_HINT_TEXT).toBe('(↑ ↑ ↓ ↓ ← → ← → B A)');
    expect(KONAMI_BUTTON_SPECS.UP.freqHz).toBeCloseTo(523.25, 2);
    expect(KONAMI_BUTTON_SPECS.DOWN.freqHz).toBeCloseTo(392.0, 2);
    expect(KONAMI_BUTTON_SPECS.LEFT.freqHz).toBeCloseTo(440.0, 2);
    expect(KONAMI_BUTTON_SPECS.RIGHT.freqHz).toBeCloseTo(493.88, 2);
    expect(KONAMI_BUTTON_SPECS.B.freqHz).toBeCloseTo(587.33, 2);
    expect(KONAMI_BUTTON_SPECS.A.freqHz).toBeCloseTo(659.25, 2);
  });

  it('unlocks troll state on exact 10-step sequence and tracks pressedLog + source', () => {
    let state = INITIAL_KONAMI_STATE;
    for (const key of KONAMI_SEQUENCE) {
      state = stepKonamiInput(state, key, 'pointer');
    }
    expect(state.status).toBe('unlocked');
    expect(state.matchedCount).toBe(10);
    expect(state.lastPressed).toBe('A');
    expect(state.lastSource).toBe('pointer');
    expect(state.pressedLog).toEqual([
      'UP',
      'UP',
      'DOWN',
      'DOWN',
      'LEFT',
      'RIGHT',
      'LEFT',
      'RIGHT',
      'B',
      'A',
    ]);
    expect(state.pressSeq).toBe(10);
    expect(state.totalPressCount).toBe(10);
  });

  it('recovers overlapping prefixes via KMP fallback (Review Focus #1: extra UP or restart on UP)', () => {
    const noisySequence: KonamiButtonId[] = [
      'UP',
      'UP',
      'UP', // 3rd UP should keep matchedCount at 2
      'DOWN',
      'DOWN',
      'LEFT',
      'RIGHT',
      'LEFT',
      'RIGHT',
      'B',
      'A',
    ];
    let state = INITIAL_KONAMI_STATE;
    for (let i = 0; i < 3; i++) {
      state = stepKonamiInput(state, noisySequence[i], 'keyboard');
    }
    expect(state.matchedCount).toBe(2);

    for (let i = 3; i < noisySequence.length; i++) {
      state = stepKonamiInput(state, noisySequence[i], 'keyboard');
    }
    expect(state.status).toBe('unlocked');
    expect(state.pressedLog).toEqual([
      'UP',
      'UP',
      'DOWN',
      'DOWN',
      'LEFT',
      'RIGHT',
      'LEFT',
      'RIGHT',
      'B',
      'A',
    ]);
    expect(state.pressedLog).toHaveLength(MAX_PRESSED_LOG);
    expect(state.totalPressCount).toBe(11);

    // Mid-sequence restart on UP falls back cleanly to 1
    expect(
      computeLongestKonamiPrefix(['UP', 'UP', 'DOWN', 'DOWN', 'LEFT', 'RIGHT', 'UP'])
    ).toBe(1);
    expect(computeLongestKonamiPrefix(['UP', 'DOWN', 'LEFT'])).toBe(0);
    expect(computeLongestKonamiPrefix([])).toBe(0);
  });

  it('keeps status unlocked and echoes pressed keys after completion until resetKonamiState is called (Review Focus #4)', () => {
    let state = INITIAL_KONAMI_STATE;
    for (const key of KONAMI_SEQUENCE) {
      state = stepKonamiInput(state, key, 'keyboard');
    }
    const afterExtraTap = stepKonamiInput(state, 'B', 'pointer');
    expect(afterExtraTap.status).toBe('unlocked');
    expect(afterExtraTap.matchedCount).toBe(10);
    expect(afterExtraTap.lastPressed).toBe('B');
    expect(afterExtraTap.lastSource).toBe('pointer');
    expect(afterExtraTap.pressSeq).toBe(11);
    expect(afterExtraTap.pressedLog[afterExtraTap.pressedLog.length - 1]).toBe('B');

    const reset = resetKonamiState();
    expect(reset).toEqual(INITIAL_KONAMI_STATE);
  });

  it('resolves keyboard inputs with repeat, modifier, focus, editable, modal, and toolbar guards (Review Focus #2 & #3)', () => {
    // Auto-repeat & modifiers ignored
    expect(
      resolveKonamiKeyboardInput({
        key: 'ArrowUp',
        repeat: true,
        isEditableTarget: false,
        isConsoleFocused: true,
      })
    ).toBeNull();
    expect(
      resolveKonamiKeyboardInput({
        key: 'a',
        ctrlKey: true,
        isEditableTarget: false,
        isConsoleFocused: true,
      })
    ).toBeNull();
    expect(
      resolveKonamiKeyboardInput({
        key: 'b',
        altKey: true,
        isEditableTarget: false,
        isConsoleFocused: false,
      })
    ).toBeNull();

    // Editable / Modal / Toolbar ignored
    expect(
      resolveKonamiKeyboardInput({
        key: 'ArrowUp',
        isEditableTarget: true,
        isConsoleFocused: true,
      })
    ).toBeNull();
    expect(
      resolveKonamiKeyboardInput({
        key: 'B',
        isEditableTarget: false,
        isModalOpen: true,
        isConsoleFocused: true,
      })
    ).toBeNull();
    expect(
      resolveKonamiKeyboardInput({
        key: 'ArrowLeft',
        isEditableTarget: false,
        isToolbarTarget: true,
        isConsoleFocused: false,
      })
    ).toBeNull();

    // Focused console prevents default on arrows and allows Escape reset
    expect(
      resolveKonamiKeyboardInput({
        key: 'ArrowDown',
        isEditableTarget: false,
        isConsoleFocused: true,
      })
    ).toEqual({
      action: 'press',
      button: 'DOWN',
      shouldPreventDefault: true,
    });
    expect(
      resolveKonamiKeyboardInput({
        key: 'A',
        isEditableTarget: false,
        isConsoleFocused: true,
      })
    ).toEqual({
      action: 'press',
      button: 'A',
      shouldPreventDefault: false,
    });
    expect(
      resolveKonamiKeyboardInput({
        key: 'Escape',
        isEditableTarget: false,
        isConsoleFocused: true,
      })
    ).toEqual({
      action: 'reset',
      shouldPreventDefault: true,
    });

    // Unfocused global listener captures Konami keys passively without blocking scroll
    expect(
      resolveKonamiKeyboardInput({
        key: 'ArrowDown',
        isEditableTarget: false,
        isConsoleFocused: false,
      })
    ).toEqual({
      action: 'press',
      button: 'DOWN',
      shouldPreventDefault: false,
    });
    expect(
      resolveKonamiKeyboardInput({
        key: 'b',
        isEditableTarget: false,
        isConsoleFocused: false,
      })
    ).toEqual({
      action: 'press',
      button: 'B',
      shouldPreventDefault: false,
    });
    expect(
      resolveKonamiKeyboardInput({
        key: 'Escape',
        isEditableTarget: false,
        isConsoleFocused: false,
      })
    ).toBeNull();
  });

  it('formats concise polite all-English screen-reader announcements for idle, milestone, and unlocked states', () => {
    expect(formatKonamiLiveAnnouncement(INITIAL_KONAMI_STATE)).toContain('Ready');
    let state = stepKonamiInput(INITIAL_KONAMI_STATE, 'UP', 'keyboard');
    expect(formatKonamiLiveAnnouncement(state)).toContain('1 of 10');
    for (const key of KONAMI_SEQUENCE.slice(1)) {
      state = stepKonamiInput(state, key, 'keyboard');
    }
    expect(formatKonamiLiveAnnouncement(state)).toContain('YOU GOT FOOLED');
  });
});
