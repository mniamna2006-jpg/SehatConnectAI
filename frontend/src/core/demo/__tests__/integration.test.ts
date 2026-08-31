import { getMyAppointments, getMyQueue, getTimeSlots, createAppointment, cancelAppointment } from '../../../features/appointments/model/api';
import { login } from '../../../features/auth/model/api';
import { findDepartments } from '../../../features/departments/model/adapters/findDepartmentsAdapter';
import { findDoctors } from '../../../features/doctors/model/adapters/findDoctorsAdapter';
import { getHospitalById, searchHospitalsByCity } from '../../../features/hospitals/model/api';
import { getProfile, updateProfile } from '../../../features/profile/model/api';

const ORIGINAL_DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE;

beforeEach(() => {
  process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
});

afterEach(() => {
  process.env.EXPO_PUBLIC_DEMO_MODE = ORIGINAL_DEMO_MODE;
});

test('public Model APIs exercise the complete patient demo flow without network access', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch');

  const auth = await login({ email: 'demo@sehatconnect.test', password: 'Demo123!' });
  const hospitals = await searchHospitalsByCity('Gulshan-e-Iqbal, Karachi');
  const hospital = await getHospitalById(hospitals[0].hospital_id);
  const departments = await findDepartments('pedi', {
    mode: 'manual',
    coordinates: null,
    manualCity: 'Karachi',
  });
  const doctors = await findDoctors('pediatric', {
    mode: 'manual',
    coordinates: null,
    manualCity: 'Karachi',
  });
  const profile = await updateProfile({ city: 'Karachi' });
  const slots = await getTimeSlots(doctors[0].doctor_id, '2026-09-10');
  const created = await createAppointment({
    doctor_id: doctors[0].doctor_id,
    hospital_id: doctors[0].hospital_id,
    department_id: doctors[0].department_id,
    slot_id: slots.find((slot) => slot.status === 'AVAILABLE')!.slot_id,
    reason: 'End-to-end demo flow',
  });

  expect(auth.user.email).toBe('demo@sehatconnect.test');
  expect(hospital.departments[0].department_id).toBe(departments[0].department_id);
  expect(doctors[0].hospital.hospital_id).toBe(hospital.hospital_id);
  expect(doctors[0].schedules[0].start_time_12h).toMatch(/AM|PM/);
  expect((await getProfile()).city).toBe(profile.city);
  expect(await getMyAppointments()).toContainEqual(
    expect.objectContaining({
      appointment_id: created.appointment_id,
      appointment_date: '2026-09-10',
      appointment_time_12h: expect.stringMatching(/AM|PM/),
    })
  );
  expect(await getMyQueue()).toEqual([
    expect.objectContaining({ appointment_id: 'demo-appt-upcoming' }),
  ]);

  expect((await cancelAppointment(created.appointment_id)).status).toBe('CANCELLED');
  expect(fetchSpy).not.toHaveBeenCalled();
});
