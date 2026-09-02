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

/** Raw response shape of GET /api/staff/appointments/today — patient identity nests under patient.user. */
export interface RawStaffAppointment {
  appointment_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_time_12h?: string;
  status: AppointmentStatus;
  patient: { patient_id?: string; user: { user_id: string; full_name: string; email?: string | null; phone?: string | null } } | null;
  doctor: { doctor_id: string; name: string; specialization: string } | null;
  department: { department_id: string; name: string } | null;
  slot_id?: string;
}

export interface RawStaffTodayAppointments {
  date: string;
  total: number;
  appointments: RawStaffAppointment[];
}

/** Raw response shape of PATCH /api/appointments/:appointment_id/status — scalar Appointment fields, not the joined StaffAppointment shape. */
export interface StaffAppointmentStatusUpdate {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  department_id: string;
  slot_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_time_12h: string;
  status: AppointmentStatus;
  booking_reference: string;
  token_number: number | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
}
