import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  INITIAL_KONAMI_STATE,
  KONAMI_SEQUENCE,
  stepKonamiInput,
} from '@/lib/konamiController';
import { HeroSection } from '../HeroSection';
import {
  KonamiGameBoyDeck,
  KonamiGameBoyWidget,
} from '../KonamiGameBoyWidget';

describe('KonamiGameBoyDeck & HeroSection integration', () => {
  it('renders Game Boy hint (↑ ↑ ↓ ↓ ← → ← → B A), D-Pad ↑ ↓ ← →, B/A buttons, and RESET button as native buttons', () => {
    const html = renderToStaticMarkup(
      createElement(KonamiGameBoyDeck, {
        state: INITIAL_KONAMI_STATE,
        activeFlashButton: null,
        isConsoleFocused: false,
        onPressButton: vi.fn(),
        onReset: vi.fn(),
      })
    );

    expect(html).toContain('(↑ ↑ ↓ ↓ ← → ← → B A)');
    expect(html).toContain('aria-label="Up (↑)"');
    expect(html).toContain('aria-label="Down (↓)"');
    expect(html).toContain('aria-label="Left (←)"');
    expect(html).toContain('aria-label="Right (→)"');
    expect(html).toContain('aria-label="Button B"');
    expect(html).toContain('aria-label="Button A"');
    expect(html).toContain('RESET');
    expect(html).toContain('KB: READY');
    expect(html).not.toContain('role="button"');
  });

  it('displays pressed buttons live on the LCD screen from both click and keyboard sources', () => {
    let matchingState = stepKonamiInput(INITIAL_KONAMI_STATE, 'UP', 'pointer');
    matchingState = stepKonamiInput(matchingState, 'UP', 'keyboard');

    const matchingHtml = renderToStaticMarkup(
      createElement(KonamiGameBoyDeck, {
        state: matchingState,
        activeFlashButton: 'UP',
        isConsoleFocused: true,
        onPressButton: vi.fn(),
        onReset: vi.fn(),
      })
    );

    expect(matchingHtml).toContain('UP');
    expect(matchingHtml).toContain('KEYBOARD');
    expect(matchingHtml).toContain('2/10');
    expect(matchingHtml).toContain('KB: LOCKED');
    expect(matchingHtml).toContain('data-active="true"');
    expect(matchingHtml).toContain('data-state="matched"');

    // A non-matching key resets prefix progress to 0/10 while still displaying the pressed key
    const mismatchState = stepKonamiInput(matchingState, 'RIGHT', 'pointer');
    const mismatchHtml = renderToStaticMarkup(
      createElement(KonamiGameBoyDeck, {
        state: mismatchState,
        activeFlashButton: 'RIGHT',
        isConsoleFocused: true,
        onPressButton: vi.fn(),
        onReset: vi.fn(),
      })
    );

    expect(mismatchHtml).toContain('RIGHT');
    expect(mismatchHtml).toContain('CLICK');
    expect(mismatchHtml).toContain('0/10');
  });

  it('displays the all-English troll message when Konami Code is completed and echoes post-unlock presses (Review Focus #4)', () => {
    let state = INITIAL_KONAMI_STATE;
    for (const key of KONAMI_SEQUENCE) {
      state = stepKonamiInput(state, key, 'keyboard');
    }
    state = stepKonamiInput(state, 'B', 'pointer');

    const html = renderToStaticMarkup(
      createElement(KonamiGameBoyDeck, {
        state,
        activeFlashButton: 'B',
        isConsoleFocused: true,
        onPressButton: vi.fn(),
        onReset: vi.fn(),
      })
    );

    expect(html).toContain('KONAMI_10 // GOTCHA!');
    expect(html).toContain("YOU GOT FOOLED! THERE&#x27;S NOTHING HERE LOL 😜");
    expect(html).toContain('Entered the whole code for... literally nothing!');
    expect(html).toContain('PRESSED [B]');
    expect(html).toContain('STILL NOTHING TO PLAY LOL');
    expect(html).not.toMatch(/[\u0E00-\u0E7F]/);
  });

  it('renders KonamiGameBoyWidget cleanly during SSR and mounts directly beneath the HeroSection telemetry strip', () => {
    const widgetHtml = renderToStaticMarkup(createElement(KonamiGameBoyWidget));
    expect(widgetHtml).toContain('GUSTO_BOY // KONAMI_01');

    const heroHtml = renderToStaticMarkup(createElement(HeroSection));
    const telemetryEndIndex = heroHtml.indexOf('</dl>');
    const konamiHeadingIndex = heroHtml.indexOf('konami-console-heading');
    expect(telemetryEndIndex).toBeGreaterThan(0);
    expect(konamiHeadingIndex).toBeGreaterThan(telemetryEndIndex);
  });
});
