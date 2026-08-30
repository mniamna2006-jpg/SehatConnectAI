import type { PreferredLanguage } from '../../../shared/types/api';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  full_name: string;
  email?: string;
  phone?: string;
  password: string;
  preferred_language: PreferredLanguage;
}

export interface CurrentUser {
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: 'PATIENT';
  preferred_language: PreferredLanguage;
  patient_id?: string;
}

export interface AuthResult {
  token: string;
  user: CurrentUser;
}
