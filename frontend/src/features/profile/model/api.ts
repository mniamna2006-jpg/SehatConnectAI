import { apiRequest } from '../../../core/api/client';
import { isDemoMode } from '../../../core/demo/demoMode';
import { demoGetProfile, demoUpdateProfile } from './demoAdapter';
import type { PatientProfile, ProfileUpdateInput } from './types';

export function getProfile(): Promise<PatientProfile> {
  if (isDemoMode()) return demoGetProfile();
  return apiRequest<PatientProfile>('/api/patients/profile');
}

export function updateProfile(input: ProfileUpdateInput): Promise<PatientProfile> {
  if (isDemoMode()) return demoUpdateProfile(input);
  return apiRequest<PatientProfile>('/api/patients/profile', { method: 'PATCH', body: input });
}
