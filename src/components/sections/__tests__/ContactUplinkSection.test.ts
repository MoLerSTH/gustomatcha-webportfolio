import { describe, expect, it, vi } from 'vitest';
import { copyTextSafely } from '../ContactUplinkSection';

describe('ContactUplinkSection clipboard helper', () => {
  it('returns true when clipboard.writeText succeeds and false when missing or rejected', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(
      copyTextSafely('hattakorn49@gmail.com', { writeText })
    ).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hattakorn49@gmail.com');

    await expect(copyTextSafely('', { writeText })).resolves.toBe(false);
    await expect(copyTextSafely('hattakorn49@gmail.com', null)).resolves.toBe(
      false
    );

    const failingClipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
    };
    await expect(
      copyTextSafely('hattakorn49@gmail.com', failingClipboard)
    ).resolves.toBe(false);
  });
});
