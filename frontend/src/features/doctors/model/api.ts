import { apiRequest } from '../../../core/api/client';
import type { Doctor, DoctorAvailabilitySubscription, DoctorDetail } from './types';

export function getDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
  return apiRequest<Doctor[]>(`/api/doctors/hospital/${hospitalId}`);
}

export function getDoctorsByDepartment(departmentId: string): Promise<Doctor[]> {
  return apiRequest<Doctor[]>(`/api/doctors/department/${departmentId}`);
}

export function getDoctorById(id: string): Promise<DoctorDetail> {
  return apiRequest<DoctorDetail>(`/api/doctors/${id}`);
}

export function getDoctorAvailabilitySubscription(
  doctorId: string
): Promise<DoctorAvailabilitySubscription> {
  return apiRequest<DoctorAvailabilitySubscription>(
    `/api/doctors/${doctorId}/availability-subscription`
  );
}

export function subscribeToDoctorAvailability(
  doctorId: string
): Promise<DoctorAvailabilitySubscription> {
  return apiRequest<DoctorAvailabilitySubscription>(
    `/api/doctors/${doctorId}/availability-subscription`,
    { method: 'POST' }
  );
}

export function unsubscribeFromDoctorAvailability(
  doctorId: string
): Promise<DoctorAvailabilitySubscription> {
  return apiRequest<DoctorAvailabilitySubscription>(
    `/api/doctors/${doctorId}/availability-subscription`,
    { method: 'DELETE' }
  );
}
