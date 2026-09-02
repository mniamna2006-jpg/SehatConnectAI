import { hospitalProfileSchema } from '../schemas';

const validProfile = {
  name: 'City Hospital',
  facility_type: 'HOSPITAL' as const,
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

test('accepts backend-supported profile fields with URL image values', () => {
  expect(hospitalProfileSchema.safeParse(validProfile).success).toBe(true);
});

test('rejects coordinates outside backend-supported ranges', () => {
  expect(hospitalProfileSchema.safeParse({ ...validProfile, latitude: 91 }).success).toBe(false);
  expect(hospitalProfileSchema.safeParse({ ...validProfile, longitude: -181 }).success).toBe(false);
});

test('rejects non-URL image values instead of implying file upload support', () => {
  expect(hospitalProfileSchema.safeParse({ ...validProfile, logo_url: 'logo.png' }).success).toBe(false);
});
