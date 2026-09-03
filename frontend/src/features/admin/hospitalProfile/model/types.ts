import type { FacilityType } from '../../../../shared/types/api';

export interface AdminHospitalProfile {
  hospital_id: string;
  name: string;
  facility_type: FacilityType;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  theme: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  city: string;
  latitude: number | string;
  longitude: number | string;
  is_active: boolean;
}

export interface HospitalProfileInput {
  name: string;
  facility_type: FacilityType;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  theme?: string;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface HospitalProfilePatch {
  name?: string;
  facility_type?: FacilityType;
  description?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  theme?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}
