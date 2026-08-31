/**
 * [DEV DEMO ADAPTER] Only reachable when isDemoMode() is true. Simulates
 * login/register/session against fixture data — never a real backend record.
 */
import { ApiError } from '../../../core/api/client';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../../../core/demo/demoMode';
import { DEMO_TOKEN, DEMO_USER } from '../../../core/demo/fixtures';
import type { AuthResult, CurrentUser, LoginInput, RegisterInput } from './types';

export async function demoLogin(input: LoginInput): Promise<AuthResult> {
  if (input.email !== DEMO_EMAIL || input.password !== DEMO_PASSWORD) {
    throw new ApiError(401, 'Invalid demo credentials. Use the documented demo login.');
  }
  return { token: DEMO_TOKEN, user: DEMO_USER };
}

// Demo registration only simulates account creation for UI/navigation testing;
// no real backend record is ever created (see DATA_CONTRACTS.md § Auth).
export async function demoRegister(input: RegisterInput): Promise<AuthResult> {
  const user: CurrentUser = {
    ...DEMO_USER,
    full_name: input.full_name,
    email: input.email ?? DEMO_USER.email,
    phone: input.phone ?? DEMO_USER.phone,
    preferred_language: input.preferred_language,
  };
  return { token: DEMO_TOKEN, user };
}

export async function demoGetMe(): Promise<CurrentUser> {
  return DEMO_USER;
}
