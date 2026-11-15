import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import {
  KINETIC_SLAM_BEATS,
  TerminalBootOverlay,
  canTransitionDisplay,
  computeKineticSlamFrame,
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

  it('cycles through exactly 4 WCAG-safe kinetic typography beats and triggers end shockwave (Review Focus #2 & #4)', () => {
    expect(KINETIC_SLAM_BEATS).toHaveLength(4);

    const nanFrame = computeKineticSlamFrame(Number.NaN);
    expect(nanFrame.clampedProgress).toBe(0);
    expect(nanFrame.activeBeat.word).toBe('BUILD.');
    expect(nanFrame.shockwaveScale).toBe(1);
    expect(nanFrame.curtainSplit01).toBe(0);

    const low = computeKineticSlamFrame(-1);
    expect(low.clampedProgress).toBe(0);
    expect(low.activeBeat.word).toBe('BUILD.');

    expect(computeKineticSlamFrame(0.35).activeBeat.word).toBe('GEO_AI.');
    expect(computeKineticSlamFrame(0.65).activeBeat.word).toBe('DEFEND.');

    const finale = computeKineticSlamFrame(0.92);
    expect(finale.activeBeat.word).toBe('GUSTO_OS');
    expect(finale.shockwaveScale).toBeGreaterThan(1);
    expect(finale.curtainSplit01).toBeGreaterThan(0);

    const over = computeKineticSlamFrame(1.5);
    expect(over.clampedProgress).toBe(1);
    expect(over.activeBeat.word).toBe('GUSTO_OS');
    expect(over.curtainSplit01).toBe(1);
  });

  it('renders full-viewport Kinetic Brutalist Slam poster and shockwave ring in English', () => {
    const state = computeBootSequenceState(500, 2200);
    const html = renderToStaticMarkup(
      createElement(TerminalBootOverlay, {
        state,
        isVisible: true,
        isClosing: false,
        onSkip: () => {},
      })
    );
    expect(html).toContain('KINETIC_OVERCLOCK_SLAM');
    expect(html).toContain('BUILD.');
    expect(html).toContain('01 // FULL-STACK ARCHITECTURE');
    expect(html).toContain('SKIP INTRO');
    expect(html).toContain('id="gusto-boot-title"');
    expect(html).toContain('id="gusto-boot-progress"');
    expect(html).toContain('m-0');
    expect(html).toContain('data-splitting="false"');
    expect(html).not.toContain('<main');
    expect(html).not.toMatch(/[\u0E00-\u0E7F]/);

    const finaleState = computeBootSequenceState(2100, 2200);
    const finaleHtml = renderToStaticMarkup(
      createElement(TerminalBootOverlay, {
        state: finaleState,
        isVisible: true,
        isClosing: false,
        onSkip: () => {},
      })
    );
    expect(finaleHtml).toContain('GUSTO_OS');
    expect(finaleHtml).toContain('04 // 60FPS WEBGL CORE READY');
    expect(finaleHtml).toContain('data-beat-index="3"');
    expect(finaleHtml).toContain('data-splitting="true"');
    expect(finaleHtml).not.toMatch(/[\u0E00-\u0E7F]/);
  });

  it('neutralizes kinetic slam curtains, shockwave, and poster motion under prefers-reduced-motion: reduce, and resets overlay margin against parent space-y-*', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
    expect(css).toMatch(/\.neo-boot-overlay\s*\{[^}]*margin:\s*0;/);
    const reducedIndex = css.lastIndexOf('@media (prefers-reduced-motion: reduce)');
    expect(reducedIndex).toBeGreaterThan(-1);
    const reducedBlock = css.slice(reducedIndex);
    expect(reducedBlock).toContain('.neo-kinetic-curtain');
    expect(reducedBlock).toContain('.neo-kinetic-shockwave');
  });
});
