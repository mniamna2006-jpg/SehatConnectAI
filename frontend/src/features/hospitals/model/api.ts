import { apiRequest } from '../../../core/api/client';
import { isDemoMode } from '../../../core/demo/demoMode';
import type { Coordinates } from '../../../core/location/useLocationSelector';
import {
  demoGetHospitalById,
  demoGetHospitals,
  demoGetHospitalsNearby,
  demoSearchHospitalsByCity,
} from './demoAdapter';
import type { Hospital, HospitalDetail } from './types';

export function getHospitals(): Promise<Hospital[]> {
  if (isDemoMode()) return demoGetHospitals();
  return apiRequest<Hospital[]>('/api/hospitals');
}

export function getHospitalsNearby(coords: Coordinates, radiusKm = 10): Promise<Hospital[]> {
  if (isDemoMode()) return demoGetHospitalsNearby(coords);
  return apiRequest<Hospital[]>(
    `/api/hospitals/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=${radiusKm}`
  );
}

export function searchHospitalsByCity(city: string): Promise<Hospital[]> {
  if (isDemoMode()) return demoSearchHospitalsByCity(city);
  return apiRequest<Hospital[]>(`/api/hospitals/search?city=${encodeURIComponent(city)}`);
}

export function getHospitalById(id: string): Promise<HospitalDetail> {
  if (isDemoMode()) return demoGetHospitalById(id);
  return apiRequest<HospitalDetail>(`/api/hospitals/${id}`);
}
