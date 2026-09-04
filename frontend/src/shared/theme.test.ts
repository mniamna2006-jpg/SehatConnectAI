import { colors, radius, shadow, typography } from './theme';

function contrastRatio(hex1: string, hex2: string): number {
  const toRgb = (hex: string) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const relativeLuminance = ([r, g, b]: number[]) => {
    const [rl, gl, bl] = [r, g, b].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
  };
  const l1 = relativeLuminance(toRgb(hex1));
  const l2 = relativeLuminance(toRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

test('exposes the quiet-clinical-luxury brand and semantic colors', () => {
  expect(colors.canvas).toBe('#F7F8FA');
  expect(colors.surface).toBe('#FFFFFF');
  expect(colors.ink).toBe('#0E1B2A');
  expect(colors.inkSoft).toBe('#11345A');
  expect(colors.primary).toBe('#2F6BFF');
  expect(colors.primarySoft).toBe('#EDF4FF');
  expect(colors.teal).toBe('#149F91');
  expect(colors.tealSoft).toBe('#EAF8F5');
  expect(colors.line).toBe('#E7EAF0');
  expect(colors.canvas).not.toBe(colors.surface);
});

test('exposes premium hierarchy tokens', () => {
  expect(radius).toEqual(expect.objectContaining({ sm: 10, md: 16, lg: 22, pill: 999 }));
  expect(typography.hero.fontSize).toBeGreaterThan(typography.screenTitle.fontSize);
  expect(typography.screenTitle.fontSize).toBeGreaterThan(typography.sectionTitle.fontSize);
  expect(typography.body.fontSize).toBeGreaterThan(typography.metadata.fontSize);
  expect(shadow.elevation).toBeGreaterThan(0);
});

describe('WCAG AA contrast — normal text (>= 4.5:1)', () => {
  const backgrounds = { surface: colors.surface, canvas: colors.canvas, surfaceMuted: colors.surfaceMuted };

  test('ink and inkSoft clear 4.5:1 on every surface', () => {
    for (const bg of Object.values(backgrounds)) {
      expect(contrastRatio(colors.ink, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.inkSoft, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('muted (secondary/metadata text) clears 4.5:1 on every surface', () => {
    for (const bg of Object.values(backgrounds)) {
      expect(contrastRatio(colors.muted, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('semantic text colors clear 4.5:1 against their own soft background and surface', () => {
    expect(contrastRatio(colors.danger, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.danger, colors.dangerSoft)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.success, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.success, colors.successSoft)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.warning, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.warning, colors.warningSoft)).toBeGreaterThanOrEqual(4.5);
  });

  test('tealText (the text-safe variant of brand teal) clears 4.5:1 on surface and tealSoft', () => {
    expect(contrastRatio(colors.tealText, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.tealText, colors.tealSoft)).toBeGreaterThanOrEqual(4.5);
  });

  test('primaryPressed (used as text on primarySoft) clears 4.5:1 there', () => {
    expect(contrastRatio(colors.primaryPressed, colors.primarySoft)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('WCAG AA contrast — non-text/UI components (>= 3:1)', () => {
  test('faint clears 3:1 on surface and canvas for placeholders and decorative icons', () => {
    expect(contrastRatio(colors.faint, colors.surface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(colors.faint, colors.canvas)).toBeGreaterThanOrEqual(3);
  });

  test('brand teal and primary clear 3:1 on surface for icon use', () => {
    expect(contrastRatio(colors.teal, colors.surface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(colors.primary, colors.surface)).toBeGreaterThanOrEqual(3);
  });
});
