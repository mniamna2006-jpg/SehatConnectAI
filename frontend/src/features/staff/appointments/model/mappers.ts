import type { RawStaffAppointment, RawStaffTodayAppointments, StaffAppointment, StaffTodayAppointments } from './types';

export function mapStaffAppointment(raw: RawStaffAppointment): StaffAppointment {
  return {
    ...raw,
    patient: raw.patient
      ? { user_id: raw.patient.user.user_id, full_name: raw.patient.user.full_name, phone: raw.patient.user.phone }
      : null,
  };
}

export function mapStaffTodayAppointments(raw: RawStaffTodayAppointments): StaffTodayAppointments {
  return { ...raw, appointments: raw.appointments.map(mapStaffAppointment) };
}
