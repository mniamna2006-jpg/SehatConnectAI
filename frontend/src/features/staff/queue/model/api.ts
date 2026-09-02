import { apiRequest } from '../../../../core/api/client';
import type { QueueStatus } from '../../../../shared/types/api';
import type { StaffQueueEntry } from './types';

export function getHospitalQueue(): Promise<StaffQueueEntry[]> {
  return apiRequest<StaffQueueEntry[]>('/api/queue/hospital', { scope: 'hospital' });
}

export function updateQueueStatus(queueId: string, status: QueueStatus): Promise<StaffQueueEntry> {
  return apiRequest<StaffQueueEntry>(`/api/queue/${queueId}/status`, {
    method: 'PATCH',
    body: { status },
    scope: 'hospital',
  });
}
