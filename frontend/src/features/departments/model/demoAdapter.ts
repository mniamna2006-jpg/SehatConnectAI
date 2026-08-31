/** [DEV DEMO ADAPTER] Only reachable when isDemoMode() is true. */
import { demoDepartments } from '../../../core/demo/fixtures';
import type { Department } from './types';

export async function demoGetDepartmentsByHospital(hospitalId: string): Promise<Department[]> {
  return demoDepartments().filter((d) => d.hospital_id === hospitalId);
}
