import React from 'react';
import { Alert } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../../core/query/testUtils';
import { useHospitalAuth } from '../../../../../providers/HospitalAuthProvider';
import { createDepartment, deactivateDepartment, getDepartments, updateDepartment } from '../../model/api';
import { useDepartmentsViewModel } from '../useDepartmentsViewModel';

jest.mock('../../../../../providers/HospitalAuthProvider');
jest.mock('../../model/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (useHospitalAuth as jest.Mock).mockReturnValue({
    hospitalUser: { hospital: { hospital_id: 'h1' } },
  });
});

test('loads departments for the admin hospital', async () => {
  (getDepartments as jest.Mock).mockResolvedValue([
    { department_id: 'd1', hospital_id: 'h1', name: 'Cardiology', is_active: true },
  ]);

  const { result } = await renderHook(() => useDepartmentsViewModel(), { wrapper });

  await waitFor(() => expect(result.current.departments).toHaveLength(1));
  expect(getDepartments).toHaveBeenCalledWith('h1');
});

test('creates a department and closes the form on success', async () => {
  (getDepartments as jest.Mock).mockResolvedValue([]);
  (createDepartment as jest.Mock).mockResolvedValue({ department_id: 'd2', hospital_id: 'h1', name: 'Neurology', is_active: true });

  const { result } = await renderHook(() => useDepartmentsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(() => result.current.openCreate());
  expect(result.current.formOpen).toBe(true);

  await act(() => {
    result.current.setValue('name', 'Neurology');
  });

  await act(async () => {
    await result.current.onSubmit();
  });

  expect(createDepartment).toHaveBeenCalledWith({ hospital_id: 'h1', name: 'Neurology', description: '' });
  expect(result.current.formOpen).toBe(false);
});

test('shows the backend message when create fails', async () => {
  (getDepartments as jest.Mock).mockResolvedValue([]);
  (createDepartment as jest.Mock).mockRejectedValue(new Error('Department name already exists'));

  const { result } = await renderHook(() => useDepartmentsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(() => result.current.openCreate());
  await act(() => {
    result.current.setValue('name', 'Cardiology');
  });

  await act(async () => {
    await result.current.onSubmit();
  });

  expect(result.current.apiError).toBe('Department name already exists');
  expect(result.current.formOpen).toBe(true);
});

test('confirmDeactivate asks for confirmation then deactivates on confirm', async () => {
  const department = { department_id: 'd1', hospital_id: 'h1', name: 'Cardiology', is_active: true };
  (getDepartments as jest.Mock).mockResolvedValue([department]);
  (deactivateDepartment as jest.Mock).mockResolvedValue({ ...department, is_active: false });
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
    const confirmButton = buttons?.find((b) => b.style === 'destructive');
    confirmButton?.onPress?.();
  });

  const { result } = await renderHook(() => useDepartmentsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.departments).toHaveLength(1));

  await act(() => result.current.confirmDeactivate(department));

  expect(alertSpy).toHaveBeenCalled();
  await waitFor(() => expect(deactivateDepartment).toHaveBeenCalledWith('d1'));
});
