/**
 * [ADAPTER] No backend password-reset endpoint exists yet
 * (see docs/superpowers/plans/2026-08-29-patient-frontend-phase-1.md — "Known Spec Gap").
 * Same contract a real POST /api/auth/forgot-password would expose:
 * accepts an identifier, always resolves with a generic non-leaking message.
 */
export async function requestPasswordReset(_identifier: string): Promise<{ message: string }> {
  return { message: 'If an account exists for that email or phone, reset instructions have been sent.' };
}
