export type KonamiButtonId = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'B' | 'A';
export type KonamiInputSource = 'pointer' | 'keyboard';

export interface KonamiButtonSpec {
  id: KonamiButtonId;
  glyph: string;
  shortLabel: string;
  ariaLabel: string;
  keyHint: string;
  freqHz: number;
}

export const KONAMI_SEQUENCE: readonly KonamiButtonId[] = [
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
] as const;

export const KONAMI_HINT_TEXT = '(↑ ↑ ↓ ↓ ← → ← → B A)';

export const KONAMI_BUTTON_SPECS: Readonly<
  Record<KonamiButtonId, KonamiButtonSpec>
> = {
  UP: {
    id: 'UP',
    glyph: '↑',
    shortLabel: 'UP',
    ariaLabel: 'Up (↑)',
    keyHint: 'ArrowUp',
    freqHz: 523.25,
  },
  DOWN: {
    id: 'DOWN',
    glyph: '↓',
    shortLabel: 'DOWN',
    ariaLabel: 'Down (↓)',
    keyHint: 'ArrowDown',
    freqHz: 392.0,
  },
  LEFT: {
    id: 'LEFT',
    glyph: '←',
    shortLabel: 'LEFT',
    ariaLabel: 'Left (←)',
    keyHint: 'ArrowLeft',
    freqHz: 440.0,
  },
  RIGHT: {
    id: 'RIGHT',
    glyph: '→',
    shortLabel: 'RIGHT',
    ariaLabel: 'Right (→)',
    keyHint: 'ArrowRight',
    freqHz: 493.88,
  },
  B: {
    id: 'B',
    glyph: 'B',
    shortLabel: 'B',
    ariaLabel: 'Button B',
    keyHint: 'B',
    freqHz: 587.33,
  },
  A: {
    id: 'A',
    glyph: 'A',
    shortLabel: 'A',
    ariaLabel: 'Button A',
    keyHint: 'A',
    freqHz: 659.25,
  },
} as const;

export const MAX_PRESSED_LOG = 10;

export const KONAMI_UNLOCK_ARPEGGIO_HZ: readonly number[] = [
  523.25, 659.25, 783.99, 1046.5,
];

export const KONAMI_TROLL_COPY = {
  eyebrow: 'KONAMI_10 // GOTCHA!',
  headline: "YOU GOT FOOLED! THERE'S NOTHING HERE LOL 😜",
  subline:
    'Entered the whole code for... literally nothing! Press RESET to try again.',
} as const;

export interface KonamiState {
  status: 'entering' | 'unlocked';
  matchedCount: number;
  pressedLog: KonamiButtonId[];
  lastPressed: KonamiButtonId | null;
  lastSource: KonamiInputSource | null;
  pressSeq: number;
  totalPressCount: number;
}

export const INITIAL_KONAMI_STATE: KonamiState = {
  status: 'entering',
  matchedCount: 0,
  pressedLog: [],
  lastPressed: null,
  lastSource: null,
  pressSeq: 0,
  totalPressCount: 0,
};

const ARROW_BUTTONS = new Set<KonamiButtonId>([
  'UP',
  'DOWN',
  'LEFT',
  'RIGHT',
]);

const KEY_TO_KONAMI_BUTTON: Readonly<Record<string, KonamiButtonId>> = {
  arrowup: 'UP',
  arrowdown: 'DOWN',
  arrowleft: 'LEFT',
  arrowright: 'RIGHT',
  b: 'B',
  a: 'A',
};

/**
 * Returns the length of the longest suffix of `inputs` that matches a valid
 * prefix of `KONAMI_SEQUENCE`, enabling seamless recovery on repeated prefix keys.
 */
export function computeLongestKonamiPrefix(
  inputs: readonly KonamiButtonId[]
): number {
  const maxCandidate = Math.min(inputs.length, KONAMI_SEQUENCE.length);
  for (let len = maxCandidate; len >= 1; len--) {
    let matches = true;
    const offset = inputs.length - len;
    for (let i = 0; i < len; i++) {
      if (inputs[offset + i] !== KONAMI_SEQUENCE[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return len;
    }
  }
  return 0;
}

/**
 * Advances the Konami decoder state for a single button press from pointer or keyboard.
 */
export function stepKonamiInput(
  state: KonamiState,
  button: KonamiButtonId,
  source: KonamiInputSource = 'pointer'
): KonamiState {
  const pressedLog = [...state.pressedLog, button].slice(-MAX_PRESSED_LOG);
  const pressSeq = state.pressSeq + 1;
  const totalPressCount = state.totalPressCount + 1;

  if (state.status === 'unlocked') {
    return {
      ...state,
      pressedLog,
      lastPressed: button,
      lastSource: source,
      pressSeq,
      totalPressCount,
    };
  }

  const candidateSequence = [
    ...KONAMI_SEQUENCE.slice(0, state.matchedCount),
    button,
  ];
  const matchedCount = computeLongestKonamiPrefix(candidateSequence);
  const status =
    matchedCount === KONAMI_SEQUENCE.length ? 'unlocked' : 'entering';

  return {
    status,
    matchedCount,
    pressedLog,
    lastPressed: button,
    lastSource: source,
    pressSeq,
    totalPressCount,
  };
}

/**
 * Returns a fresh initial state for the Konami console (`RESET` action).
 */
export function resetKonamiState(): KonamiState {
  return INITIAL_KONAMI_STATE;
}

/**
 * Builds a concise, screen-reader-friendly status line reflecting current console state.
 */
export function formatKonamiLiveAnnouncement(state: KonamiState): string {
  if (state.status === 'unlocked') {
    const extraKey =
      state.totalPressCount > KONAMI_SEQUENCE.length && state.lastPressed
        ? ` Pressed ${KONAMI_BUTTON_SPECS[state.lastPressed].shortLabel}.`
        : '';
    return `Konami code accepted. ${KONAMI_TROLL_COPY.headline} Press Reset to clear.${extraKey}`;
  }

  if (state.lastPressed === null) {
    return 'Konami Game Boy Console Ready. Hint: Up Up Down Down Left Right Left Right B A.';
  }

  const spec = KONAMI_BUTTON_SPECS[state.lastPressed];
  const sourceLabel = state.lastSource === 'keyboard' ? 'keyboard' : 'click';
  return `${spec.shortLabel} pressed via ${sourceLabel}. Progress ${state.matchedCount} of ${KONAMI_SEQUENCE.length}.`;
}

export interface KonamiKeyboardEventInput {
  key: string;
  repeat?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  isEditableTarget: boolean;
  isModalOpen?: boolean;
  isToolbarTarget?: boolean;
  isConsoleFocused: boolean;
}

export type KonamiKeyboardResolution =
  | { action: 'press'; button: KonamiButtonId; shouldPreventDefault: boolean }
  | { action: 'reset'; shouldPreventDefault: boolean }
  | null;

/**
 * Maps physical keyboard events to Game Boy actions while guarding editable
 * fields, modals, arrow toolbars, key auto-repeat, and unfocused page scroll.
 */
export function resolveKonamiKeyboardInput(
  input: KonamiKeyboardEventInput
): KonamiKeyboardResolution {
  if (
    input.repeat ||
    input.altKey ||
    input.ctrlKey ||
    input.metaKey ||
    input.isEditableTarget ||
    input.isModalOpen ||
    input.isToolbarTarget
  ) {
    return null;
  }

  const normalizedKey = input.key.toLowerCase();

  if (normalizedKey === 'escape') {
    if (!input.isConsoleFocused) {
      return null;
    }
    return { action: 'reset', shouldPreventDefault: true };
  }

  const mappedButton = KEY_TO_KONAMI_BUTTON[normalizedKey];
  if (!mappedButton) {
    return null;
  }

  return {
    action: 'press',
    button: mappedButton,
    shouldPreventDefault:
      input.isConsoleFocused && ARROW_BUTTONS.has(mappedButton),
  };
}
