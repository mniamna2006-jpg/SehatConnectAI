import { apiRequest } from '../../../core/api/client';
import type { PreferredLanguage } from '../../../shared/types/api';
import type { ChatResponse, ConversationDetail, ConversationSummary } from './types';

export function sendChatMessage(input: {
  message: string;
  language: PreferredLanguage;
  conversation_id?: string;
}): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/api/ai/chat', { method: 'POST', body: input });
}

export function getAiHistory(): Promise<ConversationSummary[]> {
  return apiRequest<ConversationSummary[]>('/api/ai/history');
}

export function getAiConversation(conversationId: string): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/api/ai/history/${conversationId}`);
}

export function deleteAiConversation(conversationId: string): Promise<void> {
  return apiRequest<void>(`/api/ai/history/${conversationId}`, { method: 'DELETE' });
}
