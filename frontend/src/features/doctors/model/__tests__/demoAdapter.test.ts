import {
  demoGetDoctorById,
  demoGetDoctorsByDepartment,
  demoGetDoctorsByHospital,
} from '../demoAdapter';

test('demo doctors remain scoped to exactly one hospital and one department', async () => {
  const byHospital = await demoGetDoctorsByHospital('demo-hosp-1');
  const byDepartment = await demoGetDoctorsByDepartment('demo-dept-cardiology');
  const detail = await demoGetDoctorById('demo-doctor-1');

  expect(byHospital).toEqual([
    expect.objectContaining({
      doctor_id: 'demo-doctor-1',
      hospital_id: 'demo-hosp-1',
      department_id: 'demo-dept-cardiology',
    }),
  ]);
  expect(byDepartment).toEqual(byHospital);
  expect(detail.hospital.hospital_id).toBe(detail.hospital_id);
  expect(detail.department.department_id).toBe(detail.department_id);
  expect(detail.schedules[0]).toEqual(
    expect.objectContaining({ start_time_12h: '9:00 AM', end_time_12h: '5:00 PM' })
  );
});
