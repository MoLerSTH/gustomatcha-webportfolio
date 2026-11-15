import { describe, it, expect } from 'vitest';
import {
  canTransitionDisplay,
  formatBootTelemetryLine,
  resolveOverlayAttributes,
} from '../TerminalBootOverlay';
import { computeBootSequenceState } from '@/lib/bootSequence';

describe('TerminalBootOverlay helpers & discrete display probe', () => {
  it('returns false safely in non-DOM / SSR environments for canTransitionDisplay()', () => {
    expect(canTransitionDisplay()).toBe(false);
  });

  it('formats deterministic terminal boot telemetry summary for current assembly phase', () => {
    const midState = computeBootSequenceState(1100, 2200);
    const line = formatBootTelemetryLine(midState);
    expect(line).toContain('50%');
    expect(line).toContain('SHADER_COMPILE');
  });

  it('resolves hidden and data-closing attributes cleanly for native allow-discrete vs Firefox fallback', () => {
    expect(resolveOverlayAttributes(false, false, true)).toEqual({
      hidden: true,
      closing: false,
    });
    expect(resolveOverlayAttributes(true, false, false)).toEqual({
      hidden: false,
      closing: false,
    });
    // Native display transition sets [hidden] immediately during exit
    expect(resolveOverlayAttributes(false, true, true)).toEqual({
      hidden: true,
      closing: true,
    });
    // Fallback keeps element visible with [data-closing] until opacity/translate finishes
    expect(resolveOverlayAttributes(false, true, false)).toEqual({
      hidden: false,
      closing: true,
    });
  });
});
