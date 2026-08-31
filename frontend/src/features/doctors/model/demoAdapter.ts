/** [DEV DEMO ADAPTER] Only reachable when isDemoMode() is true. */
import { ApiError } from '../../../core/api/client';
import { demoDoctorById, demoDoctorsByDepartment, demoDoctorsByHospital } from '../../../core/demo/fixtures';
import type { Doctor, DoctorDetail } from './types';

export async function demoGetDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
  return demoDoctorsByHospital(hospitalId);
}

export async function demoGetDoctorsByDepartment(departmentId: string): Promise<Doctor[]> {
  return demoDoctorsByDepartment(departmentId);
}

export async function demoGetDoctorById(id: string): Promise<DoctorDetail> {
  const doctor = demoDoctorById(id);
  if (!doctor) throw new ApiError(404, 'Demo doctor not found');
  return doctor;
}
