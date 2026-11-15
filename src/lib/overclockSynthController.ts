export type SynthWaveform = 'sawtooth' | 'square' | 'triangle' | 'sine';

export type SynthOctaveShift = -1 | 0 | 1;

export interface SynthPadSpec {
  id: string;
  code: string;
  noteLabel: string;
  keyHint: string;
  baseFreqHz: number;
  colorHex: string;
  accent: 'yellow' | 'mint' | 'coral' | 'cobalt';
}

export const SYNTH_PAD_SPECS: readonly SynthPadSpec[] = [
  {
    id: 'pad-e3',
    code: 'STR_01',
    noteLabel: 'E3',
    keyHint: '1',
    baseFreqHz: 164.81,
    colorHex: '#FFE600',
    accent: 'yellow',
  },
  {
    id: 'pad-g3',
    code: 'STR_02',
    noteLabel: 'G3',
    keyHint: '2',
    baseFreqHz: 196.0,
    colorHex: '#00F5D4',
    accent: 'mint',
  },
  {
    id: 'pad-a3',
    code: 'STR_03',
    noteLabel: 'A3',
    keyHint: '3',
    baseFreqHz: 220.0,
    colorHex: '#FF5D8F',
    accent: 'coral',
  },
  {
    id: 'pad-b3',
    code: 'STR_04',
    noteLabel: 'B3',
    keyHint: '4',
    baseFreqHz: 246.94,
    colorHex: '#3A86FF',
    accent: 'cobalt',
  },
  {
    id: 'pad-d4',
    code: 'STR_05',
    noteLabel: 'D4',
    keyHint: '5',
    baseFreqHz: 293.66,
    colorHex: '#FFE600',
    accent: 'yellow',
  },
  {
    id: 'pad-e4',
    code: 'STR_06',
    noteLabel: 'E4',
    keyHint: '6',
    baseFreqHz: 329.63,
    colorHex: '#00F5D4',
    accent: 'mint',
  },
] as const;

/**
 * Scales a base frequency by an integer octave shift (-1, 0, +1).
 * Clamps invalid/non-positive inputs safely to 220 Hz * 2^shift.
 */
export function computeSynthFrequency(
  baseFreqHz: number,
  octaveShift: SynthOctaveShift = 0
): number {
  const safeBase =
    Number.isFinite(baseFreqHz) && baseFreqHz > 0 ? baseFreqHz : 220;
  return Number((safeBase * Math.pow(2, octaveShift)).toFixed(2));
}

export type SynthShortcutAction =
  | { type: 'toggle-overclock' }
  | { type: 'trigger-pad'; pad: SynthPadSpec };

export interface SynthShortcutInput {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  isOverclockActive: boolean;
  isEditableTarget: boolean;
  isModalOpen?: boolean;
}

/**
 * Resolves global keyboard shortcuts (`Alt+O` toggle and `1`–`6` synth pads
 * when Overclock is active) while safely ignoring editable targets or open modal dialogs.
 */
export function resolveSynthShortcutAction(
  input: SynthShortcutInput
): SynthShortcutAction | null {
  if (input.isEditableTarget || input.isModalOpen) {
    return null;
  }

  if (
    input.altKey &&
    !input.ctrlKey &&
    !input.metaKey &&
    input.key.toLowerCase() === 'o'
  ) {
    return { type: 'toggle-overclock' };
  }

  if (
    !input.isOverclockActive ||
    input.altKey ||
    input.ctrlKey ||
    input.metaKey
  ) {
    return null;
  }

  const matchedPad = SYNTH_PAD_SPECS.find((pad) => pad.keyHint === input.key);
  if (matchedPad) {
    return { type: 'trigger-pad', pad: matchedPad };
  }

  return null;
}

export interface ToolbarFocusStepInput {
  currentIndex: number;
  itemCount: number;
  key: string;
  isRtl?: boolean;
  isVertical?: boolean;
}

/**
 * Computes wrapping roving-tabindex focus moves for horizontal (LTR/RTL) and
 * vertical WAI-ARIA toolbars when native `focusgroup` is unsupported.
 */
export function computeToolbarNextFocusIndex({
  currentIndex,
  itemCount,
  key,
  isRtl = false,
  isVertical = false,
}: ToolbarFocusStepInput): number | null {
  if (itemCount <= 0) {
    return null;
  }

  const safeCurrent =
    currentIndex >= 0 && currentIndex < itemCount ? currentIndex : 0;

  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return itemCount - 1;
  }

  if (isVertical) {
    if (key === 'ArrowDown') {
      return (safeCurrent + 1) % itemCount;
    }
    if (key === 'ArrowUp') {
      return (safeCurrent - 1 + itemCount) % itemCount;
    }
    return null;
  }

  const forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
  const backwardKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

  if (key === forwardKey) {
    return (safeCurrent + 1) % itemCount;
  }
  if (key === backwardKey) {
    return (safeCurrent - 1 + itemCount) % itemCount;
  }

  return null;
}
