import { apiRequest } from '../../../core/api/client';
import type { Department } from './types';

export function getDepartmentsByHospital(hospitalId: string): Promise<Department[]> {
  return apiRequest<Department[]>(`/api/departments/hospital/${hospitalId}`);
}
