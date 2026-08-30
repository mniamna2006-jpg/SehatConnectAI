const PKT_TIMEZONE = "Asia/Karachi";

/**
 * Get the current calendar date in Pakistan Standard Time,
 * returned as a UTC-midnight Date so it aligns with PostgreSQL DATE columns.
 */
function getPakistanDate() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PKT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year").value);
  const month = Number(parts.find((p) => p.type === "month").value);
  const day = Number(parts.find((p) => p.type === "day").value);

  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Get the day-of-week enum string for the current Pakistan day.
 * Returns one of: SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY.
 */
function getPakistanDayOfWeek() {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  const now = new Date();

  const dayString = new Intl.DateTimeFormat("en-US", {
    timeZone: PKT_TIMEZONE,
    weekday: "long",
  }).format(now);

  return days[
    [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ].indexOf(dayString)
  ];
}

/**
 * Get the day-of-week enum string for a specific date in Pakistan time.
 * @param {Date|string} date — a Date object or YYYY-MM-DD string.
 */
function getPakistanDayOfWeekForDate(date) {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const enumNames = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  const d = typeof date === "string" ? new Date(`${date}T00:00:00.000Z`) : date;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PKT_TIMEZONE,
    weekday: "long",
  }).formatToParts(d);

  const dayString = parts.find((p) => p.type === "weekday").value;

  return enumNames[dayNames.indexOf(dayString)];
}

module.exports = {
  PKT_TIMEZONE,
  getPakistanDate,
  getPakistanDayOfWeek,
  getPakistanDayOfWeekForDate,
};
