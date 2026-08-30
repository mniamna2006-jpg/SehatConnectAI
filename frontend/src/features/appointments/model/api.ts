import { apiRequest } from '../../../core/api/client';
import type { Appointment, QueueEntry, TimeSlot } from './types';
import type { BookingInput } from './schemas';

export function getMyAppointments(): Promise<Appointment[]> {
  return apiRequest<Appointment[]>('/api/appointments/my');
}

export function createAppointment(input: BookingInput): Promise<Appointment> {
  return apiRequest<Appointment>('/api/appointments', { method: 'POST', body: input });
}

export function getAppointmentById(id: string): Promise<Appointment> {
  return apiRequest<Appointment>(`/api/appointments/${id}`);
}

export function cancelAppointment(id: string): Promise<Appointment> {
  return apiRequest<Appointment>(`/api/appointments/${id}/cancel`, { method: 'PATCH' });
}

export function getTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
  return apiRequest<TimeSlot[]>(`/api/time-slots/doctor/${doctorId}/date/${date}`);
}

export function getMyQueue(): Promise<QueueEntry[]> {
  return apiRequest<QueueEntry[]>('/api/queue/my');
}
