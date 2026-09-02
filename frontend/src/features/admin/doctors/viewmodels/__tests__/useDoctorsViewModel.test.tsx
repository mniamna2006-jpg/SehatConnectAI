import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { TestQueryProvider } from '../../../../../core/query/testUtils';
import { useHospitalAuth } from '../../../../../providers/HospitalAuthProvider';
import { getDepartments } from '../../../departments/model/api';
import { createDoctor, deactivateDoctor, getDoctors, updateDoctor } from '../../model/api';
import { useDoctorsViewModel } from '../useDoctorsViewModel';

jest.mock('../../../../../providers/HospitalAuthProvider');
jest.mock('../../../departments/model/api');
jest.mock('../../model/api');
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

const department = {
  department_id: 'department-1',
  hospital_id: 'hospital-1',
  name: 'Cardiology',
  description: null,
  is_active: true,
};

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

beforeEach(() => {
  jest.clearAllMocks();
  (useHospitalAuth as jest.Mock).mockReturnValue({
    hospitalUser: { hospital: { hospital_id: 'hospital-1' } },
  });
  (getDepartments as jest.Mock).mockResolvedValue([department]);
  (getDoctors as jest.Mock).mockResolvedValue([doctor]);
});

test('loads doctors and department choices for only the admin hospital', async () => {
  const { result } = await renderHook(() => useDoctorsViewModel(), { wrapper });

  await waitFor(() => expect(result.current.doctors).toHaveLength(1));
  expect(getDoctors).toHaveBeenCalledWith('hospital-1');
  expect(getDepartments).toHaveBeenCalledWith('hospital-1');
  expect(result.current.departments).toEqual([department]);
});

test('creates a doctor with authenticated hospital and selected department IDs', async () => {
  (createDoctor as jest.Mock).mockResolvedValue(doctor);
  const { result } = await renderHook(() => useDoctorsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(() => result.current.openCreate());
  await act(() => {
    result.current.setValue('department_id', 'department-1');
    result.current.setValue('name', 'Dr. Amina Shah');
    result.current.setValue('specialization', 'Cardiology');
    result.current.setValue('license_number', 'PMC-1001');
    result.current.setValue('consultation_fee', '2500');
  });
  await act(async () => result.current.onSubmit());

  expect(createDoctor).toHaveBeenCalledWith(expect.objectContaining({
    hospital_id: 'hospital-1',
    department_id: 'department-1',
    consultation_fee: 2500,
  }));
  expect(result.current.successMessage).toBe('Doctor created.');
  expect(result.current.formOpen).toBe(false);
});

test('edits only changed doctor fields', async () => {
  (updateDoctor as jest.Mock).mockResolvedValue({ ...doctor, bio: 'Updated bio' });
  const { result } = await renderHook(() => useDoctorsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.doctors).toHaveLength(1));

  await act(() => result.current.openEdit(doctor));
  await act(() => result.current.setValue('bio', 'Updated bio'));
  await act(async () => result.current.onSubmit());

  expect(updateDoctor).toHaveBeenCalledWith('doctor-1', { bio: 'Updated bio' });
  expect(result.current.successMessage).toBe('Doctor updated.');
});

test('keeps the doctor form open and surfaces backend create errors', async () => {
  (createDoctor as jest.Mock).mockRejectedValue(new Error('License number already exists'));
  const { result } = await renderHook(() => useDoctorsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(() => result.current.openCreate());
  await act(() => {
    result.current.setValue('department_id', 'department-1');
    result.current.setValue('name', 'Dr. Amina Shah');
    result.current.setValue('specialization', 'Cardiology');
    result.current.setValue('license_number', 'PMC-1001');
  });
  await act(async () => result.current.onSubmit());

  expect(result.current.apiError).toBe('License number already exists');
  expect(result.current.formOpen).toBe(true);
});

test('deactivates only after confirmation and reports success', async () => {
  (deactivateDoctor as jest.Mock).mockResolvedValue({ ...doctor, is_active: false });
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((button) => button.style === 'destructive')?.onPress?.();
  });
  const { result } = await renderHook(() => useDoctorsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.doctors).toHaveLength(1));

  await act(() => result.current.confirmDeactivate(doctor));

  await waitFor(() => expect(deactivateDoctor).toHaveBeenCalledWith('doctor-1'));
  await waitFor(() => expect(result.current.successMessage).toBe('Doctor deactivated.'));
});

test('surfaces a backend deactivation failure', async () => {
  (deactivateDoctor as jest.Mock).mockRejectedValue(new Error('Doctor has active appointments'));
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((button) => button.style === 'destructive')?.onPress?.();
  });
  const { result } = await renderHook(() => useDoctorsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.doctors).toHaveLength(1));

  await act(() => result.current.confirmDeactivate(doctor));

  await waitFor(() => expect(result.current.apiError).toBe('Doctor has active appointments'));
});

test('opens schedules for the selected real doctor ID', async () => {
  const { result } = await renderHook(() => useDoctorsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.doctors).toHaveLength(1));

  await act(() => result.current.openSchedules(doctor));

  expect(router.push).toHaveBeenCalledWith({
    pathname: '/admin/doctors/[doctorId]/schedules',
    params: { doctorId: 'doctor-1', doctorName: 'Dr. Amina Shah' },
  });
});
