/**
 * [ADAPTER] No cross-hospital doctor search endpoint exists yet (see DATA_CONTRACTS.md).
 * This keeps the future search contract in the Model layer: resolve hospitals from the
 * selected GPS/manual scope, search their real doctor endpoints, then load each matching
 * doctor's real detail so discovery results include one hospital, one department, and schedule.
 */
import type { Coordinates } from '../../../../core/location/useLocationSelector';
import {
  getHospitals,
  getHospitalsNearby,
  searchHospitalsByCity,
} from '../../../hospitals/model/api';
import { getDoctorById, getDoctorsByHospital } from '../api';
import type { Doctor, DoctorDetail } from '../types';

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

function matchesQuery(doctor: Doctor, normalizedQuery: string): boolean {
  return (
    doctor.name.toLowerCase().includes(normalizedQuery) ||
    (doctor.specialization ?? '').toLowerCase().includes(normalizedQuery)
  );
}

export async function findDoctors(
  query: string,
  location: LocationScope
): Promise<DoctorDetail[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const hospitals = await resolveScopedHospitals(location);
  const perHospital = await Promise.all(
    hospitals.map((hospital) => getDoctorsByHospital(hospital.hospital_id))
  );
  const matches = perHospital
    .flat()
    .filter((doctor) => doctor.is_active)
    .filter((doctor) => matchesQuery(doctor, normalizedQuery));

  return Promise.all(matches.map((doctor) => getDoctorById(doctor.doctor_id)));
}
