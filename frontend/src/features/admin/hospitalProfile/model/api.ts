import { apiRequest } from '../../../../core/api/client';
import type { AdminHospitalProfile, HospitalProfilePatch } from './types';

export function getAdminHospitalProfile(hospitalId: string): Promise<AdminHospitalProfile> {
  return apiRequest<AdminHospitalProfile>(`/api/hospitals/${hospitalId}`, { auth: false });
}

export function updateAdminHospitalProfile(hospitalId: string, input: HospitalProfilePatch): Promise<AdminHospitalProfile> {
  return apiRequest<AdminHospitalProfile>(`/api/hospitals/${hospitalId}`, {
    method: 'PATCH',
    body: input,
    scope: 'hospital',
  });
}
