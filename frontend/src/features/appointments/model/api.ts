import { apiRequest } from '../../../core/api/client';
import { isDemoMode } from '../../../core/demo/demoMode';
import {
  demoCancelAppointment,
  demoCreateAppointment,
  demoGetAppointmentById,
  demoGetMyAppointments,
  demoGetMyQueue,
  demoGetTimeSlots,
} from './demoAdapter';
import type { Appointment, QueueEntry, TimeSlot } from './types';
import type { BookingInput } from './schemas';

export function getMyAppointments(): Promise<Appointment[]> {
  if (isDemoMode()) return demoGetMyAppointments();
  return apiRequest<Appointment[]>('/api/appointments/my');
}

export function createAppointment(input: BookingInput): Promise<Appointment> {
  if (isDemoMode()) return demoCreateAppointment(input);
  return apiRequest<Appointment>('/api/appointments', { method: 'POST', body: input });
}

export function getAppointmentById(id: string): Promise<Appointment> {
  if (isDemoMode()) return demoGetAppointmentById(id);
  return apiRequest<Appointment>(`/api/appointments/${id}`);
}

export function cancelAppointment(id: string): Promise<Appointment> {
  if (isDemoMode()) return demoCancelAppointment(id);
  return apiRequest<Appointment>(`/api/appointments/${id}/cancel`, { method: 'PATCH' });
}

export function getTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
  if (isDemoMode()) return demoGetTimeSlots(doctorId, date);
  return apiRequest<TimeSlot[]>(`/api/time-slots/doctor/${doctorId}/date/${date}`);
}

export function getMyQueue(): Promise<QueueEntry[]> {
  if (isDemoMode()) return demoGetMyQueue();
  return apiRequest<QueueEntry[]>('/api/queue/my');
}
