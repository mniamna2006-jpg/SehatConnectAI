import en from '../en.json';
import urRoman from '../ur-roman.json';
import ur from '../ur.json';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === 'object' && !Array.isArray(child)
      ? collectKeys(child, path)
      : [path];
  });
}

test('keeps Patient auth keys in parity across locales', () => {
  expect(collectKeys(ur.auth).sort()).toEqual(collectKeys(en.auth).sort());
  expect(collectKeys(urRoman.auth).sort()).toEqual(collectKeys(en.auth).sort());
});

test('provides localized login navigation, visibility, and safe error copy', () => {
  expect(ur.auth.password.show).toBe('پاس ورڈ دکھائیں');
  expect(urRoman.auth.password.hide).toBe('Password chhupayein');
  expect(ur.auth.errors.network).not.toBe(en.auth.errors.network);
  expect(urRoman.auth.errors.server).not.toBe(en.auth.errors.server);
});
