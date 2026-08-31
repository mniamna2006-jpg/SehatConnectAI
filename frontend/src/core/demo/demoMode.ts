/**
 * [DEV DEMO ADAPTER] Gate for development-only demo mode.
 * EXPO_PUBLIC_DEMO_MODE=true switches Model-layer api.ts functions from the
 * real backend to fixture data (see ./fixtures.ts). Unset or any other value
 * always means the real backend — there is no automatic fallback.
 */
export function isDemoMode(): boolean {
  return process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
}

export const DEMO_EMAIL = 'demo@sehatconnect.test';
export const DEMO_PASSWORD = 'Demo123!';
