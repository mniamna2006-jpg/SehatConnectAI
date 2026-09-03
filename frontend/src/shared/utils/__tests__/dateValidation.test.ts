import { isRealCalendarDate, isTodayOrFutureDate, isTodayOrPastDate } from '../dateValidation';

describe('isRealCalendarDate', () => {
  test('accepts real dates', () => {
    expect(isRealCalendarDate('2026-08-14')).toBe(true);
    expect(isRealCalendarDate('2024-02-29')).toBe(true); // leap year
  });

  test('rejects impossible dates instead of letting them roll over', () => {
    expect(isRealCalendarDate('2026-02-30')).toBe(false);
    expect(isRealCalendarDate('2026-13-01')).toBe(false);
    expect(isRealCalendarDate('2026-00-10')).toBe(false);
    expect(isRealCalendarDate('2026-04-31')).toBe(false);
    expect(isRealCalendarDate('2023-02-29')).toBe(false); // not a leap year
    expect(isRealCalendarDate('2026-99-99')).toBe(false);
  });

  test('rejects malformed strings', () => {
    expect(isRealCalendarDate('')).toBe(false);
    expect(isRealCalendarDate('2026/08/14')).toBe(false);
    expect(isRealCalendarDate('14-08-2026')).toBe(false);
    expect(isRealCalendarDate('not-a-date')).toBe(false);
    expect(isRealCalendarDate('2026-8-14')).toBe(false);
  });
});

describe('isTodayOrFutureDate', () => {
  test('accepts today and future dates', () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    expect(isTodayOrFutureDate(`${yyyy}-${mm}-${dd}`)).toBe(true);
    expect(isTodayOrFutureDate('2999-01-01')).toBe(true);
  });

  test('rejects past dates', () => {
    expect(isTodayOrFutureDate('2000-01-01')).toBe(false);
  });

  test('rejects impossible dates', () => {
    expect(isTodayOrFutureDate('2999-02-30')).toBe(false);
  });
});

describe('isTodayOrPastDate', () => {
  test('accepts today and past dates', () => {
    expect(isTodayOrPastDate('1995-08-14')).toBe(true);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    expect(isTodayOrPastDate(`${yyyy}-${mm}-${dd}`)).toBe(true);
  });

  test('rejects future dates — no impossible date of birth', () => {
    expect(isTodayOrPastDate('2999-01-01')).toBe(false);
  });

  test('rejects impossible dates', () => {
    expect(isTodayOrPastDate('1995-99-99')).toBe(false);
  });
});
