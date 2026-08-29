export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type PreferredLanguage = 'ENGLISH' | 'URDU' | 'ROMAN_URDU';
export type FacilityType = 'HOSPITAL' | 'CLINIC' | 'MEDICAL_CENTER';
export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type TimeSlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'COMPLETED';
export type AppointmentStatus =
  | 'BOOKED' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
