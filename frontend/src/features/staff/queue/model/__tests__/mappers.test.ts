import { mapQueueEntry } from '../mappers';
import type { RawStaffQueueEntry } from '../types';

const rawEntry = (overrides: Partial<RawStaffQueueEntry> = {}): RawStaffQueueEntry => ({
  queue_id: 'q1',
  hospital_id: 'h1',
  doctor_id: 'd1',
  appointment_id: 'a1',
  token_number: 5,
  queue_status: 'WAITING',
  appointment: {
    patient: { patient_id: 'p1', user: { user_id: 'u1', full_name: 'Bilal Ahmed' } },
    doctor: { doctor_id: 'd1', name: 'Dr. Sana' },
  },
  ...overrides,
});

test('resolves queue patient name from appointment.patient.user.full_name', () => {
  const mapped = mapQueueEntry(rawEntry());

  expect(mapped.patient?.full_name).toBe('Bilal Ahmed');
});

test('resolves queue doctor name from appointment.doctor.name', () => {
  const mapped = mapQueueEntry(rawEntry());

  expect(mapped.doctor?.name).toBe('Dr. Sana');
});

test('does not report unknown patient when a real patient is present', () => {
  const mapped = mapQueueEntry(rawEntry());

  expect(mapped.patient).not.toBeNull();
});

test('falls back to null patient when the backend appointment has no patient', () => {
  const mapped = mapQueueEntry(rawEntry({ appointment: { patient: null, doctor: { doctor_id: 'd1', name: 'Dr. Sana' } } }));

  expect(mapped.patient).toBeNull();
});

test('falls back to null doctor when the backend appointment has no doctor', () => {
  const mapped = mapQueueEntry(
    rawEntry({ appointment: { patient: { patient_id: 'p1', user: { user_id: 'u1', full_name: 'Bilal Ahmed' } }, doctor: null } })
  );

  expect(mapped.doctor).toBeNull();
});

test('falls back to null patient/doctor when the appointment itself is missing', () => {
  const mapped = mapQueueEntry(rawEntry({ appointment: null }));

  expect(mapped.patient).toBeNull();
  expect(mapped.doctor).toBeNull();
});
