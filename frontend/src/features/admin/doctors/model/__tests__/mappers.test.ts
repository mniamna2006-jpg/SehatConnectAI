import { buildDoctorCreateInput, buildDoctorUpdate } from '../mappers';

const doctor = {
  doctor_id: 'doctor-1',
  hospital_id: 'hospital-1',
  department_id: 'department-1',
  name: 'Dr. Amina Shah',
  specialization: 'Cardiology',
  qualification: 'FCPS',
  license_number: 'PMC-1001',
  bio: null,
  consultation_fee: '2500.00',
  is_active: true,
};

test('builds a doctor create payload with one hospital and one department', () => {
  expect(buildDoctorCreateInput('hospital-1', {
    department_id: 'department-1',
    name: ' Dr. Amina Shah ',
    specialization: ' Cardiology ',
    qualification: '',
    license_number: ' PMC-1001 ',
    bio: ' Consultant cardiologist ',
    consultation_fee: '2500',
  })).toEqual({
    hospital_id: 'hospital-1',
    department_id: 'department-1',
    name: 'Dr. Amina Shah',
    specialization: 'Cardiology',
    qualification: null,
    license_number: 'PMC-1001',
    bio: 'Consultant cardiologist',
    consultation_fee: 2500,
  });
});

test('builds only changed doctor fields and can clear optional values', () => {
  expect(buildDoctorUpdate(doctor, {
    department_id: 'department-1',
    name: 'Dr. Amina Shah',
    specialization: 'Cardiology',
    qualification: '',
    license_number: 'PMC-1001',
    bio: '',
    consultation_fee: '3000',
  })).toEqual({ qualification: null, consultation_fee: 3000 });
});

test('returns an empty doctor patch when normalized values are unchanged', () => {
  expect(buildDoctorUpdate(doctor, {
    department_id: 'department-1',
    name: ' Dr. Amina Shah ',
    specialization: ' Cardiology ',
    qualification: ' FCPS ',
    license_number: ' PMC-1001 ',
    bio: '',
    consultation_fee: '2500.00',
  })).toEqual({});
});
