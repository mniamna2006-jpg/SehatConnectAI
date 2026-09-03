import en from '../en.json';
import urRoman from '../ur-roman.json';
import ur from '../ur.json';

test('keeps doctor availability labels in parity across locales', () => {
  expect(Object.keys(ur.doctors.availability).sort()).toEqual(
    Object.keys(en.doctors.availability).sort()
  );
  expect(Object.keys(urRoman.doctors.availability).sort()).toEqual(
    Object.keys(en.doctors.availability).sort()
  );
});

test('provides English, native Urdu, and Roman Urdu availability copy', () => {
  expect(en.doctors.availability.available).toBe('Available');
  expect(en.doctors.availability.notifyWhenAvailable).toBe('Notify me when available');
  expect(ur.doctors.availability.available).toBe('دستیاب');
  expect(ur.doctors.availability.notifyWhenAvailable).toBe('دستیاب ہونے پر مجھے اطلاع دیں');
  expect(urRoman.doctors.availability.available).toBe('Dastyab');
  expect(urRoman.doctors.availability.notifyWhenAvailable).toBe('Dastyab honay par mujhay ittila dein');
});
