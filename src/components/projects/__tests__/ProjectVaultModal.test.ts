import { describe, expect, it, vi } from 'vitest';
import { PROJECTS_DATA } from '@/data/portfolioData';
import {
  closeDialogWithTransition,
  resolveAdjacentProject,
  supportsTopLayerExit,
} from '../ProjectVaultModal';

describe('ProjectVaultModal pure helpers', () => {
  it('returns false for supportsTopLayerExit in SSR / Node test environment', () => {
    expect(supportsTopLayerExit()).toBe(false);
  });

  it('cycles previous and next projects circularly across the 6-project vault', () => {
    const first = PROJECTS_DATA[0];
    const second = PROJECTS_DATA[1];
    const last = PROJECTS_DATA[PROJECTS_DATA.length - 1];

    expect(resolveAdjacentProject(PROJECTS_DATA, first.id, 'next')?.id).toBe(
      second.id
    );
    expect(resolveAdjacentProject(PROJECTS_DATA, first.id, 'prev')?.id).toBe(
      last.id
    );
    expect(resolveAdjacentProject(PROJECTS_DATA, last.id, 'next')?.id).toBe(
      first.id
    );
    expect(resolveAdjacentProject([], 'unknown', 'next')).toBeNull();
  });

  it('applies [data-closing], waits for subtree animations, and calls dialog.close() + onClosed', async () => {
    const attrs = new Map<string, string>();
    let closed = false;
    const onClosed = vi.fn();

    const mockDialog = {
      open: true,
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      hasAttribute: (k: string) => attrs.has(k),
      removeAttribute: (k: string) => attrs.delete(k),
      getAnimations: () => [
        {
          finished: new Promise<void>((resolve) => setTimeout(resolve, 10)),
        },
      ],
      close: () => {
        closed = true;
      },
    } as unknown as HTMLDialogElement;

    await closeDialogWithTransition(mockDialog, onClosed, 100);
    expect(closed).toBe(true);
    expect(attrs.has('data-closing')).toBe(false);
    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});
