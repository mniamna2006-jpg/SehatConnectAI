import { buildHospitalProfilePatch } from '../mappers';
import type { AdminHospitalProfile, HospitalProfileInput } from '../types';

const hospital: AdminHospitalProfile = {
  hospital_id: 'h1',
  name: 'City Hospital',
  facility_type: 'HOSPITAL',
  description: null,
  logo_url: 'https://example.com/logo.png',
  cover_image_url: null,
  theme: null,
  phone: '+92 21 111 222 333',
  email: 'ops@cityhospital.test',
  address: 'Main Road',
  city: 'Karachi',
  latitude: 24.8607,
  longitude: 67.0011,
  is_active: true,
};

const unchangedForm: HospitalProfileInput = {
  name: 'City Hospital',
  facility_type: 'HOSPITAL',
  description: '',
  logo_url: 'https://example.com/logo.png',
  cover_image_url: '',
  theme: '',
  phone: '+92 21 111 222 333',
  email: 'ops@cityhospital.test',
  address: 'Main Road',
  city: 'Karachi',
  latitude: 24.8607,
  longitude: 67.0011,
};

test('returns an empty patch when form values have not changed', () => {
  expect(buildHospitalProfilePatch(hospital, unchangedForm)).toEqual({});
});

test('returns only changed fields and clears optional strings with null', () => {
  expect(buildHospitalProfilePatch(hospital, {
    ...unchangedForm,
    city: 'Lahore',
    logo_url: '',
  })).toEqual({
    city: 'Lahore',
    logo_url: null,
  });
});
