import { isDemoMode } from '../demoMode';

const ORIGINAL = process.env.EXPO_PUBLIC_DEMO_MODE;

afterEach(() => {
  process.env.EXPO_PUBLIC_DEMO_MODE = ORIGINAL;
});

test('is false when EXPO_PUBLIC_DEMO_MODE is unset', () => {
  delete process.env.EXPO_PUBLIC_DEMO_MODE;
  expect(isDemoMode()).toBe(false);
});

test('is false when EXPO_PUBLIC_DEMO_MODE is any value other than "true"', () => {
  process.env.EXPO_PUBLIC_DEMO_MODE = 'false';
  expect(isDemoMode()).toBe(false);
  process.env.EXPO_PUBLIC_DEMO_MODE = '1';
  expect(isDemoMode()).toBe(false);
});

test('is true only when EXPO_PUBLIC_DEMO_MODE is exactly "true"', () => {
  process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
  expect(isDemoMode()).toBe(true);
});
