import { describe, expect, it } from 'vitest';
import {
  CURSOR_SIZE_PX,
  CURSOR_SPECS,
  buildCursorCssValue,
  buildCursorSvg,
  encodeSvgDataUri,
  serializeCursorThemeTokens,
  type CursorRole,
  type CursorThemeMode,
} from '../neoCursors';

const ALL_ROLES: CursorRole[] = ['default', 'pointer', 'crosshair', 'text', 'not-allowed'];
const ALL_THEMES: CursorThemeMode[] = ['neo', 'overclock'];

describe('Neo-Brutalist cursor SVG builder & theme serializer', () => {
  it('defines all 5 cursor roles with integer hotspots strictly inside 32x32 bounds', () => {
    expect(Object.keys(CURSOR_SPECS)).toEqual(ALL_ROLES);
    expect(CURSOR_SIZE_PX).toBe(32);

    expect(CURSOR_SPECS.default).toEqual({
      role: 'default',
      hotspotX: 4,
      hotspotY: 2,
      fallback: 'default',
    });
    expect(CURSOR_SPECS.pointer).toEqual({
      role: 'pointer',
      hotspotX: 10,
      hotspotY: 2,
      fallback: 'pointer',
    });
    expect(CURSOR_SPECS.crosshair).toEqual({
      role: 'crosshair',
      hotspotX: 16,
      hotspotY: 16,
      fallback: 'crosshair',
    });
    expect(CURSOR_SPECS.text).toEqual({
      role: 'text',
      hotspotX: 16,
      hotspotY: 16,
      fallback: 'text',
    });
    expect(CURSOR_SPECS['not-allowed']).toEqual({
      role: 'not-allowed',
      hotspotX: 16,
      hotspotY: 16,
      fallback: 'not-allowed',
    });

    for (const role of ALL_ROLES) {
      const spec = CURSOR_SPECS[role];
      expect(Number.isInteger(spec.hotspotX)).toBe(true);
      expect(Number.isInteger(spec.hotspotY)).toBe(true);
      expect(spec.hotspotX).toBeGreaterThanOrEqual(0);
      expect(spec.hotspotX).toBeLessThan(CURSOR_SIZE_PX);
      expect(spec.hotspotY).toBeGreaterThanOrEqual(0);
      expect(spec.hotspotY).toBeLessThan(CURSOR_SIZE_PX);
    }
  });

  it('builds crisp 32x32 SVGs without filters/gradients using Neo & Overclock palettes', () => {
    for (const role of ALL_ROLES) {
      const neoSvg = buildCursorSvg(role, 'neo');
      const overclockSvg = buildCursorSvg(role, 'overclock');

      for (const svg of [neoSvg, overclockSvg]) {
        expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(svg).toContain('width="32"');
        expect(svg).toContain('height="32"');
        expect(svg).toContain('viewBox="0 0 32 32"');
        expect(svg).not.toMatch(/<(filter|feDropShadow|linearGradient|radialGradient)\b/i);
      }

      expect(neoSvg).toMatch(/#(FFE600|0A0A0A|FFFFFF|FF5D8F)/i);
      expect(overclockSvg).toMatch(/#(00F5D4|050b14|FFE600|FF5D8F)/i);
      expect(overclockSvg).not.toBe(neoSvg);
    }
  });

  it('encodes SVG into safe CSS data URI with %23 hexes and zero raw delimiters', () => {
    for (const theme of ALL_THEMES) {
      for (const role of ALL_ROLES) {
        const uri = encodeSvgDataUri(buildCursorSvg(role, theme));
        expect(uri.startsWith('data:image/svg+xml,')).toBe(true);
        expect(uri).not.toContain('#');
        expect(uri).not.toContain('"');
        expect(uri).not.toContain('<');
        expect(uri).not.toContain('>');
        expect(uri).toContain('%23');
      }
    }
  });

  it('formats cursor CSS value with url(...), hotspot coordinates, and native fallback keyword', () => {
    const cssVal = buildCursorCssValue('default', 'neo');
    expect(cssVal).toMatch(/^url\("data:image\/svg\+xml,[^"]+"\) 4 2, default$/);

    const pointerVal = buildCursorCssValue('pointer', 'overclock');
    expect(pointerVal).toMatch(/^url\("data:image\/svg\+xml,[^"]+"\) 10 2, pointer$/);
  });

  it('serializes complete --neo-cursor-* CSS variable dictionaries for both themes', () => {
    const neoTokens = serializeCursorThemeTokens('neo');
    const overclockTokens = serializeCursorThemeTokens('overclock');

    const expectedKeys = [
      '--neo-cursor-default',
      '--neo-cursor-pointer',
      '--neo-cursor-crosshair',
      '--neo-cursor-text',
      '--neo-cursor-not-allowed',
    ];

    expect(Object.keys(neoTokens)).toEqual(expectedKeys);
    expect(Object.keys(overclockTokens)).toEqual(expectedKeys);

    expect(neoTokens['--neo-cursor-default']).toContain('%23FFE600');
    expect(overclockTokens['--neo-cursor-default']).toContain('%2300F5D4');
  });
});
