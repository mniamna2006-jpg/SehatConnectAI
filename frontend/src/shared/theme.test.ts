import { colors, radius, shadow, typography } from './theme';

test('exposes brand and semantic colors', () => {
  expect(colors.primary).toBe('#2563EB');
  expect(colors.secondary).toBe('#14B8A6');
  expect(colors.canvas).not.toBe(colors.surface);
  expect(colors.danger).toBeDefined();
  expect(colors.success).toBeDefined();
});

test('exposes premium hierarchy tokens', () => {
  expect(radius).toEqual(expect.objectContaining({ sm: 10, md: 16, lg: 22, pill: 999 }));
  expect(typography.hero.fontSize).toBeGreaterThan(typography.screenTitle.fontSize);
  expect(typography.screenTitle.fontSize).toBeGreaterThan(typography.sectionTitle.fontSize);
  expect(typography.body.fontSize).toBeGreaterThan(typography.metadata.fontSize);
  expect(shadow.elevation).toBeGreaterThan(0);
});
