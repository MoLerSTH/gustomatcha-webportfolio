import { describe, it, expect } from 'vitest';
import {
  BOOT_SESSION_STORAGE_KEY,
  BOOT_TOTAL_DURATION_MS,
  BOOT_EXIT_TRANSITION_MS,
  GUSTO_BOOT_LOGS,
  computeBootSequenceState,
  hasSessionBooted,
  markSessionBooted,
  clearSessionBooted,
} from '../bootSequence';

describe('bootSequence state machine & sessionStorage persistence', () => {
  it('enforces a 5.0s (5000ms) boot sequence budget with deterministic log timestamps', () => {
    expect(BOOT_TOTAL_DURATION_MS).toBe(5000);
    expect(BOOT_TOTAL_DURATION_MS + BOOT_EXIT_TRANSITION_MS).toBeLessThanOrEqual(5500);
    expect(BOOT_SESSION_STORAGE_KEY).toBe('gusto_os_booted_v26');
    expect(GUSTO_BOOT_LOGS.length).toBeGreaterThanOrEqual(6);
    expect(GUSTO_BOOT_LOGS[GUSTO_BOOT_LOGS.length - 1]?.timestampLabel).toBe('4.75s');
  });

  it('clamps non-finite, negative, and over-budget timestamps into [0..1] progress', () => {
    const start = computeBootSequenceState(-50, 2200);
    expect(start.progress01).toBe(0);
    expect(start.progressPercent).toBe(0);
    expect(start.phase).toBe('WIREFRAME_INIT');
    expect(start.isComplete).toBe(false);
    expect(start.visibleLogs.length).toBe(1);

    const mid = computeBootSequenceState(1100, 2200);
    expect(mid.progress01).toBeCloseTo(0.5, 2);
    expect(mid.progressPercent).toBe(50);
    expect(mid.phase).toBe('SHADER_COMPILE');
    expect(mid.isComplete).toBe(false);

    const lock = computeBootSequenceState(1800, 2200);
    expect(lock.phase).toBe('ORBITAL_LOCK');
    expect(lock.isComplete).toBe(false);

    const done = computeBootSequenceState(5000, 2200);
    expect(done.progress01).toBe(1);
    expect(done.progressPercent).toBe(100);
    expect(done.phase).toBe('READY');
    expect(done.isComplete).toBe(true);
    expect(done.visibleLogs).toHaveLength(6);

    const nanState = computeBootSequenceState(Number.NaN, 2200);
    expect(nanState.progress01).toBe(0);
    expect(nanState.isComplete).toBe(false);

    const zeroBudgetState = computeBootSequenceState(0, 0);
    expect(zeroBudgetState.progress01).toBe(1);
    expect(zeroBudgetState.isComplete).toBe(true);
  });

  it('reads, marks, and clears session boot state safely without throwing when storage fails', () => {
    const memory = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v);
      },
      removeItem: (k: string) => {
        memory.delete(k);
      },
    };

    expect(hasSessionBooted(mockStorage)).toBe(false);
    markSessionBooted(mockStorage);
    expect(hasSessionBooted(mockStorage)).toBe(true);
    clearSessionBooted(mockStorage);
    expect(hasSessionBooted(mockStorage)).toBe(false);

    const throwingStorage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(hasSessionBooted(throwingStorage)).toBe(false);
    expect(() => markSessionBooted(throwingStorage)).not.toThrow();
    expect(() => clearSessionBooted(throwingStorage)).not.toThrow();
    expect(hasSessionBooted(null)).toBe(false);
  });
});
