import { apiRequest } from '../../../../core/api/client';
import { deleteAiConversation, getAiConversation, getAiHistory, sendChatMessage } from '../api';

jest.mock('../../../../core/api/client');

beforeEach(() => {
  jest.clearAllMocks();
});

test('sendChatMessage calls POST /api/ai/chat with message/language/conversation_id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ conversation_id: 'c1' });
  await sendChatMessage({ message: 'fever', language: 'ENGLISH', conversation_id: 'c1' });
  expect(apiRequest).toHaveBeenCalledWith('/api/ai/chat', {
    method: 'POST',
    body: { message: 'fever', language: 'ENGLISH', conversation_id: 'c1' },
  });
});

test('sendChatMessage omits conversation_id for a new conversation', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ conversation_id: 'c1' });
  await sendChatMessage({ message: 'fever', language: 'ENGLISH' });
  expect(apiRequest).toHaveBeenCalledWith('/api/ai/chat', {
    method: 'POST',
    body: { message: 'fever', language: 'ENGLISH' },
  });
});

test('getAiHistory calls GET /api/ai/history', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getAiHistory();
  expect(apiRequest).toHaveBeenCalledWith('/api/ai/history');
});

test('getAiConversation calls GET /api/ai/history/:id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ conversation_id: 'c1', messages: [] });
  await getAiConversation('c1');
  expect(apiRequest).toHaveBeenCalledWith('/api/ai/history/c1');
});

test('deleteAiConversation calls DELETE /api/ai/history/:id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue(undefined);
  await deleteAiConversation('c1');
  expect(apiRequest).toHaveBeenCalledWith('/api/ai/history/c1', { method: 'DELETE' });
});

test('an AI API failure rejects', async () => {
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));
  await expect(getAiHistory()).rejects.toThrow('network down');
});
