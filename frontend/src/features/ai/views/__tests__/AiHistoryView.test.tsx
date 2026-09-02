import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ConversationSummary } from '../../model/types';
import { useAiHistoryViewModel } from '../../viewmodels/useAiHistoryViewModel';
import { AiHistoryView } from '../AiHistoryView';

jest.mock('../../viewmodels/useAiHistoryViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

const conversation = (overrides: Partial<ConversationSummary> = {}): ConversationSummary => ({
  conversation_id: 'c1',
  title: 'Chest pain',
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
  message_count: 2,
  latest_message: { message_id: 'm2', sender: 'AI', message: 'Please see a doctor.', created_at: '2026-08-01T00:00:01.000Z' },
  ...overrides,
});

const baseVm = {
  conversations: [] as ConversationSummary[],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  onDelete: jest.fn(),
  isDeleting: jest.fn().mockReturnValue(false),
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('shows a loading state while history is loading', async () => {
  (useAiHistoryViewModel as jest.Mock).mockReturnValue({ ...baseVm, isLoading: true });
  await render(<AiHistoryView />);

  expect(screen.getByText('Loading…')).toBeOnTheScreen();
});

test('shows an error state with retry when the request fails', async () => {
  (useAiHistoryViewModel as jest.Mock).mockReturnValue({ ...baseVm, isError: true });
  await render(<AiHistoryView />);

  expect(screen.getByText("We couldn't load your history.")).toBeOnTheScreen();
  fireEvent.press(screen.getByText('Try again'));
  expect(baseVm.refetch).toHaveBeenCalled();
});

test('shows an empty state when there are no conversations', async () => {
  (useAiHistoryViewModel as jest.Mock).mockReturnValue({ ...baseVm });
  await render(<AiHistoryView />);

  expect(screen.getByText('No conversations yet')).toBeOnTheScreen();
});

test('renders a conversation title, preview and message count', async () => {
  (useAiHistoryViewModel as jest.Mock).mockReturnValue({ ...baseVm, conversations: [conversation()] });
  await render(<AiHistoryView />);

  expect(screen.getByText('Chest pain')).toBeOnTheScreen();
  expect(screen.getByText('Please see a doctor.')).toBeOnTheScreen();
  expect(screen.getByText(/2 messages/)).toBeOnTheScreen();
});

test('tapping a conversation resumes it on the chat route', async () => {
  (useAiHistoryViewModel as jest.Mock).mockReturnValue({ ...baseVm, conversations: [conversation()] });
  await render(<AiHistoryView />);

  fireEvent.press(screen.getByText('Chest pain'));
  expect(router.push).toHaveBeenCalledWith('/ai-chat?conversationId=c1');
});

test('deleting asks for confirmation before calling onDelete', async () => {
  const vm = { ...baseVm, conversations: [conversation()] };
  (useAiHistoryViewModel as jest.Mock).mockReturnValue(vm);
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    const destructive = buttons?.find((button) => button.style === 'destructive');
    destructive?.onPress?.();
  });

  await render(<AiHistoryView />);
  fireEvent.press(screen.getByLabelText('Delete Chest pain'));

  expect(alertSpy).toHaveBeenCalled();
  expect(vm.onDelete).toHaveBeenCalledWith('c1');
});
