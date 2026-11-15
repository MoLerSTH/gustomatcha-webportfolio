import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const GLOBALS_CSS_PATH = resolve(process.cwd(), 'src/app/globals.css');

function extractBraceBlock(css: string, headerStartIndex: number): string {
  const openBraceIndex = css.indexOf('{', headerStartIndex);
  if (openBraceIndex === -1) return '';
  let depth = 0;
  for (let i = openBraceIndex; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return css.slice(openBraceIndex + 1, i);
      }
    }
  }
  return '';
}

function collectMediaBlocks(css: string, marker: string): string[] {
  const blocks: string[] = [];
  let cursor = css.indexOf(marker);
  while (cursor !== -1) {
    blocks.push(extractBraceBlock(css, cursor));
    cursor = css.indexOf(marker, cursor + marker.length);
  }
  return blocks;
}

describe('globals.css Konami Game Boy console classes & accessibility media guards', () => {
  it('defines Game Boy shell, DMG & Overclock LCD palettes, D-Pad, A/B caps, and Reset pill before fine-pointer cursor rules', () => {
    const css = readFileSync(GLOBALS_CSS_PATH, 'utf8');
    const finePointerIndex = css.indexOf('@media (hover: hover) and (pointer: fine)');

    expect(css).toContain('.neo-gameboy-shell');
    expect(css).toContain('.neo-gameboy-bezel');
    expect(css).toContain('.neo-gameboy-lcd');
    expect(css).toContain('#9bbc0f');
    expect(css).toContain('#0f380f');
    expect(css).toContain(":root[data-theme='overclock'] .neo-gameboy-lcd");
    expect(css).toContain('.neo-dpad-grid');
    expect(css).toContain('.neo-dpad-btn');
    expect(css).toContain('.neo-ab-btn');
    expect(css).toContain('.neo-reset-pill');

    expect(css.indexOf('.neo-gameboy-shell')).toBeLessThan(finePointerIndex);
    expect(css.indexOf('.neo-ab-btn')).toBeLessThan(finePointerIndex);
  });

  it('enforces coarse pointer sizing, reduced-motion disablement, and forced-colors compliance (Review Focus #5)', () => {
    const css = readFileSync(GLOBALS_CSS_PATH, 'utf8');

    const coarseIndex = css.indexOf('@media (pointer: coarse)');
    expect(coarseIndex).toBeGreaterThan(-1);
    const coarseBlock = extractBraceBlock(css, coarseIndex);
    expect(coarseBlock).toContain('.neo-dpad-btn');
    expect(coarseBlock).toContain('.neo-ab-btn');
    expect(coarseBlock).toContain('.neo-reset-pill');
    expect(coarseBlock).toContain('2.75rem');

    const reducedMotionBlocks = collectMediaBlocks(
      css,
      '@media (prefers-reduced-motion: reduce)'
    ).join('\n');
    expect(reducedMotionBlocks).toContain('.neo-dpad-btn');
    expect(reducedMotionBlocks).toContain('.neo-ab-btn');
    expect(reducedMotionBlocks).toContain('.neo-reset-pill');

    const forcedColorsIndex = css.indexOf('@media (forced-colors: active)');
    expect(forcedColorsIndex).toBeGreaterThan(-1);
    const forcedColorsBlock = extractBraceBlock(css, forcedColorsIndex);
    expect(forcedColorsBlock).toContain('.neo-gameboy-shell');
    expect(forcedColorsBlock).toContain('.neo-gameboy-lcd');
    expect(forcedColorsBlock).toContain('.neo-dpad-btn');
    expect(forcedColorsBlock).toContain('.neo-ab-btn');
    expect(forcedColorsBlock).toContain('.neo-reset-pill');
  });
});
