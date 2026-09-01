import type { DayOfWeek, TimeSlotStatus } from '../../../../shared/types/api';

export interface AdminDoctorSchedule {
  schedule_id: string;
  doctor_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  start_time_12h?: string;
  end_time_12h?: string;
  appointment_duration: number;
  is_active: boolean;
}

export interface DoctorScheduleCreateInput {
  doctor_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  appointment_duration: number;
}

export interface GeneratedTimeSlot {
  slot_id: string;
  doctor_id: string;
  hospital_id: string;
  date: string;
  start_time: string;
  end_time: string;
  start_time_12h?: string;
  end_time_12h?: string;
  status: TimeSlotStatus;
}

export interface TimeSlotGenerationInput {
  doctor_id: string;
  hospital_id: string;
  date: string;
}
