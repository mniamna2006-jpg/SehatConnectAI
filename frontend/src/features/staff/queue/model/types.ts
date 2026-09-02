import type { QueueStatus } from '../../../../shared/types/api';

export interface StaffQueueEntry {
  queue_id: string;
  hospital_id: string;
  doctor_id: string;
  appointment_id: string;
  token_number: number;
  queue_status: QueueStatus;
  patient?: { full_name: string } | null;
  doctor?: { name: string } | null;
}
