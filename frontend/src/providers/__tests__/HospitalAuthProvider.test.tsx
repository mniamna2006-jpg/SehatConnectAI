import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { apiRequest } from '../../core/api/client';
import { createTestQueryClient } from '../../core/query/testUtils';
import * as secureStore from '../../core/storage/secureStore';
import * as hospitalApi from '../../features/hospitalAuth/model/api';
import { HospitalAuthProvider, useHospitalAuth } from '../HospitalAuthProvider';

jest.mock('../../core/storage/secureStore');
jest.mock('../../features/hospitalAuth/model/api');

let testQueryClient = createTestQueryClient();

const adminUser = {
  user_id: 'admin-1',
  full_name: 'Admin User',
  email: 'admin@hospital.test',
  phone: null,
  role: 'ADMIN' as const,
  hospital: {
    hospital_id: 'hospital-1',
    name: 'City Hospital',
    facility_type: 'HOSPITAL',
    city: 'Karachi',
  },
  department: null,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={testQueryClient}>
    <HospitalAuthProvider>{children}</HospitalAuthProvider>
  </QueryClientProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  testQueryClient = createTestQueryClient();
  (secureStore.getHospitalToken as jest.Mock).mockResolvedValue(null);
});

test('restores a hospital session from the hospital token', async () => {
  (secureStore.getHospitalToken as jest.Mock).mockResolvedValue('existing-hospital-token');
  (hospitalApi.getHospitalMe as jest.Mock).mockResolvedValue(adminUser);

  const { result } = await renderHook(() => useHospitalAuth(), { wrapper });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.hospitalUser).toEqual(adminUser);
  expect(hospitalApi.getHospitalMe).toHaveBeenCalledTimes(1);
});

test('hospital login stores only the hospital token and exposes the returned user', async () => {
  (hospitalApi.loginHospital as jest.Mock).mockResolvedValue({
    token: 'new-hospital-token',
    user: adminUser,
  });
  const { result } = await renderHook(() => useHospitalAuth(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    await result.current.login({
      email: 'admin@hospital.test',
      password: 'secret1',
    });
  });

  expect(secureStore.setHospitalToken).toHaveBeenCalledWith('new-hospital-token');
  expect(secureStore.setToken).not.toHaveBeenCalled();
  expect(result.current.hospitalUser).toEqual(adminUser);
});

test('a hospital 401 clears only hospital state and hospital query data', async () => {
  (secureStore.getHospitalToken as jest.Mock).mockResolvedValue('existing-hospital-token');
  (hospitalApi.getHospitalMe as jest.Mock).mockResolvedValue(adminUser);
  const { result } = await renderHook(() => useHospitalAuth(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  testQueryClient.setQueryDefaults(['admin', 'dashboard'], { gcTime: Infinity });
  testQueryClient.setQueryDefaults(['profile'], { gcTime: Infinity });
  testQueryClient.setQueryData(['admin', 'dashboard'], 'hospital-secret');
  testQueryClient.setQueryData(['profile'], 'patient-secret');
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 401,
    text: async () => JSON.stringify({ success: false, message: 'Token expired' }),
  } as Response);

  await act(async () => {
    await expect(
      apiRequest('/api/admin/dashboard', { scope: 'hospital' })
    ).rejects.toThrow('Token expired');
  });

  expect(secureStore.clearHospitalToken).toHaveBeenCalledTimes(1);
  expect(secureStore.clearToken).not.toHaveBeenCalled();
  expect(result.current.hospitalUser).toBeNull();
  expect(testQueryClient.getQueryData(['admin', 'dashboard'])).toBeUndefined();
  expect(testQueryClient.getQueryData(['profile'])).toBe('patient-secret');
});
