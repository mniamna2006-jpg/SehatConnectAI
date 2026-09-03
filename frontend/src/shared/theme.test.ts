import { colors, radius, shadow, typography } from './theme';

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
  expect(colors.muted).toBe('#6E7888');
  expect(colors.success).toBe('#198A68');
  expect(colors.danger).toBe('#D85B63');
  expect(colors.canvas).not.toBe(colors.surface);
});

test('exposes premium hierarchy tokens', () => {
  expect(radius).toEqual(expect.objectContaining({ sm: 10, md: 16, lg: 22, pill: 999 }));
  expect(typography.hero.fontSize).toBeGreaterThan(typography.screenTitle.fontSize);
  expect(typography.screenTitle.fontSize).toBeGreaterThan(typography.sectionTitle.fontSize);
  expect(typography.body.fontSize).toBeGreaterThan(typography.metadata.fontSize);
  expect(shadow.elevation).toBeGreaterThan(0);
});
