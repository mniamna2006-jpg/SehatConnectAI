import type { AppointmentStatus } from '../../../../shared/types/api';

export interface StaffAppointment {
  appointment_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_time_12h?: string;
  status: AppointmentStatus;
  patient: { user_id: string; full_name: string; phone?: string | null } | null;
  doctor: { doctor_id: string; name: string; specialization: string } | null;
  department: { department_id: string; name: string } | null;
  slot_id?: string;
}

export interface StaffTodayAppointments {
  date: string;
  total: number;
  appointments: StaffAppointment[];
}
