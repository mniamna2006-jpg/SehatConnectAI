import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useFindHospitalViewModel } from '../useFindHospitalViewModel';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import * as api from '../../model/api';

jest.mock('../../model/api');
jest.mock('expo-location');

const wrapper = ({ children }: { children: React.ReactNode }) => <TestQueryProvider>{children}</TestQueryProvider>;

test('defaults to listing all hospitals when no location is selected', async () => {
  (api.getHospitals as jest.Mock).mockResolvedValue([{ hospital_id: 'h1', name: 'City Hospital' }]);
  const { result } = await renderHook(() => useFindHospitalViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(api.getHospitals).toHaveBeenCalled();
  expect(result.current.hospitals).toHaveLength(1);
});
