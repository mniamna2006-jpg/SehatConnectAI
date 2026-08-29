import type { DayOfWeek } from '../../../shared/types/api';

export interface DoctorSchedule {
  schedule_id: string;
  doctor_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  appointment_duration: number;
  is_active: boolean;
}

export interface Doctor {
  doctor_id: string;
  hospital_id: string;
  department_id: string;
  name: string;
  specialization?: string;
  qualification?: string;
  consultation_fee?: number;
  is_active: boolean;
}

export interface DoctorDetail extends Doctor {
  hospital: { hospital_id: string; name: string };
  department: { department_id: string; name: string };
  schedules: DoctorSchedule[];
}
