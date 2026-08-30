import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import { useLocationSelector } from '../../../../core/location/useLocationSelector';
import { findDoctors } from '../../model/adapters/findDoctorsAdapter';
import { useFindDoctorViewModel } from '../useFindDoctorViewModel';

jest.mock('../../../../core/location/useLocationSelector');
jest.mock('../../model/adapters/findDoctorsAdapter');

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

test('searches doctors within the selected manual location scope', async () => {
  (findDoctors as jest.Mock).mockResolvedValue([
    {
      doctor_id: 'd1',
      hospital_id: 'h1',
      department_id: 'dep1',
      name: 'Dr. Ali',
      is_active: true,
      hospital: { hospital_id: 'h1', name: 'City Hospital' },
      department: { department_id: 'dep1', name: 'Cardiology' },
      schedules: [],
    },
  ]);

  const { result } = await renderHook(() => useFindDoctorViewModel(), { wrapper });

  await act(() => {
    result.current.setQuery('Ali');
  });

  await waitFor(() => expect(result.current.doctors).toHaveLength(1));
  expect(findDoctors).toHaveBeenCalledWith('Ali', {
    mode: 'manual',
    coordinates: null,
    manualCity: 'Karachi',
  });
});
