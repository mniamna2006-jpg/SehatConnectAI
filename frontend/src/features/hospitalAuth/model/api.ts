import { apiRequest } from '../../../core/api/client';
import type { HospitalAuthResult, HospitalLoginInput, HospitalUser } from './types';

export function loginHospital(input: HospitalLoginInput): Promise<HospitalAuthResult> {
  return apiRequest<HospitalAuthResult>('/api/auth/login-hospital', {
    method: 'POST',
    body: input,
    auth: false,
  });
}

export function getHospitalMe(): Promise<HospitalUser> {
  return apiRequest<HospitalUser>('/api/auth/me', { scope: 'hospital' });
}
