import type { AppointmentStatus } from '../../../../shared/types/api';

export interface AdminAnalytics {
  appointments: {
    total: number;
    booked: number;
    confirmed: number;
    checked_in: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    no_show: number;
    today: number;
    this_week: number;
    this_month: number;
  };
  patients: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
  };
  queue: {
    total: number;
    waiting: number;
    called: number;
    in_progress: number;
    completed: number;
    skipped: number;
    average_wait_minutes: number | null;
  };
  operations: {
    hospitals: { total: number; active: number };
    doctors: { total: number; active: number };
    departments: { total: number; active: number };
    appointments_by_department: Array<{
      department_id: string;
      department_name: string;
      total: number;
    }>;
    appointments_by_doctor: Array<{
      doctor_id: string;
      doctor_name: string;
      specialization: string;
      total: number;
    }>;
    doctor_workload: Array<{
      doctor_id: string;
      doctor_name: string;
      specialization: string;
      total_appointments: number;
      by_status: Partial<Record<AppointmentStatus, number>>;
    }>;
    hospital_workload: {
      hospital_id: string;
      hospital_name: string;
      total_appointments: number;
      total_queues: number;
      active_doctors: number;
      active_departments: number;
    };
  };
}
