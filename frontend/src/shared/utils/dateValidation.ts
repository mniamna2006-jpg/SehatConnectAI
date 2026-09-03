const STRICT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True only for a real calendar date in YYYY-MM-DD shape — rejects both malformed strings and JS Date's own rollover (e.g. 2026-02-30 silently becoming March 2). */
export function isRealCalendarDate(value: string): boolean {
  const match = STRICT_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** A real calendar date that is today or later — for appointment date selection. */
export function isTodayOrFutureDate(value: string): boolean {
  if (!isRealCalendarDate(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day) >= startOfToday();
}

/** A real calendar date that is today or earlier — for date of birth. */
export function isTodayOrPastDate(value: string): boolean {
  if (!isRealCalendarDate(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day) <= startOfToday();
}
