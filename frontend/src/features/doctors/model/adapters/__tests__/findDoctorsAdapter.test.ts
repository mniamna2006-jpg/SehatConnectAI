import { findDoctors } from '../findDoctorsAdapter';
import { getHospitals, getHospitalsNearby, searchHospitalsByCity } from '../../../../hospitals/model/api';
import { getDoctorById, getDoctorsByHospital } from '../../api';

jest.mock('../../../../hospitals/model/api');
jest.mock('../../api');

beforeEach(() => {
  jest.clearAllMocks();
});

function mockDoctorDetail(doctorId: string) {
  (getDoctorById as jest.Mock).mockResolvedValue({
    doctor_id: doctorId,
    hospital_id: 'h1',
    department_id: 'dep1',
    name: 'Dr. Ali',
    specialization: 'Cardiology',
    is_active: true,
    hospital: { hospital_id: 'h1', name: 'City Hospital' },
    department: { department_id: 'dep1', name: 'Cardiology' },
    schedules: [
      {
        schedule_id: 'sch1',
        doctor_id: doctorId,
        day_of_week: 'MONDAY',
        start_time: '09:00',
        end_time: '12:00',
        appointment_duration: 30,
        is_active: true,
      },
    ],
  });
}

const noLocation = { mode: 'manual' as const, coordinates: null, manualCity: '' };

test('findDoctors scopes to all hospitals and filters by name/specialization when no location is set', async () => {
  (getHospitals as jest.Mock).mockResolvedValue([{ hospital_id: 'h1' }, { hospital_id: 'h2' }]);
  (getDoctorsByHospital as jest.Mock)
    .mockResolvedValueOnce([{ doctor_id: 'd1', name: 'Dr. Ali', specialization: 'Cardiology', is_active: true }])
    .mockResolvedValueOnce([{ doctor_id: 'd2', name: 'Dr. Sana', specialization: 'Dermatology', is_active: true }]);
  mockDoctorDetail('d1');

  const result = await findDoctors('cardio', noLocation);
  expect(getHospitals).toHaveBeenCalled();
  expect(getDoctorById).toHaveBeenCalledWith('d1');
  expect(result).toEqual([
    expect.objectContaining({
      doctor_id: 'd1',
      hospital: expect.objectContaining({ name: 'City Hospital' }),
      schedules: [expect.objectContaining({ day_of_week: 'MONDAY', start_time: '09:00' })],
    }),
  ]);
});

test('findDoctors scopes to GPS-nearby hospitals when GPS location is set', async () => {
  (getHospitalsNearby as jest.Mock).mockResolvedValue([{ hospital_id: 'h1' }]);
  (getDoctorsByHospital as jest.Mock).mockResolvedValue([
    { doctor_id: 'd1', name: 'Dr. Ali', specialization: 'Cardiology', is_active: true },
  ]);
  mockDoctorDetail('d1');

  const result = await findDoctors('ali', { mode: 'gps', coordinates: { latitude: 24.86, longitude: 67.0 }, manualCity: '' });
  expect(getHospitalsNearby).toHaveBeenCalledWith({ latitude: 24.86, longitude: 67.0 });
  expect(getHospitals).not.toHaveBeenCalled();
  expect(result).toEqual([expect.objectContaining({ doctor_id: 'd1' })]);
});

test('findDoctors scopes to a manually searched city when set', async () => {
  (searchHospitalsByCity as jest.Mock).mockResolvedValue([{ hospital_id: 'h1' }]);
  (getDoctorsByHospital as jest.Mock).mockResolvedValue([
    { doctor_id: 'd1', name: 'Dr. Ali', specialization: 'Cardiology', is_active: true },
  ]);
  mockDoctorDetail('d1');

  const result = await findDoctors('ali', { mode: 'manual', coordinates: null, manualCity: 'Karachi' });
  expect(searchHospitalsByCity).toHaveBeenCalledWith('Karachi');
  expect(result).toEqual([expect.objectContaining({ doctor_id: 'd1' })]);
});
