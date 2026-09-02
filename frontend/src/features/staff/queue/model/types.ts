import type { AppointmentStatus, QueueStatus } from '../../../../shared/types/api';

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

/** Raw response shape of PATCH /api/queue/:queue_id/status — scalar Queue + scalar Appointment, not the joined StaffQueueEntry shape. */
export interface StaffQueueStatusUpdate {
  queue: {
    queue_id: string;
    hospital_id: string;
    doctor_id: string;
    appointment_id: string;
    token_number: number;
    queue_status: QueueStatus;
    check_in_time: string | null;
    estimated_wait_time: number | null;
    called_at: string | null;
    completed_at: string | null;
  };
  appointment: {
    appointment_id: string;
    patient_id: string;
    doctor_id: string;
    hospital_id: string;
    department_id: string;
    slot_id: string;
    appointment_date: string;
    appointment_time: string;
    appointment_time_12h: string;
    status: AppointmentStatus;
    booking_reference: string;
    token_number: number | null;
    reason: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}
