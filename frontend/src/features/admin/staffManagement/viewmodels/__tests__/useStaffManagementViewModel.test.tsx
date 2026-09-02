import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../../core/query/testUtils';
import { useHospitalAuth } from '../../../../../providers/HospitalAuthProvider';
import { createStaff, deactivateStaff, getStaff, updateStaff } from '../../model/api';
import { getDepartments } from '../../../departments/model/api';
import { useStaffManagementViewModel } from '../useStaffManagementViewModel';

jest.mock('../../../../../providers/HospitalAuthProvider');
jest.mock('../../model/api');
jest.mock('../../../departments/model/api');

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

const staff = {
  staff_id: 's1',
  hospital_id: 'h1',
  employee_id: 'E-1',
  position: 'Nurse',
  department_id: null,
  is_active: true,
  user: { user_id: 'u1', full_name: 'Ayesha Khan', email: 'ayesha@hospital.test', phone: null, is_active: true },
  department: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useHospitalAuth as jest.Mock).mockReturnValue({ hospitalUser: { hospital: { hospital_id: 'h1' } } });
  (getDepartments as jest.Mock).mockResolvedValue([]);
});

test('loads staff for the admin hospital', async () => {
  (getStaff as jest.Mock).mockResolvedValue([staff]);

  const { result } = await renderHook(() => useStaffManagementViewModel(), { wrapper });

  await waitFor(() => expect(result.current.staff).toHaveLength(1));
  expect(getStaff).toHaveBeenCalledWith('h1');
});

test('creates a staff member with the entered fields', async () => {
  (getStaff as jest.Mock).mockResolvedValue([]);
  (createStaff as jest.Mock).mockResolvedValue(staff);

  const { result } = await renderHook(() => useStaffManagementViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(() => result.current.openCreate());
  await act(() => {
    result.current.setValue('full_name', 'Ayesha Khan');
    result.current.setValue('employee_id', 'E-1');
    result.current.setValue('position', 'Nurse');
    result.current.setValue('email', 'ayesha@hospital.test');
    result.current.setValue('password', 'secret1');
  });

  await act(async () => {
    await result.current.onSubmit();
  });

  expect(createStaff).toHaveBeenCalledWith({
    hospital_id: 'h1',
    department_id: undefined,
    employee_id: 'E-1',
    position: 'Nurse',
    full_name: 'Ayesha Khan',
    email: 'ayesha@hospital.test',
    phone: undefined,
    password: 'secret1',
  });
  expect(result.current.formOpen).toBe(false);
  expect(result.current.successMessage).toBe('Staff member created.');
});

test('does not PATCH an unchanged staff member', async () => {
  (getStaff as jest.Mock).mockResolvedValue([staff]);

  const { result } = await renderHook(() => useStaffManagementViewModel(), { wrapper });
  await waitFor(() => expect(result.current.staff).toHaveLength(1));

  await act(() => result.current.openEdit(staff));
  await act(async () => result.current.onSubmit());

  expect(updateStaff).not.toHaveBeenCalled();
  expect(result.current.apiError).toBe('No staff changes to save.');
});

test('confirmDeactivate asks for confirmation then deactivates on confirm', async () => {
  (getStaff as jest.Mock).mockResolvedValue([staff]);
  (deactivateStaff as jest.Mock).mockResolvedValue({ ...staff, is_active: false });
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
    buttons?.find((button) => button.style === 'destructive')?.onPress?.();
  });

  const { result } = await renderHook(() => useStaffManagementViewModel(), { wrapper });
  await waitFor(() => expect(result.current.staff).toHaveLength(1));

  await act(() => result.current.confirmDeactivate(staff));

  expect(alertSpy).toHaveBeenCalled();
  await waitFor(() => expect(deactivateStaff).toHaveBeenCalledWith('s1'));
  await waitFor(() => expect(result.current.successMessage).toBe('Staff member deactivated.'));
});

test('surfaces the backend message when deactivation fails', async () => {
  (getStaff as jest.Mock).mockResolvedValue([staff]);
  (deactivateStaff as jest.Mock).mockRejectedValue(new Error('Cannot deactivate the last active staff member'));
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
    buttons?.find((button) => button.style === 'destructive')?.onPress?.();
  });

  const { result } = await renderHook(() => useStaffManagementViewModel(), { wrapper });
  await waitFor(() => expect(result.current.staff).toHaveLength(1));
  await act(() => result.current.confirmDeactivate(staff));

  await waitFor(() => expect(result.current.apiError).toBe('Cannot deactivate the last active staff member'));
});
