const FALLBACK = '—';

/** Formats a raw "HH:mm" 24-hour time as 12-hour display, e.g. "16:00" -> "4:00 PM". */
export function formatTime12h(hhmm: string | undefined | null): string {
  if (!hhmm) return FALLBACK;

  const [h, m] = hhmm.split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return FALLBACK;

  const minute = (m ?? '00').padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${minute} ${period}`;
}

/**
 * Resolves the Patient-facing display time: prefers a backend-provided
 * `*_12h` companion field, falls back to formatting the raw field, then a
 * safe placeholder when neither is available.
 */
export function displayTime12h(
  value12h: string | undefined | null,
  rawValue: string | undefined | null
): string {
  if (value12h) return value12h;
  if (rawValue) return formatTime12h(rawValue);
  return FALLBACK;
}

/** Formats a backend day-of-week enum ("MONDAY") as Patient-facing copy ("Monday"). */
export function titleCaseDay(dayOfWeek: string): string {
  return dayOfWeek.charAt(0) + dayOfWeek.slice(1).toLowerCase();
}

export interface ScheduleLike {
  day_of_week: string;
  start_time: string;
  end_time: string;
  start_time_12h?: string | null;
  end_time_12h?: string | null;
}

/** Builds a Patient-facing "Day h:mm AM/PM - h:mm AM/PM" summary per schedule, joined for display. */
export function summarizeSchedules(schedules: ScheduleLike[]): string | undefined {
  if (schedules.length === 0) return undefined;
  return schedules
    .map(
      (s) =>
        `${titleCaseDay(s.day_of_week)} ${displayTime12h(s.start_time_12h, s.start_time)} - ${displayTime12h(s.end_time_12h, s.end_time)}`
    )
    .join(', ');
}
