import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import * as api from '../../model/api';
import type { ChatResponse, ConversationDetail } from '../../model/types';
import { useAiChatViewModel } from '../useAiChatViewModel';

jest.mock('../../model/api');
jest.mock('../../../../providers/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'ENGLISH', isRTL: false }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

const chatResponse = (overrides: Partial<ChatResponse> = {}): ChatResponse => ({
  conversation_id: 'c1',
  message: 'It sounds like you should see Cardiology.',
  is_emergency: false,
  recommended_department: null,
  doctors: [],
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  (api.sendChatMessage as jest.Mock).mockResolvedValue(chatResponse());
});

test('sends a message and appends the user + AI messages', async () => {
  const { result } = await renderHook(() => useAiChatViewModel(), { wrapper });

  await act(() => result.current.setInput('I have chest pain'));
  await act(async () => {
    await result.current.onSend();
  });

  expect(api.sendChatMessage).toHaveBeenCalledWith({
    message: 'I have chest pain',
    language: 'ENGLISH',
    conversation_id: undefined,
  });
  expect(result.current.messages).toHaveLength(2);
  expect(result.current.messages[0]).toMatchObject({ sender: 'USER', text: 'I have chest pain' });
  expect(result.current.messages[1]).toMatchObject({ sender: 'AI', text: chatResponse().message });
  expect(result.current.input).toBe('');
});

test('continues an existing conversation using its conversation_id on the next send', async () => {
  const { result } = await renderHook(() => useAiChatViewModel(), { wrapper });

  await act(() => result.current.setInput('first'));
  await act(async () => {
    await result.current.onSend();
  });

  await act(() => result.current.setInput('second'));
  await act(async () => {
    await result.current.onSend();
  });

  expect(api.sendChatMessage).toHaveBeenLastCalledWith({
    message: 'second',
    language: 'ENGLISH',
    conversation_id: 'c1',
  });
});

test('does not send an empty or whitespace-only message', async () => {
  const { result } = await renderHook(() => useAiChatViewModel(), { wrapper });

  await act(() => result.current.setInput('   '));
  await act(async () => {
    await result.current.onSend();
  });

  expect(api.sendChatMessage).not.toHaveBeenCalled();
  expect(result.current.messages).toHaveLength(0);
});

test('keeps the typed input and reports an error when sending fails', async () => {
  (api.sendChatMessage as jest.Mock).mockRejectedValue(new Error('down'));
  const { result } = await renderHook(() => useAiChatViewModel(), { wrapper });

  await act(() => result.current.setInput('I have chest pain'));
  await act(async () => {
    await result.current.onSend();
  });

  expect(result.current.input).toBe('I have chest pain');
  expect(result.current.sendError).toBeTruthy();
  expect(result.current.messages).toHaveLength(0);
});

test('surfaces the emergency flag and recommendation on the AI message', async () => {
  (api.sendChatMessage as jest.Mock).mockResolvedValue(
    chatResponse({
      is_emergency: true,
      recommended_department: {
        department_id: 'd1',
        name: 'Cardiology',
        hospital_id: 'h1',
        hospital_name: 'City Hospital',
        city: 'Lahore',
      },
      doctors: [
        {
          doctor_id: 'doc1',
          name: 'Dr. Ali',
          specialization: 'Cardiologist',
          qualification: 'MBBS',
          consultation_fee: 2000,
          department_id: 'd1',
          department_name: 'Cardiology',
          hospital_id: 'h1',
          hospital_name: 'City Hospital',
          city: 'Lahore',
        },
      ],
    })
  );
  const { result } = await renderHook(() => useAiChatViewModel(), { wrapper });

  await act(() => result.current.setInput('severe chest pain'));
  await act(async () => {
    await result.current.onSend();
  });

  const aiMessage = result.current.messages[1];
  expect(aiMessage.is_emergency).toBe(true);
  expect(aiMessage.recommendation?.recommended_department?.name).toBe('Cardiology');
  expect(aiMessage.recommendation?.doctors).toHaveLength(1);
});

test('resuming a conversation loads its stored message history', async () => {
  const detail: ConversationDetail = {
    conversation_id: 'c1',
    title: 'Chest pain',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z',
    messages: [
      { message_id: 'm1', sender: 'USER', message: 'I have chest pain', language: 'ENGLISH', is_emergency: false, created_at: '2026-08-01T00:00:00.000Z', recommendation: { recommended_department: null, doctors: [] } },
      { message_id: 'm2', sender: 'AI', message: 'Please seek care.', language: 'ENGLISH', is_emergency: true, created_at: '2026-08-01T00:00:01.000Z', recommendation: { recommended_department: null, doctors: [] } },
    ],
  };
  (api.getAiConversation as jest.Mock).mockResolvedValue(detail);

  const { result } = await renderHook(() => useAiChatViewModel('c1'), { wrapper });

  await waitFor(() => expect(result.current.messages).toHaveLength(2));
  expect(result.current.messages[1]).toMatchObject({ sender: 'AI', is_emergency: true });
});
