import { z } from 'zod';

const DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function isRealDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const scheduleSchema = z.object({
  day_of_week: z.enum(DAYS),
  start_time: z.string().regex(TIME_PATTERN, 'admin.schedules.validation.time'),
  end_time: z.string().regex(TIME_PATTERN, 'admin.schedules.validation.time'),
  appointment_duration: z.string().regex(/^[1-9]\d*$/, 'admin.schedules.validation.duration'),
}).superRefine((values, context) => {
  if (!TIME_PATTERN.test(values.start_time) || !TIME_PATTERN.test(values.end_time)) return;

  const interval = timeToMinutes(values.end_time) - timeToMinutes(values.start_time);
  if (interval <= 0) {
    context.addIssue({ code: 'custom', path: ['end_time'], message: 'admin.schedules.validation.endAfterStart' });
    return;
  }

  if (Number(values.appointment_duration) > interval) {
    context.addIssue({ code: 'custom', path: ['appointment_duration'], message: 'admin.schedules.validation.durationFits' });
  }
});

export const timeSlotGenerationSchema = z.object({
  date: z.string().refine(isRealDate, 'admin.schedules.validation.date'),
});

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;
export type TimeSlotGenerationFormValues = z.infer<typeof timeSlotGenerationSchema>;
