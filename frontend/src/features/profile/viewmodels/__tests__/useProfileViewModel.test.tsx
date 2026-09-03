import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useProfileViewModel } from '../useProfileViewModel';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import { useOptionalLocale } from '../../../../providers/LocaleProvider';
import { useAuth } from '../../../../providers/AuthProvider';
import * as api from '../../model/api';

jest.mock('../../model/api');
jest.mock('../../../../providers/LocaleProvider');
jest.mock('../../../../providers/AuthProvider', () => ({ useAuth: jest.fn(() => ({ logout: jest.fn() })) }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => <TestQueryProvider>{children}</TestQueryProvider>;

test('onLogout calls useAuth().logout and redirects to /login', async () => {
  const logout = jest.fn().mockResolvedValue(undefined);
  (useAuth as jest.Mock).mockReturnValue({ logout });
  (api.getProfile as jest.Mock).mockResolvedValue({ patient_id: '1', full_name: 'Ayesha', preferred_language: 'ENGLISH' });

  const { result } = await renderHook(() => useProfileViewModel(), { wrapper });
  await act(async () => {
    await result.current.onLogout();
  });

  expect(logout).toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith('/login');
});

test('starts in view mode, onEdit switches to edit mode, onSave PATCHes and returns to view mode', async () => {
  (api.getProfile as jest.Mock).mockResolvedValue({ patient_id: '1', full_name: 'Ayesha', preferred_language: 'ENGLISH' });
  (api.updateProfile as jest.Mock).mockResolvedValue({ patient_id: '1', full_name: 'Ayesha', city: 'Karachi', preferred_language: 'ENGLISH' });

  const { result } = await renderHook(() => useProfileViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.isEditing).toBe(false);

  await act(() => result.current.onEdit());
  expect(result.current.isEditing).toBe(true);

  await act(() => result.current.setValue('city', 'Karachi'));
  await act(async () => {
    await result.current.onSave();
  });

  expect(api.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ city: 'Karachi' }));
  await waitFor(() => expect(result.current.isEditing).toBe(false));
});

test('onSave sets saveError and does not throw when the mutation rejects', async () => {
  (api.getProfile as jest.Mock).mockResolvedValue({ patient_id: '1', full_name: 'Ayesha', preferred_language: 'ENGLISH' });
  (api.updateProfile as jest.Mock).mockRejectedValue(new Error('Network error'));

  const { result } = await renderHook(() => useProfileViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(() => result.current.onEdit());

  await expect(act(async () => {
    await result.current.onSave();
  })).resolves.not.toThrow();

  await waitFor(() => expect(result.current.saveError).toBeTruthy());
  expect(result.current.isEditing).toBe(true);
});

test('applies a saved preferred language immediately', async () => {
  const setLocale = jest.fn();
  (useOptionalLocale as jest.Mock).mockReturnValue({ setLocale });
  (api.getProfile as jest.Mock).mockResolvedValue({
    patient_id: '1',
    full_name: 'Ayesha',
    preferred_language: 'ENGLISH',
  });
  (api.updateProfile as jest.Mock).mockResolvedValue({
    patient_id: '1',
    full_name: 'Ayesha',
    preferred_language: 'URDU',
  });

  const { result } = await renderHook(() => useProfileViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(() => result.current.onEdit());
  await act(() => result.current.setValue('preferred_language', 'URDU'));
  await act(async () => {
    await result.current.onSave();
  });

  expect(setLocale).toHaveBeenCalledWith('URDU');
});
