import { apiRequest } from '../../../core/api/client';
import type { Coordinates } from '../../../core/location/useLocationSelector';
import type { Hospital, HospitalDetail } from './types';

export function getHospitals(): Promise<Hospital[]> {
  return apiRequest<Hospital[]>('/api/hospitals');
}

export function getHospitalsNearby(coords: Coordinates, radiusKm = 10): Promise<Hospital[]> {
  return apiRequest<Hospital[]>(
    `/api/hospitals/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=${radiusKm}`
  );
}

export function searchHospitalsByCity(city: string): Promise<Hospital[]> {
  return apiRequest<Hospital[]>(`/api/hospitals/search?city=${encodeURIComponent(city)}`);
}

export function getHospitalById(id: string): Promise<HospitalDetail> {
  return apiRequest<HospitalDetail>(`/api/hospitals/${id}`);
}
