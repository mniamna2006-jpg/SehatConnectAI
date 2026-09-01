import { formatDateLabel } from '../formatters';

describe('formatDateLabel', () => {
  test('formats a backend ISO timestamp as its appointment calendar date', () => {
    expect(formatDateLabel('2026-08-31T00:00:00.000Z')).toBe('Aug 31, 2026');
  });

  test('formats a date-only value without a timezone shift', () => {
    expect(formatDateLabel('2026-08-31')).toBe('Aug 31, 2026');
  });
});
