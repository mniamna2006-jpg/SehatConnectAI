import { apiRequest } from '../../../../core/api/client';
import type { AppointmentStatus } from '../../../../shared/types/api';
import type { StaffAppointment, StaffTodayAppointments } from './types';

export function getStaffTodayAppointments(): Promise<StaffTodayAppointments> {
  return apiRequest<StaffTodayAppointments>('/api/staff/appointments/today', { scope: 'hospital' });
}

export function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<StaffAppointment> {
  return apiRequest<StaffAppointment>(`/api/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    body: { status },
    scope: 'hospital',
  });
}
