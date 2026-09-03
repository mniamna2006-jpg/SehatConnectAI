import type { AdminHospitalProfile, HospitalProfileInput, HospitalProfilePatch } from './types';

const OPTIONAL_STRING_FIELDS = [
  'description',
  'logo_url',
  'cover_image_url',
  'theme',
  'phone',
  'email',
] as const;

export function buildHospitalProfilePatch(
  hospital: AdminHospitalProfile,
  values: HospitalProfileInput
): HospitalProfilePatch {
  const patch: HospitalProfilePatch = {};

  const name = values.name.trim();
  if (name !== hospital.name) patch.name = name;
  if (values.facility_type !== hospital.facility_type) patch.facility_type = values.facility_type;

  for (const field of OPTIONAL_STRING_FIELDS) {
    const value = values[field]?.trim() || null;
    if (value !== hospital[field]) patch[field] = value;
  }

  const address = values.address.trim();
  if (address !== hospital.address) patch.address = address;

  const city = values.city.trim();
  if (city !== hospital.city) patch.city = city;

  if (values.latitude !== Number(hospital.latitude)) patch.latitude = values.latitude;
  if (values.longitude !== Number(hospital.longitude)) patch.longitude = values.longitude;

  return patch;
}
