export function formatTime12Hour(value?: string): string {
  if (!value) return '';
  const [hourText, minuteText = '00'] = value.split(':');
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteText.slice(0, 2)} ${suffix}`;
}

export function formatDateLabel(value: string): string {
  const calendarDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const date = new Date(calendarDate ? `${calendarDate}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatHumanDate(value?: string): string {
  if (!value) return '';
  const calendarDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const date = new Date(calendarDate ? `${calendarDate}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export function getInitials(value?: string): string {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return 'SC';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}
