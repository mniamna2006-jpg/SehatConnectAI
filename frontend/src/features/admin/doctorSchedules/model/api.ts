import { apiRequest } from '../../../../core/api/client';
import type {
  AdminDoctorSchedule,
  DoctorScheduleCreateInput,
  GeneratedTimeSlot,
  TimeSlotGenerationInput,
} from './types';

export function getDoctorSchedules(doctorId: string): Promise<AdminDoctorSchedule[]> {
  return apiRequest<AdminDoctorSchedule[]>(`/api/schedules/doctor/${doctorId}`, { scope: 'hospital' });
}

export function createDoctorSchedule(input: DoctorScheduleCreateInput): Promise<AdminDoctorSchedule> {
  return apiRequest<AdminDoctorSchedule>('/api/schedules', {
    method: 'POST',
    body: input,
    scope: 'hospital',
  });
}

export function generateTimeSlots(input: TimeSlotGenerationInput): Promise<GeneratedTimeSlot[]> {
  return apiRequest<GeneratedTimeSlot[]>('/api/time-slots/generate', {
    method: 'POST',
    body: input,
    scope: 'hospital',
  });
}
