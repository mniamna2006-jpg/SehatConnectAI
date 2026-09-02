import type { RawStaffQueueEntry, StaffQueueEntry } from './types';

export function mapQueueEntry(raw: RawStaffQueueEntry): StaffQueueEntry {
  return {
    queue_id: raw.queue_id,
    hospital_id: raw.hospital_id,
    doctor_id: raw.doctor_id,
    appointment_id: raw.appointment_id,
    token_number: raw.token_number,
    queue_status: raw.queue_status,
    patient: raw.appointment?.patient ? { full_name: raw.appointment.patient.user.full_name } : null,
    doctor: raw.appointment?.doctor ? { name: raw.appointment.doctor.name } : null,
  };
}
