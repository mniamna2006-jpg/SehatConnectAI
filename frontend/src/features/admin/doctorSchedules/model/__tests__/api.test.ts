import { apiRequest } from '../../../../../core/api/client';
import { createDoctorSchedule, generateTimeSlots, getDoctorSchedules } from '../api';

jest.mock('../../../../../core/api/client');

beforeEach(() => jest.clearAllMocks());

test('uses the actual doctor schedule list and create routes', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  const input = {
    doctor_id: 'doctor-1',
    day_of_week: 'MONDAY' as const,
    start_time: '09:00',
    end_time: '12:00',
    appointment_duration: 30,
  };

  await getDoctorSchedules('doctor-1');
  await createDoctorSchedule(input);

  expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/schedules/doctor/doctor-1', { scope: 'hospital' });
  expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/schedules', {
    method: 'POST', body: input, scope: 'hospital',
  });
});

test('uses the actual time-slot generation request shape', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  const input = { doctor_id: 'doctor-1', hospital_id: 'hospital-1', date: '2026-09-07' };

  await generateTimeSlots(input);

  expect(apiRequest).toHaveBeenCalledWith('/api/time-slots/generate', {
    method: 'POST', body: input, scope: 'hospital',
  });
});
