import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useProfileViewModel } from '../useProfileViewModel';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import * as api from '../../model/api';

jest.mock('../../model/api');

const wrapper = ({ children }: { children: React.ReactNode }) => <TestQueryProvider>{children}</TestQueryProvider>;

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
