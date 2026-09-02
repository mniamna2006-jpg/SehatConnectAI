export type HospitalRole = 'ADMIN' | 'STAFF';

export interface HospitalOrgSummary {
  hospital_id: string;
  name: string;
  facility_type: string;
  city: string;
}

export interface HospitalDepartmentSummary {
  department_id: string;
  name: string;
}

export interface HospitalUser {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: HospitalRole;
  hospital: HospitalOrgSummary | null;
  department: HospitalDepartmentSummary | null;
}

export interface HospitalLoginInput {
  email: string;
  password: string;
}

export interface HospitalAuthResult {
  token: string;
  user: HospitalUser;
}
