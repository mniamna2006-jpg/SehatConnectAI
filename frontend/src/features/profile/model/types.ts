import type { PreferredLanguage } from '../../../shared/types/api';

export interface PatientProfile {
  patient_id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  preferred_language: PreferredLanguage;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  emergency_contact?: string;
}

// email is intentionally excluded: backend PATCH /api/patients/profile does not accept email mutation.
export type ProfileUpdateInput = Partial<
  Pick<PatientProfile, 'full_name' | 'phone' | 'preferred_language' | 'date_of_birth' | 'gender' | 'address' | 'city' | 'emergency_contact'>
>;
