import type { AppointmentStatus, FacilityType, QueueStatus } from '../../../../shared/types/api';

export interface AdminDashboardHospital {
  hospital_id: string;
  name: string;
  facility_type: FacilityType;
  city: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  theme: string | null;
  is_active: boolean;
}

export interface AdminDashboardAppointment {
  appointment_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_time_12h?: string;
  status: AppointmentStatus;
  booking_reference: string;
  token_number: number | null;
  reason: string | null;
  patient: { user: { user_id: string; full_name: string; email: string | null; phone: string | null } } | null;
  doctor: { doctor_id: string; name: string; specialization: string } | null;
  department: { department_id: string; name: string } | null;
  slot: { slot_id: string; start_time: string; end_time: string; start_time_12h?: string; end_time_12h?: string } | null;
}

export interface AdminDashboard {
  hospital: AdminDashboardHospital;
  departments: { total: number; active: number };
  doctors: { total: number; active: number };
  staff: { total: number; active: number };
  patients: { total: number };
  today_appointments: AdminDashboardAppointment[];
  appointment_counts: { total: number; by_status: Partial<Record<AppointmentStatus, number>> };
  today_queue: { total: number; by_status: Partial<Record<QueueStatus, number>> };
}
