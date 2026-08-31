import { apiRequest } from '../../../../core/api/client';
import {
  cancelAppointment,
  createAppointment,
  getAppointmentById,
  getMyAppointments,
  getMyQueue,
  getTimeSlots,
} from '../api';
import * as demoAdapter from '../demoAdapter';

jest.mock('../../../../core/api/client');
jest.mock('../demoAdapter');

const ORIGINAL_DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE;

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.EXPO_PUBLIC_DEMO_MODE;
});

afterEach(() => {
  process.env.EXPO_PUBLIC_DEMO_MODE = ORIGINAL_DEMO_MODE;
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

test('demo mode routes every appointment function to the demo adapter, never the real API', async () => {
  process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
  const input = {
    doctor_id: 'd1',
    hospital_id: 'h1',
    department_id: 'dep1',
    slot_id: 's1',
  };
  (demoAdapter.demoGetMyAppointments as jest.Mock).mockResolvedValue([]);
  (demoAdapter.demoCreateAppointment as jest.Mock).mockResolvedValue({ appointment_id: 'a1' });
  (demoAdapter.demoGetAppointmentById as jest.Mock).mockResolvedValue({ appointment_id: 'a1' });
  (demoAdapter.demoCancelAppointment as jest.Mock).mockResolvedValue({ appointment_id: 'a1' });
  (demoAdapter.demoGetTimeSlots as jest.Mock).mockResolvedValue([]);
  (demoAdapter.demoGetMyQueue as jest.Mock).mockResolvedValue([]);

  await getMyAppointments();
  await createAppointment(input);
  await getAppointmentById('a1');
  await cancelAppointment('a1');
  await getTimeSlots('d1', '2026-09-01');
  await getMyQueue();

  expect(demoAdapter.demoGetMyAppointments).toHaveBeenCalledTimes(1);
  expect(demoAdapter.demoCreateAppointment).toHaveBeenCalledWith(input);
  expect(demoAdapter.demoGetAppointmentById).toHaveBeenCalledWith('a1');
  expect(demoAdapter.demoCancelAppointment).toHaveBeenCalledWith('a1');
  expect(demoAdapter.demoGetTimeSlots).toHaveBeenCalledWith('d1', '2026-09-01');
  expect(demoAdapter.demoGetMyQueue).toHaveBeenCalledTimes(1);
  expect(apiRequest).not.toHaveBeenCalled();
});

test('a real appointment API failure rejects without falling back to demo data', async () => {
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));

  await expect(getMyAppointments()).rejects.toThrow('network down');

  expect(demoAdapter.demoGetMyAppointments).not.toHaveBeenCalled();
});
