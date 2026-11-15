import { describe, expect, it, vi } from 'vitest';
import { hideDeckWithTransition } from '../OverclockSynthDeck';

describe('OverclockSynthDeck transition helper', () => {
  it('applies [data-closing], awaits active animations, sets hidden=true, and invokes onHidden', async () => {
    const attrs = new Map<string, string>();
    const onHidden = vi.fn();
    const mockEl = {
      hidden: false,
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      hasAttribute: (k: string) => attrs.has(k),
      removeAttribute: (k: string) => attrs.delete(k),
      getAnimations: () => [
        {
          finished: new Promise<void>((resolve) => setTimeout(resolve, 10)),
        },
      ],
    } as unknown as HTMLElement;

    await hideDeckWithTransition(mockEl, onHidden, 100);
    expect(mockEl.hidden).toBe(true);
    expect(attrs.has('data-closing')).toBe(false);
    expect(onHidden).toHaveBeenCalledTimes(1);
  });
});
