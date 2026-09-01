export interface AdminDoctor {
  doctor_id: string;
  hospital_id: string;
  department_id: string;
  name: string;
  specialization: string;
  qualification: string | null;
  license_number: string;
  bio: string | null;
  consultation_fee: number | string | null;
  is_active: boolean;
}

export interface DoctorCreateInput {
  hospital_id: string;
  department_id: string;
  name: string;
  specialization: string;
  qualification: string | null;
  license_number: string;
  bio: string | null;
  consultation_fee: number | null;
}

export interface DoctorUpdateInput {
  department_id?: string;
  name?: string;
  specialization?: string;
  qualification?: string | null;
  license_number?: string;
  bio?: string | null;
  consultation_fee?: number | null;
}

export interface AdminDoctorRow extends AdminDoctor {
  department_name: string;
}
