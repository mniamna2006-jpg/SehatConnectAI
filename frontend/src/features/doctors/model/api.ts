import { apiRequest } from '../../../core/api/client';
import type { Doctor, DoctorDetail } from './types';

export function getDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
  return apiRequest<Doctor[]>(`/api/doctors/hospital/${hospitalId}`);
}

export function getDoctorsByDepartment(departmentId: string): Promise<Doctor[]> {
  return apiRequest<Doctor[]>(`/api/doctors/department/${departmentId}`);
}

export function getDoctorById(id: string): Promise<DoctorDetail> {
  return apiRequest<DoctorDetail>(`/api/doctors/${id}`);
}
