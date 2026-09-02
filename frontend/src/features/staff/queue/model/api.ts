import { apiRequest } from '../../../../core/api/client';
import type { QueueStatus } from '../../../../shared/types/api';
import { mapQueueEntry } from './mappers';
import type { RawStaffQueueEntry, StaffQueueEntry, StaffQueueStatusUpdate } from './types';

export function getHospitalQueue(): Promise<StaffQueueEntry[]> {
  return apiRequest<RawStaffQueueEntry[]>('/api/queue/hospital', { scope: 'hospital' }).then((raw) =>
    raw.map(mapQueueEntry)
  );
}

export function updateQueueStatus(queueId: string, status: QueueStatus): Promise<StaffQueueStatusUpdate> {
  return apiRequest<StaffQueueStatusUpdate>(`/api/queue/${queueId}/status`, {
    method: 'PATCH',
    body: { status },
    scope: 'hospital',
  });
}
