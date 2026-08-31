import type { FacilityType } from '../../../shared/types/api';

export interface WorkingHours {
  day_of_week: string;
  open_time: string;
  close_time: string;
}

export interface Hospital {
  hospital_id: string;
  name: string;
  facility_type: FacilityType;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
}

export interface HospitalDetail extends Hospital {
  working_hours: WorkingHours[];
  departments: { department_id: string; name: string }[];
  doctors: { doctor_id: string; name: string; specialization?: string }[];
}

export interface HospitalLocation {
  hospital_id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}
