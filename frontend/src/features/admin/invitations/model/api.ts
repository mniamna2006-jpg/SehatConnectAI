import { apiRequest } from '../../../../core/api/client';
import type { InvitationCreateInput, StaffInvitation } from './types';

export function getInvitations(hospitalId: string): Promise<StaffInvitation[]> {
  return apiRequest<StaffInvitation[]>(`/api/staff/invitations/hospital/${hospitalId}`, { scope: 'hospital' });
}

export function createInvitation(input: InvitationCreateInput): Promise<StaffInvitation> {
  return apiRequest<StaffInvitation>('/api/staff/invitations', {
    method: 'POST',
    body: input,
    scope: 'hospital',
  });
}

export function revokeInvitation(invitationId: string): Promise<StaffInvitation> {
  return apiRequest<StaffInvitation>(`/api/staff/invitations/${invitationId}/revoke`, {
    method: 'PATCH',
    scope: 'hospital',
  });
}
