import { describe, it, expect, vi } from 'vitest';
import {
  GustoWorldEngine,
  RapidClickDetector,
  applyContainerCursorState,
  computeScrollChoreographyState,
  computeAssemblyVisualState,
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

  it('interpolates 3D wireframe-to-solid assembly state across [0..1] and clamps out-of-range inputs', () => {
    const rawWireframe = computeAssemblyVisualState(0);
    const halfAssembled = computeAssemblyVisualState(0.5);
    const fullyAssembled = computeAssemblyVisualState(1);
    const clampedLow = computeAssemblyVisualState(-2);
    const clampedHigh = computeAssemblyVisualState(3);
    const clampedNaN = computeAssemblyVisualState(Number.NaN);

    expect(rawWireframe.solidFillMix).toBe(0);
    expect(rawWireframe.wireframeExpansion).toBeGreaterThan(fullyAssembled.wireframeExpansion);
    expect(halfAssembled.coreScale).toBeGreaterThan(rawWireframe.coreScale);
    expect(fullyAssembled.coreScale).toBeCloseTo(1, 4);
    expect(fullyAssembled.wireframeExpansion).toBeCloseTo(1, 4);
    expect(fullyAssembled.ringAssemblyScale).toBeCloseTo(1, 4);
    expect(fullyAssembled.satelliteOrbitFactor).toBeCloseTo(1, 4);
    expect(fullyAssembled.solidFillMix).toBeCloseTo(1, 4);

    expect(clampedLow).toEqual(rawWireframe);
    expect(clampedHigh).toEqual(fullyAssembled);
    expect(clampedNaN).toEqual(rawWireframe);
  });

  it('initializes assemblyProgress from constructor options before first render frame and clamps invalid inputs', () => {
    const mockContainer = {} as HTMLElement;
    const bootingEngine = new GustoWorldEngine(
      mockContainer,
      {},
      { initialAssemblyProgress: 0 }
    );
    expect(bootingEngine.getAssemblyProgress()).toBe(0);

    bootingEngine.setAssemblyProgress(0.65);
    expect(bootingEngine.getAssemblyProgress()).toBeCloseTo(0.65, 4);

    const clampedEngine = new GustoWorldEngine(
      mockContainer,
      {},
      { initialAssemblyProgress: Number.NaN }
    );
    expect(clampedEngine.getAssemblyProgress()).toBe(0);
  });

  it('updates container dataset.cursor without mutating inline style.cursor and clears on null/dispose', () => {
    const dataset: DOMStringMap = {};
    const style = { cursor: '' };
    const domContainer = { dataset, style } as unknown as HTMLElement;

    const engine = new GustoWorldEngine(domContainer);
    expect(domContainer.dataset.cursor).toBe('crosshair');
    expect(domContainer.style.cursor).toBe('');

    applyContainerCursorState(domContainer, 'pointer');
    expect(domContainer.dataset.cursor).toBe('pointer');
    expect(domContainer.style.cursor).toBe('');

    applyContainerCursorState(domContainer, 'crosshair');
    expect(domContainer.dataset.cursor).toBe('crosshair');

    applyContainerCursorState(domContainer, 'pointer');
    const engineInternal = engine as unknown as {
      handlePointerLeave: () => void;
    };
    engineInternal.handlePointerLeave();
    expect(domContainer.dataset.cursor).toBe('crosshair');

    applyContainerCursorState(domContainer, 'pointer');
    engine.dispose();
    expect(domContainer.dataset.cursor).toBeUndefined();
    expect(domContainer.style.cursor).toBe('');

    // Simulate a late pointerleave arriving during/after unmount disposal
    engineInternal.handlePointerLeave();
    expect(domContainer.dataset.cursor).toBeUndefined();

    expect(() => applyContainerCursorState(null, 'pointer')).not.toThrow();
    expect(() => applyContainerCursorState(undefined, null)).not.toThrow();
    expect(() => applyContainerCursorState({} as HTMLElement, 'crosshair')).not.toThrow();
  });
});
