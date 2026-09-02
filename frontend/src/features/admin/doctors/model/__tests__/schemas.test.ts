import { doctorSchema } from '../schemas';

const validDoctor = {
  department_id: 'department-1',
  name: 'Dr. Amina Shah',
  specialization: 'Cardiology',
  qualification: 'FCPS',
  license_number: 'PMC-1001',
  bio: '',
  consultation_fee: '2500',
};

test('accepts backend-supported doctor fields', () => {
  expect(doctorSchema.safeParse(validDoctor).success).toBe(true);
});

test.each(['-1', 'not-a-number'])('rejects invalid consultation fee %s', (consultationFee) => {
  expect(doctorSchema.safeParse({ ...validDoctor, consultation_fee: consultationFee }).success).toBe(false);
});

test('requires a selected department', () => {
  const result = doctorSchema.safeParse({ ...validDoctor, department_id: '' });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0]?.message).toBe('admin.doctors.validation.department');
  }
});

test('uses a localizable validation key for an invalid consultation fee', () => {
  const result = doctorSchema.safeParse({ ...validDoctor, consultation_fee: '-1' });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0]?.message).toBe('admin.doctors.validation.consultationFee');
  }
});
