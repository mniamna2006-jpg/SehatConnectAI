import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import * as api from '../../model/api';
import type { ConversationSummary } from '../../model/types';
import { useAiHistoryViewModel } from '../useAiHistoryViewModel';

jest.mock('../../model/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

const conversation = (overrides: Partial<ConversationSummary> = {}): ConversationSummary => ({
  conversation_id: 'c1',
  title: 'Chest pain',
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
  message_count: 2,
  latest_message: { message_id: 'm2', sender: 'AI', message: 'Please see a doctor.', created_at: '2026-08-01T00:00:01.000Z' },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  (api.getAiHistory as jest.Mock).mockResolvedValue([conversation()]);
  (api.deleteAiConversation as jest.Mock).mockResolvedValue(undefined);
});

test('loads conversations from the API', async () => {
  const { result } = await renderHook(() => useAiHistoryViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.conversations).toHaveLength(1);
  expect(result.current.conversations[0].conversation_id).toBe('c1');
});

test('exposes an error state when the list request fails', async () => {
  (api.getAiHistory as jest.Mock).mockRejectedValue(new Error('down'));
  const { result } = await renderHook(() => useAiHistoryViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.isError).toBe(true);
});

test('reports an empty history safely', async () => {
  (api.getAiHistory as jest.Mock).mockResolvedValue([]);
  const { result } = await renderHook(() => useAiHistoryViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.conversations).toEqual([]);
});

test('onDelete removes a conversation and refetches the list', async () => {
  const { result } = await renderHook(() => useAiHistoryViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    await result.current.onDelete('c1');
  });

  expect(api.deleteAiConversation).toHaveBeenCalledWith('c1');
});

test('surfaces a visible error when deletion fails, instead of failing silently', async () => {
  (api.deleteAiConversation as jest.Mock).mockRejectedValue(new Error('offline'));
  const { result } = await renderHook(() => useAiHistoryViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    void result.current.onDelete('c1');
  });

  await waitFor(() => expect(result.current.hasDeleteError).toBe(true));
});
