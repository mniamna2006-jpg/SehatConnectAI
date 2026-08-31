import { apiRequest } from '../../../core/api/client';
import type { PatientProfile, ProfileUpdateInput } from './types';

export function getProfile(): Promise<PatientProfile> {
  return apiRequest<PatientProfile>('/api/patients/profile');
}

export function updateProfile(input: ProfileUpdateInput): Promise<PatientProfile> {
  return apiRequest<PatientProfile>('/api/patients/profile', { method: 'PATCH', body: input });
}
