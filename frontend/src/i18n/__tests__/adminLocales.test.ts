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

test('keeps Admin keys in parity across English, Urdu, and Roman Urdu', () => {
  const englishKeys = collectKeys(en.admin).sort();

  expect(collectKeys(ur.admin).sort()).toEqual(englishKeys);
  expect(collectKeys(urRoman.admin).sort()).toEqual(englishKeys);
  expect(englishKeys).toEqual(expect.arrayContaining([
    'dashboard.subtitle',
    'profile.title',
    'analytics.title',
    'departments.title',
    'doctors.title',
    'schedules.generation.title',
  ]));
});

test('provides native Urdu and Roman Urdu Admin labels instead of English fallback', () => {
  expect(ur.admin.profile.title).toBe('ہسپتال پروفائل');
  expect(urRoman.admin.profile.title).toBe('Hospital Profile');
  expect(ur.admin.analytics.title).not.toBe(en.admin.analytics.title);
  expect(ur.admin.departments.title).not.toBe(en.admin.departments.title);
  expect(urRoman.admin.schedules.generation.title).not.toBe(en.admin.schedules.generation.title);
});
