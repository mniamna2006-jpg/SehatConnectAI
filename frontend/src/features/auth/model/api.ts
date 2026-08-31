import { apiRequest } from '../../../core/api/client';
import { isDemoMode } from '../../../core/demo/demoMode';
import { demoGetMe, demoLogin, demoRegister } from './demoAdapter';
import type { LoginInput, RegisterInput, AuthResult, CurrentUser } from './types';

export function login(input: LoginInput): Promise<AuthResult> {
  if (isDemoMode()) return demoLogin(input);
  return apiRequest<AuthResult>('/api/auth/login', { method: 'POST', body: input, auth: false });
}

export function registerPatient(input: RegisterInput): Promise<AuthResult> {
  if (isDemoMode()) return demoRegister(input);
  return apiRequest<AuthResult>('/api/auth/register/patient', {
    method: 'POST',
    body: input,
    auth: false,
  });
}

export function getMe(): Promise<CurrentUser> {
  if (isDemoMode()) return demoGetMe();
  return apiRequest<CurrentUser>('/api/auth/me');
}
