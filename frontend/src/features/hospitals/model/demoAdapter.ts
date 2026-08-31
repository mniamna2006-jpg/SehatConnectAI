/** [DEV DEMO ADAPTER] Only reachable when isDemoMode() is true. */
import { ApiError } from '../../../core/api/client';
import type { Coordinates } from '../../../core/location/useLocationSelector';
import { demoHospitalById, demoHospitals } from '../../../core/demo/fixtures';
import type { Hospital, HospitalDetail } from './types';

export async function demoGetHospitals(): Promise<Hospital[]> {
  return demoHospitals();
}

export async function demoGetHospitalsNearby(_coords: Coordinates): Promise<Hospital[]> {
  return demoHospitals().map((h, i) => ({ ...h, distance_km: 1.2 + i * 2.1 }));
}

export async function demoSearchHospitalsByCity(city: string): Promise<Hospital[]> {
  const terms = city
    .toLowerCase()
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);
  return demoHospitals().filter((hospital) => {
    const searchableLocation = [hospital.name, hospital.address, hospital.city]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return terms.some((term) => searchableLocation.includes(term));
  });
}

export async function demoGetHospitalById(id: string): Promise<HospitalDetail> {
  const hospital = demoHospitalById(id);
  if (!hospital) throw new ApiError(404, 'Demo hospital not found');
  return hospital;
}
