import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthProvider';
import * as api from '../../features/auth/model/api';
import * as secureStore from '../../core/storage/secureStore';
import { TestQueryProvider } from '../../core/query/testUtils';

jest.mock('../../features/auth/model/api');
jest.mock('../../core/storage/secureStore');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>
    <AuthProvider>{children}</AuthProvider>
  </TestQueryProvider>
);

test('starts with no user, loads existing token+session on mount', async () => {
  (secureStore.getToken as jest.Mock).mockResolvedValue('existing-token');
  (api.getMe as jest.Mock).mockResolvedValue({ user_id: '1', full_name: 'A', role: 'PATIENT', preferred_language: 'ENGLISH' });

  const { result } = await renderHook(() => useAuth(), { wrapper });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.user?.user_id).toBe('1');
});

test('login stores the token and sets the user', async () => {
  (secureStore.getToken as jest.Mock).mockResolvedValue(null);
  (api.login as jest.Mock).mockResolvedValue({
    token: 'new-token',
    user: { user_id: '2', full_name: 'B', role: 'PATIENT', preferred_language: 'ENGLISH' },
  });

  const { result } = await renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    await result.current.login({ email: 'b@b.com', password: 'secret1' });
  });

  expect(secureStore.setToken).toHaveBeenCalledWith('new-token');
  expect(result.current.user?.user_id).toBe('2');
});

test('logout clears the token and the user', async () => {
  (secureStore.getToken as jest.Mock).mockResolvedValue(null);
  const { result } = await renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    await result.current.logout();
  });

  expect(secureStore.clearToken).toHaveBeenCalled();
  expect(result.current.user).toBeNull();
});
