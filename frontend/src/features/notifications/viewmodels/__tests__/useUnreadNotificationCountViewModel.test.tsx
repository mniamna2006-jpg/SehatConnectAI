import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import * as api from '../../model/api';
import { useUnreadNotificationCountViewModel } from '../useUnreadNotificationCountViewModel';

jest.mock('../../model/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
});

test('reports zero and no unread flag while loading or unset', async () => {
  (api.getUnreadNotificationCount as jest.Mock).mockResolvedValue({ count: 0 });
  const { result } = await renderHook(() => useUnreadNotificationCountViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.count).toBe(0);
  expect(result.current.hasUnread).toBe(false);
});

test('reports the real unread count and flags it as unread', async () => {
  (api.getUnreadNotificationCount as jest.Mock).mockResolvedValue({ count: 4 });
  const { result } = await renderHook(() => useUnreadNotificationCountViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.count).toBe(4);
  expect(result.current.hasUnread).toBe(true);
});

test('stays at zero unread on a fetch failure rather than showing a stale badge', async () => {
  (api.getUnreadNotificationCount as jest.Mock).mockRejectedValue(new Error('down'));
  const { result } = await renderHook(() => useUnreadNotificationCountViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.count).toBe(0);
  expect(result.current.hasUnread).toBe(false);
});
