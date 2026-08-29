import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import { useLocationSelector } from '../../../../core/location/useLocationSelector';
import { findDepartments } from '../../model/adapters/findDepartmentsAdapter';
import { getDepartmentsByHospital } from '../../model/api';
import { useFindDepartmentViewModel } from '../useFindDepartmentViewModel';

jest.mock('../../../../core/location/useLocationSelector');
jest.mock('../../model/adapters/findDepartmentsAdapter');
jest.mock('../../model/api');

const selector = {
  mode: 'manual' as const,
  coordinates: null,
  manualCity: 'Karachi',
  permissionDenied: false,
  isRequestingGps: false,
  requestGpsLocation: jest.fn(),
  setManualCity: jest.fn(),
  reset: jest.fn(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (useLocationSelector as jest.Mock).mockReturnValue(selector);
});

test('searches departments within the selected manual location scope', async () => {
  (findDepartments as jest.Mock).mockResolvedValue([
    { department_id: 'dep1', hospital_id: 'h1', name: 'Cardiology', is_active: true },
  ]);
  const { result } = await renderHook(() => useFindDepartmentViewModel(), { wrapper });

  await act(() => {
    result.current.setQuery('cardio');
  });

  await waitFor(() => expect(result.current.departments).toHaveLength(1));
  expect(findDepartments).toHaveBeenCalledWith('cardio', {
    mode: 'manual',
    coordinates: null,
    manualCity: 'Karachi',
  });
});

test('with a hospitalId prefill, fetches that hospital departments directly and highlights the matching one, skipping GPS/manual discovery', async () => {
  (getDepartmentsByHospital as jest.Mock).mockResolvedValue([
    { department_id: 'dep1', hospital_id: 'h1', name: 'Cardiology', is_active: true },
    { department_id: 'dep2', hospital_id: 'h1', name: 'Neurology', is_active: true },
  ]);

  const { result } = await renderHook(
    () => useFindDepartmentViewModel({ hospitalId: 'h1', departmentId: 'dep2' }),
    { wrapper }
  );

  await waitFor(() => expect(result.current.departments).toHaveLength(2));
  expect(getDepartmentsByHospital).toHaveBeenCalledWith('h1');
  expect(findDepartments).not.toHaveBeenCalled();
  expect(result.current.isHospitalScoped).toBe(true);
  expect(result.current.highlightedDepartmentId).toBe('dep2');
});
