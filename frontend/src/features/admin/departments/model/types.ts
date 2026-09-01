export interface Department {
  department_id: string;
  hospital_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
}

export interface DepartmentInput {
  hospital_id: string;
  name: string;
  description?: string;
}

export interface DepartmentUpdateInput {
  name?: string;
  description?: string;
}
