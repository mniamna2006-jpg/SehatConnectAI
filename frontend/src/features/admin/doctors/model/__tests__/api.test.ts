import { apiRequest } from '../../../../../core/api/client';
import {
  createDoctor,
  deactivateDoctor,
  getDoctors,
  updateDoctor,
  updateDoctorAvailability,
} from '../api';

jest.mock('../../../../../core/api/client');

const input = {
  hospital_id: 'hospital-1',
  department_id: 'department-1',
  name: 'Dr. Amina Shah',
  specialization: 'Cardiology',
  qualification: null,
  license_number: 'PMC-1001',
  bio: null,
  consultation_fee: 2500,
};

beforeEach(() => jest.clearAllMocks());

test('uses the source-backed hospital doctor list route', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getDoctors('hospital-1');
  expect(apiRequest).toHaveBeenCalledWith('/api/doctors/hospital/hospital-1', { scope: 'hospital' });
});

test('uses source-backed create, update, and deactivate doctor contracts', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({});

  await createDoctor(input);
  await updateDoctor('doctor-1', { bio: 'Updated bio' });
  await deactivateDoctor('doctor-1');

  expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/doctors', {
    method: 'POST', body: input, scope: 'hospital',
  });
  expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/doctors/doctor-1', {
    method: 'PATCH', body: { bio: 'Updated bio' }, scope: 'hospital',
  });
  expect(apiRequest).toHaveBeenNthCalledWith(3, '/api/doctors/doctor-1/deactivate', {
    method: 'PATCH', scope: 'hospital',
  });
});

test.each([true, false])('updates doctor availability to %s with hospital auth', async (isAvailable) => {
  (apiRequest as jest.Mock).mockResolvedValue({
    ...input,
    doctor_id: 'doctor-1',
    is_active: true,
    is_available: isAvailable,
    notifications_created: 0,
  });

  await updateDoctorAvailability('doctor-1', isAvailable);

  expect(apiRequest).toHaveBeenCalledWith('/api/doctors/doctor-1/availability', {
    method: 'PATCH',
    body: { is_available: isAvailable },
    scope: 'hospital',
  });
});
