import { mapStaffTodayAppointments } from '../mappers';
import type { RawStaffTodayAppointments } from '../types';

const rawAppointment = (overrides: Partial<RawStaffTodayAppointments['appointments'][number]> = {}) => ({
  appointment_id: 'a1',
  appointment_date: '2026-09-02',
  appointment_time: '10:00',
  appointment_time_12h: '10:00 AM',
  status: 'BOOKED' as const,
  patient: {
    patient_id: 'p1',
    user: { user_id: 'u1', full_name: 'Bilal Ahmed', email: 'bilal@example.com', phone: '0300-1234567' },
  },
  doctor: { doctor_id: 'd1', name: 'Dr. Sana', specialization: 'Cardiology' },
  department: { department_id: 'dep1', name: 'Cardiology' },
  slot: { slot_id: 's1', start_time: '10:00', end_time: '10:30' },
  ...overrides,
});

test('resolves patient full_name from the real backend nesting (patient.user.full_name)', () => {
  const raw: RawStaffTodayAppointments = { date: '2026-09-02', total: 1, appointments: [rawAppointment()] };

  const mapped = mapStaffTodayAppointments(raw);

  expect(mapped.appointments[0].patient?.full_name).toBe('Bilal Ahmed');
});

test('resolves doctor name from the backend doctor object', () => {
  const raw: RawStaffTodayAppointments = { date: '2026-09-02', total: 1, appointments: [rawAppointment()] };

  const mapped = mapStaffTodayAppointments(raw);

  expect(mapped.appointments[0].doctor?.name).toBe('Dr. Sana');
});

test('does not report unknown patient when a real patient is present', () => {
  const raw: RawStaffTodayAppointments = { date: '2026-09-02', total: 1, appointments: [rawAppointment()] };

  const mapped = mapStaffTodayAppointments(raw);

  expect(mapped.appointments[0].patient).not.toBeNull();
});

test('falls back to null patient when the backend has no patient (true missing data)', () => {
  const raw: RawStaffTodayAppointments = {
    date: '2026-09-02',
    total: 1,
    appointments: [rawAppointment({ patient: null })],
  };

  const mapped = mapStaffTodayAppointments(raw);

  expect(mapped.appointments[0].patient).toBeNull();
});

test('falls back to null doctor when the backend has no doctor', () => {
  const raw: RawStaffTodayAppointments = {
    date: '2026-09-02',
    total: 1,
    appointments: [rawAppointment({ doctor: null })],
  };

  const mapped = mapStaffTodayAppointments(raw);

  expect(mapped.appointments[0].doctor).toBeNull();
});
