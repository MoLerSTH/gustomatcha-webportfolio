import { describe, it, expect, vi } from 'vitest';
import {
  RapidClickDetector,
  computeScrollChoreographyState,
} from '../GustoWorldEngine';

describe('GustoWorldEngine Pure Logic Helpers', () => {
  it('fires onRapidTrigger when 5 clicks occur within the time window', () => {
    const spy = vi.fn();
    const detector = new RapidClickDetector(5, 1800, spy);
    detector.registerClick(100);
    detector.registerClick(300);
    detector.registerClick(600);
    detector.registerClick(900);
    expect(spy).not.toHaveBeenCalled();
    detector.registerClick(1200);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('computes smooth camera & disassembly choreography across scroll [0..1]', () => {
    const start = computeScrollChoreographyState(0);
    const mid = computeScrollChoreographyState(0.5);
    const end = computeScrollChoreographyState(1);

    expect(start.ringExpansion).toBe(1);
    expect(mid.ringExpansion).toBeGreaterThan(start.ringExpansion);
    expect(end.cameraZ).not.toBe(start.cameraZ);
  });
});
