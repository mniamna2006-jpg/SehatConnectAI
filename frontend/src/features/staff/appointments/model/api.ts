import { apiRequest } from '../../../../core/api/client';
import type { AppointmentStatus } from '../../../../shared/types/api';
import { mapStaffTodayAppointments } from './mappers';
import type { RawStaffTodayAppointments, StaffAppointmentStatusUpdate, StaffTodayAppointments } from './types';

export function getStaffTodayAppointments(): Promise<StaffTodayAppointments> {
  return apiRequest<RawStaffTodayAppointments>('/api/staff/appointments/today', { scope: 'hospital' }).then(
    mapStaffTodayAppointments
  );
}

export function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<StaffAppointmentStatusUpdate> {
  return apiRequest<StaffAppointmentStatusUpdate>(`/api/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    body: { status },
    scope: 'hospital',
  });
}
