import {
  demoDepartments,
  demoDoctors,
  demoHospitals,
  demoInitialAppointments,
  demoInitialQueue,
} from '../fixtures';

test('every demo doctor belongs to exactly one hospital and one department', () => {
  const doctors = demoDoctors();
  expect(doctors.length).toBeGreaterThan(0);
  for (const doctor of doctors) {
    expect(typeof doctor.hospital_id).toBe('string');
    expect(typeof doctor.department_id).toBe('string');
    expect(doctor.hospital.hospital_id).toBe(doctor.hospital_id);
    expect(doctor.department.department_id).toBe(doctor.department_id);
  }
});

test('every demo doctor schedule carries 12-hour display fields', () => {
  for (const doctor of demoDoctors()) {
    for (const s of doctor.schedules) {
      expect(s.start_time_12h).toMatch(/AM|PM/);
      expect(s.end_time_12h).toMatch(/AM|PM/);
    }
  }
});

test('demo appointments include one upcoming, one completed, one cancelled', () => {
  const statuses = demoInitialAppointments().map((a) => a.status);
  expect(statuses).toEqual(expect.arrayContaining(['BOOKED', 'COMPLETED', 'CANCELLED']));
  expect(statuses).toHaveLength(3);
});

test('fixture relationships and patient-facing 12-hour fields are internally consistent', () => {
  const hospitalIds = new Set(demoHospitals().map((hospital) => hospital.hospital_id));
  const departments = demoDepartments();
  const departmentIds = new Set(departments.map((department) => department.department_id));
  const doctors = demoDoctors();
  const doctorIds = new Set(doctors.map((doctor) => doctor.doctor_id));
  const appointments = demoInitialAppointments();
  const appointmentIds = new Set(appointments.map((appointment) => appointment.appointment_id));

  for (const department of departments) {
    expect(hospitalIds.has(department.hospital_id)).toBe(true);
  }
  for (const doctor of doctors) {
    expect(hospitalIds.has(doctor.hospital_id)).toBe(true);
    expect(departmentIds.has(doctor.department_id)).toBe(true);
    expect(doctor).not.toHaveProperty('sittings');
    expect(doctor).not.toHaveProperty('multipleHospitals');
    expect(doctor).not.toHaveProperty('hospitalSittings');
  }
  for (const appointment of appointments) {
    expect(hospitalIds.has(appointment.hospital_id)).toBe(true);
    expect(departmentIds.has(appointment.department_id)).toBe(true);
    expect(doctorIds.has(appointment.doctor_id)).toBe(true);
    expect(appointment.appointment_time_12h).toMatch(/AM|PM/);
  }
  for (const queueEntry of demoInitialQueue()) {
    expect(appointmentIds.has(queueEntry.appointment_id)).toBe(true);
    expect(queueEntry.appointment?.appointment_time_12h).toMatch(/AM|PM/);
  }
});

test('demo dataset does not invent ratings, reviews, or health metrics', () => {
  const serialized = JSON.stringify({
    hospitals: demoHospitals(),
    doctors: demoDoctors(),
    appointments: demoInitialAppointments(),
  });

  expect(serialized).not.toMatch(/rating|review|heart_rate|blood_pressure|steps/i);
});
