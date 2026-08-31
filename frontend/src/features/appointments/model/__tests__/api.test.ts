import { apiRequest } from '../../../../core/api/client';
import {
  cancelAppointment,
  createAppointment,
  getAppointmentById,
  getMyAppointments,
  getMyQueue,
  getTimeSlots,
} from '../api';

jest.mock('../../../../core/api/client');

beforeEach(() => {
  jest.clearAllMocks();
});

test('getMyAppointments calls GET /api/appointments/my', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getMyAppointments();
  expect(apiRequest).toHaveBeenCalledWith('/api/appointments/my');
});

test('createAppointment posts the booking input', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ appointment_id: 'a1' });
  const input = {
    doctor_id: 'd1',
    hospital_id: 'h1',
    department_id: 'dep1',
    slot_id: 's1',
  };
  await createAppointment(input);
  expect(apiRequest).toHaveBeenCalledWith('/api/appointments', { method: 'POST', body: input });
});

test('getAppointmentById calls GET /api/appointments/:id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ appointment_id: 'a1' });
  await getAppointmentById('a1');
  expect(apiRequest).toHaveBeenCalledWith('/api/appointments/a1');
});

test('cancelAppointment patches /api/appointments/:id/cancel', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ appointment_id: 'a1' });
  await cancelAppointment('a1');
  expect(apiRequest).toHaveBeenCalledWith('/api/appointments/a1/cancel', {
    method: 'PATCH',
  });
});

test('getTimeSlots calls the doctor/date endpoint', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getTimeSlots('d1', '2026-09-01');
  expect(apiRequest).toHaveBeenCalledWith('/api/time-slots/doctor/d1/date/2026-09-01');
});

test('getMyQueue calls GET /api/queue/my', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getMyQueue();
  expect(apiRequest).toHaveBeenCalledWith('/api/queue/my');
});

test('an appointment API failure rejects', async () => {
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));

  await expect(getMyAppointments()).rejects.toThrow('network down');
});
