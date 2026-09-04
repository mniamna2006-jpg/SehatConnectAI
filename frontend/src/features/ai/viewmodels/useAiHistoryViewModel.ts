import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { deleteAiConversation, getAiHistory } from '../model/api';

export function useAiHistoryViewModel() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: conversations = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.aiHistory,
    queryFn: getAiHistory,
  });

  const mutation = useMutation({
    mutationFn: (conversationId: string) => deleteAiConversation(conversationId),
    onMutate: (conversationId) => setDeletingId(conversationId),
    onSettled: () => setDeletingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiHistory });
    },
  });

  return {
    conversations,
    isLoading,
    isError,
    refetch,
    onDelete: (conversationId: string) => mutation.mutateAsync(conversationId).catch(() => undefined),
    isDeleting: (conversationId: string) => deletingId === conversationId,
    hasDeleteError: mutation.isError,
  };
}
