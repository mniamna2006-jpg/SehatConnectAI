import {
  demoCancelAppointment,
  demoCreateAppointment,
  demoGetMyAppointments,
  demoGetMyQueue,
  demoGetTimeSlots,
} from '../demoAdapter';

test('demo slots use distinct 12-hour start/end times', async () => {
  const slots = await demoGetTimeSlots('demo-doctor-1', '2026-09-08');

  expect(slots[0]).toEqual(
    expect.objectContaining({
      start_time: '09:00',
      end_time: '09:30',
      start_time_12h: '9:00 AM',
      end_time_12h: '9:30 AM',
      status: 'AVAILABLE',
    })
  );
});

test('booking and cancellation update demo session memory without backend persistence', async () => {
  const slots = await demoGetTimeSlots('demo-doctor-1', '2026-09-09');
  const selectedSlot = slots.find((slot) => slot.status === 'AVAILABLE');
  expect(selectedSlot).toBeDefined();

  const created = await demoCreateAppointment({
    doctor_id: 'demo-doctor-1',
    hospital_id: 'demo-hosp-1',
    department_id: 'demo-dept-cardiology',
    slot_id: selectedSlot!.slot_id,
    reason: 'Demo booking',
  });

  expect(created).toEqual(
    expect.objectContaining({
      appointment_date: '2026-09-09',
      appointment_time: selectedSlot!.start_time,
      appointment_time_12h: selectedSlot!.start_time_12h,
      status: 'BOOKED',
    })
  );
  expect(await demoGetMyAppointments()).toContainEqual(
    expect.objectContaining({ appointment_id: created.appointment_id, status: 'BOOKED' })
  );
  expect((await demoGetTimeSlots('demo-doctor-1', '2026-09-09'))[0].status).toBe('BOOKED');

  const cancelled = await demoCancelAppointment(created.appointment_id);
  expect(cancelled.status).toBe('CANCELLED');
  expect((await demoGetTimeSlots('demo-doctor-1', '2026-09-09'))[0].status).toBe('AVAILABLE');
});

test('demo queue starts with the cross-referenced booked appointment and 12-hour time', async () => {
  const queue = await demoGetMyQueue();

  expect(queue).toEqual([
    expect.objectContaining({
      appointment_id: 'demo-appt-upcoming',
      queue_status: 'WAITING',
      appointment: expect.objectContaining({ appointment_time_12h: '9:00 AM' }),
    }),
  ]);
});
