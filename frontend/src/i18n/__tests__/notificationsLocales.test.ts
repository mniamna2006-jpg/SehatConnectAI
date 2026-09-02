import en from '../en.json';
import urRoman from '../ur-roman.json';
import ur from '../ur.json';

test('keeps notifications keys in parity across locales', () => {
  expect(Object.keys(ur.notifications).sort()).toEqual(Object.keys(en.notifications).sort());
  expect(Object.keys(urRoman.notifications).sort()).toEqual(Object.keys(en.notifications).sort());
});

test('provides distinct localized copy for each locale', () => {
  expect(ur.notifications.emptyMessage).not.toBe(en.notifications.emptyMessage);
  expect(urRoman.notifications.emptyMessage).not.toBe(en.notifications.emptyMessage);
  expect(ur.notifications.markAllRead).not.toBe(en.notifications.markAllRead);
});
