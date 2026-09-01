import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../../shared/constants/queryKeys';
import type { QueueStatus } from '../../../../shared/types/api';
import { getHospitalQueue, updateQueueStatus } from '../model/api';

/** Mirrors the server-enforced transition table in queue.routes.js — used only to decide the single next action; the backend remains the source of truth. */
const NEXT_QUEUE_STATUS: Partial<Record<QueueStatus, QueueStatus>> = {
  WAITING: 'CALLED',
  CALLED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
};

export function nextQueueStatus(status: QueueStatus): QueueStatus | undefined {
  return NEXT_QUEUE_STATUS[status];
}

export function useStaffQueueViewModel() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: queue = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.staffQueue,
    queryFn: getHospitalQueue,
    refetchInterval: 15_000,
  });

  const mutation = useMutation({
    mutationFn: ({ queueId, status }: { queueId: string; status: QueueStatus }) => updateQueueStatus(queueId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staffQueue });
      void queryClient.invalidateQueries({ queryKey: queryKeys.staffTodayAppointments });
    },
    onError: () => setActionError('Unable to update queue status. Please try again.'),
    onSettled: () => setPendingId(null),
  });

  const advance = (queueId: string, status: QueueStatus) => {
    setActionError(null);
    setPendingId(queueId);
    mutation.mutate({ queueId, status });
  };

  return { queue, isLoading, isError, refetch, actionError, pendingId, advance };
}
