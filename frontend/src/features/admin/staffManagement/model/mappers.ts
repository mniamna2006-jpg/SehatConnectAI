import type { StaffMember, StaffUpdateInput } from './types';

export interface StaffFormValues {
  full_name: string;
  employee_id: string;
  position: string;
  email?: string;
  phone?: string;
  password?: string;
  department_id?: string;
}

export function buildStaffUpdate(staff: StaffMember, values: StaffFormValues): StaffUpdateInput {
  const patch: StaffUpdateInput = {};
  if (values.full_name !== staff.user.full_name) patch.full_name = values.full_name;
  if (values.employee_id !== staff.employee_id) patch.employee_id = values.employee_id;
  if (values.position !== staff.position) patch.position = values.position;
  const email = values.email || undefined;
  if (email !== (staff.user.email ?? undefined)) patch.email = email;
  const phone = values.phone || undefined;
  if (phone !== (staff.user.phone ?? undefined)) patch.phone = phone;
  const departmentId = values.department_id || null;
  if (departmentId !== staff.department_id) patch.department_id = departmentId;
  return patch;
}
