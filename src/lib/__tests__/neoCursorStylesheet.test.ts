import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { serializeCursorThemeTokens } from '../neoCursors';

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

function findTopLevelRuleBlock(css: string, selectorPrefix: string): string {
  const regex = new RegExp(`^\\s*${selectorPrefix}\\s*\\{`, 'm');
  const match = regex.exec(css);
  if (!match || match.index === undefined) return '';
  return extractBraceBlock(css, match.index);
}

describe('globals.css Neo-Brutalist custom cursor tokens & media guards', () => {
  const css = readFileSync(GLOBALS_CSS_PATH, 'utf8');

  it('matches :root --neo-cursor-* declarations 1:1 with serializeCursorThemeTokens("neo")', () => {
    const rootBlock = findTopLevelRuleBlock(css, ':root');
    expect(rootBlock).not.toBe('');

    const expectedNeo = serializeCursorThemeTokens('neo');
    for (const [tokenName, tokenValue] of Object.entries(expectedNeo)) {
      expect(rootBlock).toContain(`${tokenName}: ${tokenValue};`);
    }
  });

  it('matches :root[data-theme="overclock"] --neo-cursor-* declarations 1:1 with serializeCursorThemeTokens("overclock")', () => {
    const overclockBlock = findTopLevelRuleBlock(
      css,
      ":root\\[data-theme='overclock'\\]"
    );
    expect(overclockBlock).not.toBe('');

    const expectedOverclock = serializeCursorThemeTokens('overclock');
    for (const [tokenName, tokenValue] of Object.entries(expectedOverclock)) {
      expect(overclockBlock).toContain(`${tokenName}: ${tokenValue};`);
    }
  });

  it('binds all 5 cursor tokens unlayered inside @media (hover: hover) and (pointer: fine) with proper precedence', () => {
    const componentsLayerIndex = css.indexOf('@layer components');
    const fineMediaRegex = /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{/;
    const fineMatch = fineMediaRegex.exec(css);

    expect(fineMatch).not.toBeNull();
    expect(fineMatch!.index).toBeGreaterThan(componentsLayerIndex);

    const fineBlock = extractBraceBlock(css, fineMatch!.index);
    const componentsEnd =
      componentsLayerIndex + extractBraceBlock(css, componentsLayerIndex).length;
    expect(fineMatch!.index).toBeGreaterThan(componentsEnd);

    expect(fineBlock).toContain('var(--neo-cursor-default)');
    expect(fineBlock).toContain("[data-cursor='crosshair']");
    expect(fineBlock).toContain('var(--neo-cursor-crosshair)');
    expect(fineBlock).toContain('var(--neo-cursor-text)');
    expect(fineBlock).toContain('.cursor-pointer');
    expect(fineBlock).toContain("[data-cursor='pointer']");
    expect(fineBlock).toContain('var(--neo-cursor-pointer)');
    expect(fineBlock).toContain('cursor: inherit;');
    expect(fineBlock).toContain('var(--neo-cursor-not-allowed)');

    const pointerPos = fineBlock.indexOf('var(--neo-cursor-pointer)');
    const disabledPos = fineBlock.indexOf('var(--neo-cursor-not-allowed)');
    expect(disabledPos).toBeGreaterThan(pointerPos);
  });

  it('resets all --neo-cursor-* tokens to OS keywords inside @media (forced-colors: active) for both themes', () => {
    const forcedMatch = /@media\s*\(forced-colors:\s*active\)\s*\{/.exec(css);
    expect(forcedMatch).not.toBeNull();

    const forcedBlock = extractBraceBlock(css, forcedMatch!.index);
    expect(forcedBlock).toContain(':root');
    expect(forcedBlock).toContain(":root[data-theme='overclock']");
    expect(forcedBlock).toContain('--neo-cursor-default: default;');
    expect(forcedBlock).toContain('--neo-cursor-pointer: pointer;');
    expect(forcedBlock).toContain('--neo-cursor-crosshair: crosshair;');
    expect(forcedBlock).toContain('--neo-cursor-text: text;');
    expect(forcedBlock).toContain('--neo-cursor-not-allowed: not-allowed;');
  });
});
