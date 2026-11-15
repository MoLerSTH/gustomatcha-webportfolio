import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import {
  KINETIC_SLAM_BEATS,
  PIXEL_SHATTER_COLS,
  PIXEL_SHATTER_ROWS,
  TerminalBootOverlay,
  canTransitionDisplay,
  computeEaseOutProgress01,
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

  it('cycles through 4 WCAG-safe beats and shatters canvas + top/bottom bars smoothly into pixel fade (Review Focus #2 & #4)', () => {
    expect(KINETIC_SLAM_BEATS).toHaveLength(4);
    expect(PIXEL_SHATTER_COLS).toBe(8);
    expect(PIXEL_SHATTER_ROWS).toBe(6);

    const nanFrame = computeKineticSlamFrame(Number.NaN);
    expect(nanFrame.clampedProgress).toBe(0);
    expect(nanFrame.activeBeat.word).toBe('BUILD.');
    expect(nanFrame.shockwaveScale).toBe(1);
    expect(nanFrame.shatterProgress01).toBe(0);
    expect(nanFrame.hudOpacity).toBe(1);
    expect(nanFrame.canvasTiles).toHaveLength(PIXEL_SHATTER_COLS * PIXEL_SHATTER_ROWS);
    expect(nanFrame.topBarTiles).toHaveLength(PIXEL_SHATTER_COLS);
    expect(nanFrame.bottomBarTiles).toHaveLength(PIXEL_SHATTER_COLS);
    expect(nanFrame.canvasTiles.every((t) => t.opacity === 1 && t.offsetXpx === 0)).toBe(true);
    expect(nanFrame.topBarTiles.every((t) => t.opacity === 1 && t.offsetYpx === 0)).toBe(true);
    expect(nanFrame.bottomBarTiles.every((t) => t.opacity === 1 && t.offsetYpx === 0)).toBe(true);

    const low = computeKineticSlamFrame(-1);
    expect(low.clampedProgress).toBe(0);
    expect(low.activeBeat.word).toBe('BUILD.');

    expect(computeKineticSlamFrame(0.35).activeBeat.word).toBe('GEO_AI.');
    expect(computeKineticSlamFrame(0.65).activeBeat.word).toBe('DEFEND.');

    const finale = computeKineticSlamFrame(0.92);
    expect(finale.activeBeat.word).toBe('GUSTO_OS');
    expect(finale.shockwaveScale).toBeGreaterThan(1);
    expect(finale.shatterProgress01).toBeGreaterThan(0);
    expect(finale.hudOpacity).toBeLessThan(1);
    expect(finale.canvasTiles.some((t) => t.opacity < 1 && t.scale < 1)).toBe(true);
    expect(finale.topBarTiles.some((t) => t.offsetYpx < 0 && t.opacity < 1)).toBe(true);
    expect(finale.bottomBarTiles.some((t) => t.offsetYpx > 0 && t.opacity < 1)).toBe(true);

    const over = computeKineticSlamFrame(1.5);
    expect(over.clampedProgress).toBe(1);
    expect(over.activeBeat.word).toBe('GUSTO_OS');
    expect(over.shatterProgress01).toBe(1);
    expect(over.hudOpacity).toBe(0);
    expect(over.canvasTiles.every((t) => t.opacity === 0)).toBe(true);
    expect(over.topBarTiles.every((t) => t.opacity === 0)).toBe(true);
    expect(over.bottomBarTiles.every((t) => t.opacity === 0)).toBe(true);
  });

  it('renders full-viewport Kinetic Brutalist Slam poster and pixel shatter grid in English', () => {
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
    expect(html).toContain('data-shattering="false"');
    expect(html).toContain('data-shatter-canvas-tile="0"');
    expect(html).toContain('data-shatter-canvas-tile="47"');
    expect(html).toContain('data-shatter-top-tile="0"');
    expect(html).toContain('data-shatter-bottom-tile="7"');
    expect(html).not.toContain('<main');
    expect(html).not.toMatch(/[\u0E00-\u0E7F]/);

    const finaleState = computeBootSequenceState(4650, 5000);
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
    expect(finaleHtml).toContain('data-shattering="true"');
    expect(finaleHtml).not.toMatch(/[\u0E00-\u0E7F]/);
  });

  it('neutralizes pixel shatter scatter, shockwave, and poster motion under prefers-reduced-motion: reduce', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
    expect(css).toMatch(/\.neo-boot-overlay\s*\{[^}]*margin:\s*0;/);
    const reducedIndex = css.lastIndexOf('@media (prefers-reduced-motion: reduce)');
    expect(reducedIndex).toBeGreaterThan(-1);
    const reducedBlock = css.slice(reducedIndex);
    expect(reducedBlock).toContain('.neo-kinetic-pixel');
    expect(reducedBlock).toContain('.neo-kinetic-shockwave');
    expect(reducedBlock).toContain('.neo-kinetic-hud');
    expect(css).toMatch(/\.neo-boot-progress-fill\s*\{[^}]*ease-out/);
  });

  it('applies ease-out progression to the bottom progress bar across the 5s boot timeline', () => {
    expect(computeEaseOutProgress01(Number.NaN)).toBe(0);
    expect(computeEaseOutProgress01(-0.25)).toBe(0);
    expect(computeEaseOutProgress01(0)).toBe(0);
    expect(computeEaseOutProgress01(0.5)).toBe(0.75);
    expect(computeEaseOutProgress01(1.4)).toBe(1);

    const midState = computeBootSequenceState(2500, 5000);
    const html = renderToStaticMarkup(
      createElement(TerminalBootOverlay, {
        state: midState,
        isVisible: true,
        isClosing: false,
        onSkip: () => {},
      })
    );
    expect(html).toContain('--boot-progress-01:0.75');
    expect(html).toContain('3D_WIREFRAME_ASSEMBLY: 75%');
    expect(html).toContain('SHADER_COMPILE // 50%');
  });
});
