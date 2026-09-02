import { apiRequest } from '../../../../core/api/client';
import type { Department, DepartmentInput, DepartmentUpdateInput } from './types';

export function getDepartments(hospitalId: string): Promise<Department[]> {
  return apiRequest<Department[]>(`/api/departments/hospital/${hospitalId}`, { scope: 'hospital' });
}

export function createDepartment(input: DepartmentInput): Promise<Department> {
  return apiRequest<Department>('/api/departments', { method: 'POST', body: input, scope: 'hospital' });
}

export function updateDepartment(id: string, input: DepartmentUpdateInput): Promise<Department> {
  return apiRequest<Department>(`/api/departments/${id}`, { method: 'PATCH', body: input, scope: 'hospital' });
}

export function deactivateDepartment(id: string): Promise<Department> {
  return apiRequest<Department>(`/api/departments/${id}/deactivate`, { method: 'PATCH', scope: 'hospital' });
}
