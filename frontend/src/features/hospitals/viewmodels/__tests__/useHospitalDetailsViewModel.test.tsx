import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useHospitalDetailsViewModel } from '../useHospitalDetailsViewModel';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import * as api from '../../model/api';

jest.mock('../../model/api');

const wrapper = ({ children }: { children: React.ReactNode }) => <TestQueryProvider>{children}</TestQueryProvider>;

test('fetches the hospital by id', async () => {
  (api.getHospitalById as jest.Mock).mockResolvedValue({ hospital_id: 'h1', name: 'City Hospital', working_hours: [], departments: [], doctors: [] });
  const { result } = await renderHook(() => useHospitalDetailsViewModel('h1'), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(api.getHospitalById).toHaveBeenCalledWith('h1');
  expect(result.current.hospital?.name).toBe('City Hospital');
});
