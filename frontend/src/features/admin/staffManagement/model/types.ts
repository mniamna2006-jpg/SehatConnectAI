export interface StaffMember {
  staff_id: string;
  hospital_id: string;
  employee_id: string;
  position: string;
  department_id: string | null;
  is_active: boolean;
  user: {
    user_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    is_active: boolean;
  };
  department: { department_id: string; name: string; is_active: boolean } | null;
}

export interface StaffCreateInput {
  hospital_id: string;
  department_id?: string;
  employee_id: string;
  position: string;
  full_name: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface StaffUpdateInput {
  department_id?: string | null;
  employee_id?: string;
  position?: string;
  full_name?: string;
  email?: string;
  phone?: string;
}
