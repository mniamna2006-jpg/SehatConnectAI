import { apiRequest } from '../../../core/api/client';
import { isDemoMode } from '../../../core/demo/demoMode';
import { demoGetDoctorById, demoGetDoctorsByDepartment, demoGetDoctorsByHospital } from './demoAdapter';
import type { Doctor, DoctorDetail } from './types';

export function getDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
  if (isDemoMode()) return demoGetDoctorsByHospital(hospitalId);
  return apiRequest<Doctor[]>(`/api/doctors/hospital/${hospitalId}`);
}

export function getDoctorsByDepartment(departmentId: string): Promise<Doctor[]> {
  if (isDemoMode()) return demoGetDoctorsByDepartment(departmentId);
  return apiRequest<Doctor[]>(`/api/doctors/department/${departmentId}`);
}

export function getDoctorById(id: string): Promise<DoctorDetail> {
  if (isDemoMode()) return demoGetDoctorById(id);
  return apiRequest<DoctorDetail>(`/api/doctors/${id}`);
}
