/**
 * Pure Friendly Neo-Brutalist & Overclock Blueprint SVG cursor generators.
 * Produces compact 32x32 data:image/svg+xml tokens with verified hotspots and
 * zero network overhead for instant CSS custom property switching.
 */

export type CursorRole = 'default' | 'pointer' | 'crosshair' | 'text' | 'not-allowed';

export type CursorThemeMode = 'neo' | 'overclock';

export interface CursorSpec {
  role: CursorRole;
  hotspotX: number;
  hotspotY: number;
  fallback: CursorRole;
}

interface CursorThemePalette {
  ink: string;
  accent: string;
  surface: string;
  danger: string;
  shadow: string;
  crosshairCenter: string;
}

export const CURSOR_SIZE_PX = 32;

const CURSOR_CSS_VAR_NAMES: Record<CursorRole, string> = {
  default: '--neo-cursor-default',
  pointer: '--neo-cursor-pointer',
  crosshair: '--neo-cursor-crosshair',
  text: '--neo-cursor-text',
  'not-allowed': '--neo-cursor-not-allowed',
};

export const CURSOR_SPECS: Record<CursorRole, CursorSpec> = {
  default: { role: 'default', hotspotX: 4, hotspotY: 2, fallback: 'default' },
  pointer: { role: 'pointer', hotspotX: 10, hotspotY: 2, fallback: 'pointer' },
  crosshair: { role: 'crosshair', hotspotX: 16, hotspotY: 16, fallback: 'crosshair' },
  text: { role: 'text', hotspotX: 16, hotspotY: 16, fallback: 'text' },
  'not-allowed': { role: 'not-allowed', hotspotX: 16, hotspotY: 16, fallback: 'not-allowed' },
};

const CURSOR_PALETTES: Record<CursorThemeMode, CursorThemePalette> = {
  neo: {
    ink: '#0A0A0A',
    accent: '#FFE600',
    surface: '#FFFFFF',
    danger: '#FF5D8F',
    shadow: '#0A0A0A',
    crosshairCenter: '#FF5D8F',
  },
  overclock: {
    ink: '#050b14',
    accent: '#00F5D4',
    surface: '#00F5D4',
    danger: '#FF5D8F',
    shadow: '#FFE600',
    crosshairCenter: '#FFE600',
  },
};

function renderDefaultArrowBody(p: CursorThemePalette): string {
  const arrowPath = 'M4 2 L4 24 L10 18 L14 27 L18 25.5 L14 16.5 L22 16.5 Z';
  return [
    `<path d="${arrowPath}" transform="translate(2 2)" fill="${p.shadow}" stroke="${p.shadow}" stroke-width="2" stroke-linejoin="miter"/>`,
    `<path d="${arrowPath}" fill="${p.accent}" stroke="${p.ink}" stroke-width="2" stroke-linejoin="miter"/>`,
  ].join('');
}

function renderPointerHandBody(p: CursorThemePalette): string {
  const handPath =
    'M8 3 L10 2 L12 3 L12 11 L15.5 11 L16 12.5 L19.5 12 L20 13.5 L23.5 13.5 L24 16 L22 23 L9.5 23 L4.5 16.5 L4.5 14 L6.5 13.5 L8 15 Z';
  const cuffFill = p.shadow === '#0A0A0A' ? p.accent : p.shadow;
  return [
    `<path d="${handPath}" transform="translate(2 2)" fill="${p.shadow}" stroke="${p.shadow}" stroke-width="2" stroke-linejoin="round"/>`,
    `<rect x="10.5" y="25" width="12" height="4.5" fill="${p.shadow}" stroke="${p.shadow}" stroke-width="2"/>`,
    `<path d="${handPath}" fill="${p.surface}" stroke="${p.ink}" stroke-width="2" stroke-linejoin="round"/>`,
    `<rect x="8.5" y="23" width="12" height="4.5" fill="${cuffFill}" stroke="${p.ink}" stroke-width="2"/>`,
  ].join('');
}

function renderCrosshairBody(p: CursorThemePalette): string {
  const brackets =
    'M6 10 V6 H10 M22 6 H26 V10 M26 22 V26 H22 M10 26 H6 V22';
  const ticks = 'M16 3 V11 M16 21 V29 M3 16 H11 M21 16 H29';
  return [
    `<path d="${brackets} ${ticks}" fill="none" stroke="${p.ink}" stroke-width="4" stroke-linecap="square"/>`,
    `<path d="${brackets} ${ticks}" fill="none" stroke="${p.accent}" stroke-width="2" stroke-linecap="square"/>`,
    `<rect x="14.5" y="14.5" width="3" height="3" fill="${p.crosshairCenter}" stroke="${p.ink}" stroke-width="1"/>`,
  ].join('');
}

function renderTextBeamBody(p: CursorThemePalette): string {
  const beamPath = 'M11 5 H21 M11 27 H21 M16 5 V27 M13.5 16 H18.5';
  return [
    `<path d="${beamPath}" fill="none" stroke="${p.ink}" stroke-width="4.5" stroke-linecap="square"/>`,
    `<path d="${beamPath}" fill="none" stroke="${p.accent}" stroke-width="2" stroke-linecap="square"/>`,
  ].join('');
}

function renderNotAllowedBody(p: CursorThemePalette): string {
  return [
    `<circle cx="18" cy="18" r="10" fill="${p.shadow}" stroke="${p.shadow}" stroke-width="2"/>`,
    `<circle cx="16" cy="16" r="10" fill="${p.danger}" stroke="${p.ink}" stroke-width="2.5"/>`,
    `<line x1="10" y1="10" x2="22" y2="22" stroke="${p.ink}" stroke-width="3" stroke-linecap="square"/>`,
  ].join('');
}

const ROLE_RENDERERS: Record<CursorRole, (palette: CursorThemePalette) => string> = {
  default: renderDefaultArrowBody,
  pointer: renderPointerHandBody,
  crosshair: renderCrosshairBody,
  text: renderTextBeamBody,
  'not-allowed': renderNotAllowedBody,
};

/**
 * Builds an unencoded 32x32 vector SVG string for a cursor role and theme mode.
 */
export function buildCursorSvg(role: CursorRole, theme: CursorThemeMode): string {
  const palette = CURSOR_PALETTES[theme];
  const body = ROLE_RENDERERS[role](palette);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE_PX}" height="${CURSOR_SIZE_PX}" viewBox="0 0 ${CURSOR_SIZE_PX} ${CURSOR_SIZE_PX}">${body}</svg>`;
}

/**
 * Encodes an SVG string into a CSS-safe data:image/svg+xml URI with zero raw delimiters.
 */
export function encodeSvgDataUri(svg: string): string {
  const normalized = svg.trim().replace(/\s+/g, ' ').replace(/"/g, "'");
  const escaped = normalized
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/&/g, '%26');
  return `data:image/svg+xml,${escaped}`;
}

/**
 * Formats a complete CSS `cursor` property value including hotspot coordinates and keyword fallback.
 */
export function buildCursorCssValue(role: CursorRole, theme: CursorThemeMode): string {
  const spec = CURSOR_SPECS[role];
  const uri = encodeSvgDataUri(buildCursorSvg(role, theme));
  return `url("${uri}") ${spec.hotspotX} ${spec.hotspotY}, ${spec.fallback}`;
}

/**
 * Returns a dictionary of CSS custom property declarations (`--neo-cursor-*`) for a theme.
 */
export function serializeCursorThemeTokens(theme: CursorThemeMode): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const role of Object.keys(CURSOR_SPECS) as CursorRole[]) {
    tokens[CURSOR_CSS_VAR_NAMES[role]] = buildCursorCssValue(role, theme);
  }
  return tokens;
}
