import { apiRequest } from '../../../core/api/client';
import { isDemoMode } from '../../../core/demo/demoMode';
import { demoGetDepartmentsByHospital } from './demoAdapter';
import type { Department } from './types';

export function getDepartmentsByHospital(hospitalId: string): Promise<Department[]> {
  if (isDemoMode()) return demoGetDepartmentsByHospital(hospitalId);
  return apiRequest<Department[]>(`/api/departments/hospital/${hospitalId}`);
}
