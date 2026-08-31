import { apiRequest } from '../../../core/api/client';
import type { LoginInput, RegisterInput, AuthResult, CurrentUser } from './types';

export function login(input: LoginInput): Promise<AuthResult> {
  return apiRequest<AuthResult>('/api/auth/login', { method: 'POST', body: input, auth: false });
}

export function registerPatient(input: RegisterInput): Promise<AuthResult> {
  return apiRequest<AuthResult>('/api/auth/register/patient', {
    method: 'POST',
    body: input,
    auth: false,
  });
}

export function getMe(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/api/auth/me');
}
