import { describe, expect, it } from 'vitest';
import {
  PORTRAIT_BACKDROP_SWATCHES,
  resolvePortraitBackdropSpec,
} from '../OperatorPortraitCard';

describe('OperatorPortraitCard backdrop swatch controller', () => {
  it('exposes all 4 Friendly Neo-Brutalist brand backdrop swatches in order', () => {
    expect(PORTRAIT_BACKDROP_SWATCHES.map((s) => s.accent)).toEqual([
      'yellow',
      'mint',
      'coral',
      'cobalt',
    ]);
    expect(PORTRAIT_BACKDROP_SWATCHES.map((s) => s.hex)).toEqual([
      '#FFE600',
      '#00F5D4',
      '#FF5D8F',
      '#3A86FF',
    ]);
  });

  it('resolves requested brand swatch and falls back safely to yellow (#FFE600)', () => {
    expect(resolvePortraitBackdropSpec('mint').hex).toBe('#00F5D4');
    expect(resolvePortraitBackdropSpec('coral').shortCode).toBe('CORAL');
    expect(resolvePortraitBackdropSpec('unknown').accent).toBe('yellow');
    expect(resolvePortraitBackdropSpec(null).hex).toBe('#FFE600');
  });
});
