import type { AppointmentStatus, QueueStatus, TimeSlotStatus } from '../../../shared/types/api';

export interface TimeSlot {
  slot_id: string;
  doctor_id: string;
  hospital_id: string;
  date: string;
  start_time: string;
  end_time: string;
  start_time_12h?: string;
  end_time_12h?: string;
  status: TimeSlotStatus;
}

export interface Appointment {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  department_id: string;
  slot_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_time_12h?: string;
  status: AppointmentStatus;
  booking_reference: string;
  token_number?: number;
  reason?: string;
  doctor?: { name: string };
  hospital?: { name: string };
  department?: { name: string };
}

export interface QueueEntry {
  queue_id: string;
  hospital_id: string;
  doctor_id: string;
  appointment_id: string;
  token_number: number;
  queue_status: QueueStatus;
  estimated_wait_time?: number;
  appointment?: {
    appointment_time: string;
    appointment_time_12h?: string;
    doctor?: { name: string };
    hospital?: { name: string };
    department?: { name: string };
  };
}
