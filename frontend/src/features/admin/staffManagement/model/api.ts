import { apiRequest } from '../../../../core/api/client';
import type { StaffCreateInput, StaffMember, StaffUpdateInput } from './types';

export function getStaff(hospitalId: string): Promise<StaffMember[]> {
  return apiRequest<StaffMember[]>(`/api/staff/hospital/${hospitalId}`, { scope: 'hospital' });
}

export function createStaff(input: StaffCreateInput): Promise<StaffMember> {
  return apiRequest<StaffMember>('/api/staff', { method: 'POST', body: input, scope: 'hospital' });
}

export function updateStaff(id: string, input: StaffUpdateInput): Promise<StaffMember> {
  return apiRequest<StaffMember>(`/api/staff/${id}`, { method: 'PATCH', body: input, scope: 'hospital' });
}

export function deactivateStaff(id: string): Promise<StaffMember> {
  return apiRequest<StaffMember>(`/api/staff/${id}/deactivate`, { method: 'PATCH', scope: 'hospital' });
}
