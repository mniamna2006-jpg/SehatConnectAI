/**
 * [ADAPTER] No backend password-reset endpoint exists yet
 * (see docs/superpowers/plans/2026-08-29-patient-frontend-phase-1.md — "Known Spec Gap").
 * Same contract a real POST /api/auth/forgot-password would expose:
 * accepts an email, always resolves with a generic non-leaking message (never confirms
 * whether the account exists, never claims a real email was sent).
 */
export async function requestPasswordReset(_email: string): Promise<{ message: string }> {
  return { message: 'If an account exists, reset instructions will be sent.' };
}
