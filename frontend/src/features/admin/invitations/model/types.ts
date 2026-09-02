export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface StaffInvitation {
  invitation_id: string;
  hospital_id: string;
  email: string;
  employee_id: string;
  position: string;
  department_id: string | null;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

export interface InvitationCreateInput {
  hospital_id: string;
  email: string;
  employee_id: string;
  position: string;
  department_id?: string;
}
