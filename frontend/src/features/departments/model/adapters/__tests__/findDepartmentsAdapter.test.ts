import {
  getHospitals,
  getHospitalsNearby,
  searchHospitalsByCity,
} from '../../../../hospitals/model/api';
import { getDepartmentsByHospital } from '../../api';
import { findDepartments } from '../findDepartmentsAdapter';

jest.mock('../../../../hospitals/model/api');
jest.mock('../../api');

beforeEach(() => {
  jest.clearAllMocks();
});

const noLocation = { mode: 'manual' as const, coordinates: null, manualCity: '' };

test('findDepartments scopes to all hospitals and filters active departments by name', async () => {
  (getHospitals as jest.Mock).mockResolvedValue([{ hospital_id: 'h1' }]);
  (getDepartmentsByHospital as jest.Mock).mockResolvedValue([
    { department_id: 'dep1', hospital_id: 'h1', name: 'Cardiology', is_active: true },
    { department_id: 'dep2', hospital_id: 'h1', name: 'Cardiac Archive', is_active: false },
  ]);

  const result = await findDepartments('card', noLocation);

  expect(getHospitals).toHaveBeenCalled();
  expect(result).toEqual([expect.objectContaining({ department_id: 'dep1' })]);
});

test('findDepartments scopes to GPS-nearby hospitals when GPS location is set', async () => {
  (getHospitalsNearby as jest.Mock).mockResolvedValue([{ hospital_id: 'h1' }]);
  (getDepartmentsByHospital as jest.Mock).mockResolvedValue([
    { department_id: 'dep1', hospital_id: 'h1', name: 'Cardiology', is_active: true },
  ]);

  await findDepartments('cardio', {
    mode: 'gps',
    coordinates: { latitude: 24.86, longitude: 67 },
    manualCity: '',
  });

  expect(getHospitalsNearby).toHaveBeenCalledWith({ latitude: 24.86, longitude: 67 });
  expect(getHospitals).not.toHaveBeenCalled();
});

test('findDepartments scopes to a manually searched city when set', async () => {
  (searchHospitalsByCity as jest.Mock).mockResolvedValue([{ hospital_id: 'h1' }]);
  (getDepartmentsByHospital as jest.Mock).mockResolvedValue([
    { department_id: 'dep1', hospital_id: 'h1', name: 'Cardiology', is_active: true },
  ]);

  const result = await findDepartments('cardio', {
    mode: 'manual',
    coordinates: null,
    manualCity: 'Karachi',
  });

  expect(searchHospitalsByCity).toHaveBeenCalledWith('Karachi');
  expect(result).toEqual([expect.objectContaining({ department_id: 'dep1' })]);
});
