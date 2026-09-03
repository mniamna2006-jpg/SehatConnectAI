import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '../../../providers/LocaleProvider';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { getAiConversation, sendChatMessage } from '../model/api';
import type { ChatSender, RecommendedDepartment, RecommendedDoctor } from '../model/types';

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  is_emergency: boolean;
  recommendation: { recommended_department: RecommendedDepartment | null; doctors: RecommendedDoctor[] } | null;
}

export function useAiChatViewModel(initialConversationId?: string) {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const nextId = useRef(0);
  const localId = () => `local-${nextId.current++}`;

  const history = useQuery({
    queryKey: queryKeys.aiConversation(initialConversationId ?? ''),
    queryFn: () => getAiConversation(initialConversationId as string),
    enabled: Boolean(initialConversationId),
  });

  useEffect(() => {
    if (!history.data) return;
    setMessages(
      history.data.messages.map((message) => ({
        id: message.message_id,
        sender: message.sender,
        text: message.message,
        is_emergency: message.is_emergency,
        recommendation: message.sender === 'AI' ? message.recommendation : null,
      }))
    );
  }, [history.data]);

  const mutation = useMutation({
    mutationFn: (message: string) => sendChatMessage({ message, language: locale, conversation_id: conversationId }),
    onSuccess: (response, sentMessage) => {
      setMessages((current) => [
        ...current,
        { id: localId(), sender: 'USER', text: sentMessage, is_emergency: false, recommendation: null },
        {
          id: localId(),
          sender: 'AI',
          text: response.message,
          is_emergency: response.is_emergency,
          recommendation: { recommended_department: response.recommended_department, doctors: response.doctors },
        },
      ]);
      setConversationId(response.conversation_id);
      setInput('');
      queryClient.invalidateQueries({ queryKey: queryKeys.aiHistory });
    },
  });

  const onSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || mutation.isPending) return;
    setSendError(null);
    try {
      await mutation.mutateAsync(trimmed);
    } catch {
      setSendError(t('ai.chat.errorMessage'));
    }
  };

  return {
    messages,
    input,
    setInput,
    onSend,
    isSending: mutation.isPending,
    sendError,
    isHistoryLoading: history.isLoading,
    isHistoryError: history.isError,
  };
}
