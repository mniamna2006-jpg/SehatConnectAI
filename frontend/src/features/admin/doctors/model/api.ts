import { apiRequest } from '../../../../core/api/client';
import type { AdminDoctor, DoctorCreateInput, DoctorUpdateInput } from './types';

export function getDoctors(hospitalId: string): Promise<AdminDoctor[]> {
  return apiRequest<AdminDoctor[]>(`/api/doctors/hospital/${hospitalId}`, { scope: 'hospital' });
}

export function createDoctor(input: DoctorCreateInput): Promise<AdminDoctor> {
  return apiRequest<AdminDoctor>('/api/doctors', {
    method: 'POST',
    body: input,
    scope: 'hospital',
  });
}

export function updateDoctor(doctorId: string, input: DoctorUpdateInput): Promise<AdminDoctor> {
  return apiRequest<AdminDoctor>(`/api/doctors/${doctorId}`, {
    method: 'PATCH',
    body: input,
    scope: 'hospital',
  });
}

export function deactivateDoctor(doctorId: string): Promise<AdminDoctor> {
  return apiRequest<AdminDoctor>(`/api/doctors/${doctorId}/deactivate`, {
    method: 'PATCH',
    scope: 'hospital',
  });
}
