import { describe, it, expect } from 'vitest';
import { AudioReactiveController } from '../AudioReactiveController';

describe('AudioReactiveController', () => {
  it('starts disabled by default to respect WCAG 1.4.2 no-autoplay and returns zeroed telemetry', () => {
    const controller = new AudioReactiveController();
    expect(controller.isEnabled()).toBe(false);
    const snap = controller.sampleFrequencies(1.0);
    expect(snap.isActive).toBe(false);
    expect(snap.overall).toBe(0);
    controller.dispose();
  });

  it('produces normalized [0..1] frequency bands when active in headless/fallback synth mode', async () => {
    const controller = new AudioReactiveController();
    await controller.start();
    expect(controller.isEnabled()).toBe(true);
    const snap = controller.sampleFrequencies(0.5);
    expect(snap.isActive).toBe(true);
    expect(snap.bass).toBeGreaterThanOrEqual(0);
    expect(snap.bass).toBeLessThanOrEqual(1);
    expect(snap.overall).toBeGreaterThan(0);
    controller.stop();
    expect(controller.isEnabled()).toBe(false);
    controller.dispose();
  });

  it('accepts selectable waveforms and boosts transient energy safely in Node/SSR', async () => {
    const controller = new AudioReactiveController();
    await controller.start();
    const baseline = controller.sampleFrequencies(0.25);

    controller.triggerSynthPulse(329.63, 0.2, 'square');
    const boosted = controller.sampleFrequencies(0.25);

    expect(boosted.overall).toBeGreaterThan(baseline.overall);
    expect(boosted.overall).toBeLessThanOrEqual(1);
    controller.dispose();
  });
});
