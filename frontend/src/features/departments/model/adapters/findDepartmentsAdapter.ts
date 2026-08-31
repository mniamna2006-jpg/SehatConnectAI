/**
 * [ADAPTER] No cross-hospital department search endpoint exists yet.
 * Resolve the selected GPS/manual hospital scope, fan out over the real
 * per-hospital endpoint, and keep the View/ViewModel independent of that gap.
 */
import type { Coordinates } from '../../../../core/location/useLocationSelector';
import {
  getHospitals,
  getHospitalsNearby,
  searchHospitalsByCity,
} from '../../../hospitals/model/api';
import { getDepartmentsByHospital } from '../api';
import type { Department } from '../types';

interface LocationScope {
  mode: 'gps' | 'manual';
  coordinates: Coordinates | null;
  manualCity: string;
}

async function resolveScopedHospitals(location: LocationScope) {
  if (location.mode === 'gps' && location.coordinates) {
    return getHospitalsNearby(location.coordinates);
  }
  if (location.mode === 'manual' && location.manualCity.trim()) {
    return searchHospitalsByCity(location.manualCity.trim());
  }
  return getHospitals();
}

export async function findDepartments(
  query: string,
  location: LocationScope
): Promise<Department[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const hospitals = await resolveScopedHospitals(location);
  const perHospital = await Promise.all(
    hospitals.map((hospital) => getDepartmentsByHospital(hospital.hospital_id))
  );

  return perHospital
    .flat()
    .filter((department) => department.is_active)
    .filter((department) => department.name.toLowerCase().includes(normalizedQuery));
}
