import type { Department, DepartmentFormValues, DepartmentUpdateInput } from './types';

export function buildDepartmentUpdate(
  department: Department,
  values: DepartmentFormValues
): DepartmentUpdateInput {
  const patch: DepartmentUpdateInput = {};
  const name = values.name.trim();
  const description = values.description?.trim() || null;

  if (name !== department.name) patch.name = name;
  if (description !== (department.description ?? null)) patch.description = description;

  return patch;
}
