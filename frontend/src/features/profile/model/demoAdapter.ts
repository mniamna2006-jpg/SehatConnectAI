/** [DEV DEMO ADAPTER] Only reachable when isDemoMode() is true. */
import { DEMO_PROFILE } from '../../../core/demo/fixtures';
import type { PatientProfile, ProfileUpdateInput } from './types';

// ponytail: module-level mutable state, not persisted — resets on app reload, fine for a dev demo.
let profile: PatientProfile = { ...DEMO_PROFILE };

export async function demoGetProfile(): Promise<PatientProfile> {
  return profile;
}

export async function demoUpdateProfile(input: ProfileUpdateInput): Promise<PatientProfile> {
  profile = { ...profile, ...input };
  return profile;
}
