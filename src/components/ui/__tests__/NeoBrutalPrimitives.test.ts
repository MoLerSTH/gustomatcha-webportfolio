import { describe, it, expect } from 'vitest';
import { ACCENT_STYLES } from '../NeoBrutalPrimitives';

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(clean.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('NeoBrutalPrimitives design tokens & WCAG contrast', () => {
  it('maps all 4 vibrant playful accents plus white and dark to exact specification hex codes', () => {
    expect(ACCENT_STYLES.yellow.hex).toBe('#FFE600');
    expect(ACCENT_STYLES.mint.hex).toBe('#00F5D4');
    expect(ACCENT_STYLES.coral.hex).toBe('#FF5D8F');
    expect(ACCENT_STYLES.cobalt.hex).toBe('#3A86FF');
    expect(ACCENT_STYLES.white.hex).toBe('#FFFFFF');
    expect(ACCENT_STYLES.dark.hex).toBe('#0A0A0A');
  });

  it('guarantees WCAG AA >= 4.5:1 foreground-to-background text contrast for every accent variant', () => {
    for (const [key, token] of Object.entries(ACCENT_STYLES)) {
      const ratio = contrastRatio(token.hex, token.inkHex);
      expect(ratio, `Contrast failed for variant ${key}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
