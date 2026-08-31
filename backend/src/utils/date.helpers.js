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

/**
 * Convert a 24-hour HH:mm string to 12-hour display format.
 * Examples: "09:00" → "9:00 AM", "13:00" → "1:00 PM", "00:30" → "12:30 AM"
 * @param {string} hhmm — time in "HH:mm" format
 * @returns {string} time in 12-hour format, e.g. "9:00 AM"
 */
function formatTime12h(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return hhmm;

  const [h, m] = hhmm.split(":");
  const hour = Number(h);
  const minute = String(m).padStart(2, "0");
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${minute} ${period}`;
}

/**
 * Add 12-hour companion fields to an object or array of objects.
 * For each key in fieldPairs, adds a `${key}_12h` companion.
 * @param {object|object[]} data — single object or array
 * @param {object} fieldPairs — e.g. { start_time: "start_time", end_time: "end_time" }
 * @returns {object|object[]}
 */
function addTime12hFields(data, fieldPairs) {
  if (!data) return data;

  const addFields = (obj) => {
    const result = { ...obj };

    for (const field of Object.keys(fieldPairs)) {
      if (result[field] != null) {
        result[`${field}_12h`] = formatTime12h(result[field]);
      }
    }

    return result;
  };

  return Array.isArray(data) ? data.map(addFields) : addFields(data);
}

module.exports = {
  PKT_TIMEZONE,
  getPakistanDate,
  getPakistanDayOfWeek,
  getPakistanDayOfWeekForDate,
  formatTime12h,
  addTime12hFields,
};
