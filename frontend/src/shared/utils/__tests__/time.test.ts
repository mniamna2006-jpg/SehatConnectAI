import { formatTime12h, displayTime12h } from '../time';

describe('formatTime12h', () => {
  test('16:00 -> 4:00 PM', () => {
    expect(formatTime12h('16:00')).toBe('4:00 PM');
  });

  test('08:30 -> 8:30 AM', () => {
    expect(formatTime12h('08:30')).toBe('8:30 AM');
  });

  test('12:00 -> 12:00 PM', () => {
    expect(formatTime12h('12:00')).toBe('12:00 PM');
  });

  test('00:00 -> 12:00 AM', () => {
    expect(formatTime12h('00:00')).toBe('12:00 AM');
  });

  test('undefined/empty input returns a safe fallback', () => {
    expect(formatTime12h(undefined)).toBe('—');
    expect(formatTime12h('')).toBe('—');
  });
});

describe('displayTime12h', () => {
  test('prefers a backend-provided *_12h field over the raw field', () => {
    expect(displayTime12h('4:00 PM', '16:00')).toBe('4:00 PM');
  });

  test('falls back to formatting the raw field when the 12h field is missing', () => {
    expect(displayTime12h(undefined, '16:00')).toBe('4:00 PM');
  });

  test('falls back to a safe placeholder when neither field is available', () => {
    expect(displayTime12h(undefined, undefined)).toBe('—');
  });
});
