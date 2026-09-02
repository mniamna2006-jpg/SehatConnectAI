import { formatDateLabel, formatDateTimeLabel } from '../formatters';

describe('formatDateLabel', () => {
  test('formats a backend ISO timestamp as its appointment calendar date', () => {
    expect(formatDateLabel('2026-08-31T00:00:00.000Z')).toBe('Aug 31, 2026');
  });

  test('formats a date-only value without a timezone shift', () => {
    expect(formatDateLabel('2026-08-31')).toBe('Aug 31, 2026');
  });
});

describe('formatDateTimeLabel', () => {
  test('formats a backend ISO timestamp as a readable date and time', () => {
    expect(formatDateTimeLabel('2026-08-31T14:05:00.000Z')).toMatch(/Aug 31, 2026.*\d{1,2}:\d{2}\s?(AM|PM)/);
  });

  test('falls back to the raw value when it cannot be parsed', () => {
    expect(formatDateTimeLabel('not-a-date')).toBe('not-a-date');
  });
});
