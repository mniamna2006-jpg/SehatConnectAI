/**
 * [DEV DEMO ADAPTER] Only reachable when isDemoMode() is true. Keeps an
 * in-memory copy of the fixture appointments/queue so booking and cancelling
 * behave like a real session without touching a backend.
 */
import { ApiError } from '../../../core/api/client';
import { demoDoctorById } from '../../../core/demo/fixtures';
import { demoInitialAppointments, demoInitialQueue, DEMO_PROFILE } from '../../../core/demo/fixtures';
import type { Appointment, QueueEntry, TimeSlot } from './types';
import type { BookingInput } from './schemas';

// ponytail: module-level mutable state, not persisted — resets on app reload, fine for a dev demo.
let appointments: Appointment[] = demoInitialAppointments();
let queue: QueueEntry[] = demoInitialQueue();
let nextBookingSeq = appointments.length + 1;
const timeSlots = new Map<string, TimeSlot>();

export async function demoGetMyAppointments(): Promise<Appointment[]> {
  return [...appointments].reverse();
}

export async function demoGetAppointmentById(id: string): Promise<Appointment> {
  const appointment = appointments.find((a) => a.appointment_id === id);
  if (!appointment) throw new ApiError(404, 'Demo appointment not found');
  return appointment;
}

export async function demoCreateAppointment(input: BookingInput): Promise<Appointment> {
  const doctor = demoDoctorById(input.doctor_id);
  const selectedSlot = timeSlots.get(input.slot_id);
  if (
    !doctor ||
    doctor.hospital_id !== input.hospital_id ||
    doctor.department_id !== input.department_id ||
    !selectedSlot ||
    selectedSlot.doctor_id !== input.doctor_id ||
    selectedSlot.hospital_id !== input.hospital_id ||
    selectedSlot.status !== 'AVAILABLE'
  ) {
    throw new ApiError(400, 'Select an available demo time slot for this doctor');
  }

  const bookingRef = `DEMO-BK-${String(nextBookingSeq++).padStart(4, '0')}`;
  const appointment: Appointment = {
    appointment_id: `demo-appt-${bookingRef}`,
    patient_id: DEMO_PROFILE.patient_id,
    doctor_id: input.doctor_id,
    hospital_id: input.hospital_id,
    department_id: input.department_id,
    slot_id: input.slot_id,
    appointment_date: selectedSlot.date,
    appointment_time: selectedSlot.start_time,
    appointment_time_12h: selectedSlot.start_time_12h,
    status: 'BOOKED',
    booking_reference: bookingRef,
    reason: input.reason,
    doctor: { name: doctor.name },
    hospital: { name: doctor.hospital.name },
    department: { name: doctor.department.name },
  };
  timeSlots.set(selectedSlot.slot_id, { ...selectedSlot, status: 'BOOKED' });
  appointments = [...appointments, appointment];
  return appointment;
}

export async function demoCancelAppointment(id: string): Promise<Appointment> {
  const appointment = appointments.find((a) => a.appointment_id === id);
  if (!appointment) throw new ApiError(404, 'Demo appointment not found');
  if (appointment.status !== 'BOOKED' && appointment.status !== 'CONFIRMED') {
    throw new ApiError(400, 'Only booked or confirmed appointments can be cancelled');
  }
  const cancelled = { ...appointment, status: 'CANCELLED' as const };
  appointments = appointments.map((item) =>
    item.appointment_id === id ? cancelled : item
  );
  const selectedSlot = timeSlots.get(appointment.slot_id);
  if (selectedSlot) {
    timeSlots.set(selectedSlot.slot_id, { ...selectedSlot, status: 'AVAILABLE' });
  }
  return cancelled;
}

export async function demoGetTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
  const doctor = demoDoctorById(doctorId);
  const hospitalId = doctor?.hospital_id ?? 'demo-hosp-1';
  const slotPrefix = `demo-slot-${doctorId}-${date}-`;
  const existing = [...timeSlots.values()].filter((slot) =>
    slot.slot_id.startsWith(slotPrefix)
  );
  if (existing.length > 0) return existing.map((slot) => ({ ...slot }));

  const times: [string, string, string, string, TimeSlot['status']][] = [
    ['09:00', '09:30', '9:00 AM', '9:30 AM', 'AVAILABLE'],
    ['09:30', '10:00', '9:30 AM', '10:00 AM', 'AVAILABLE'],
    ['10:00', '10:30', '10:00 AM', '10:30 AM', 'BOOKED'],
  ];
  const generated = times.map(([start, end, start12h, end12h, status], i) => ({
    slot_id: `demo-slot-${doctorId}-${date}-${i}`,
    doctor_id: doctorId,
    hospital_id: hospitalId,
    date,
    start_time: start,
    end_time: end,
    start_time_12h: start12h,
    end_time_12h: end12h,
    status,
  }));
  for (const slot of generated) timeSlots.set(slot.slot_id, slot);
  return generated.map((slot) => ({ ...slot }));
}

export async function demoGetMyQueue(): Promise<QueueEntry[]> {
  return queue.filter((q) => appointments.some((a) => a.appointment_id === q.appointment_id && a.status === 'BOOKED'));
}
