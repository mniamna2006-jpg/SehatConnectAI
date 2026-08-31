import {
  demoGetHospitalById,
  demoGetHospitals,
  demoGetHospitalsNearby,
  demoSearchHospitalsByCity,
} from '../demoAdapter';

test('demo hospital discovery supports list, GPS, and the manual-location example', async () => {
  const hospitals = await demoGetHospitals();
  const nearby = await demoGetHospitalsNearby({ latitude: 24.8607, longitude: 67.0011 });
  const manual = await demoSearchHospitalsByCity('Gulshan-e-Iqbal, Karachi');

  expect(hospitals).toHaveLength(3);
  expect(nearby).toHaveLength(3);
  expect(nearby.every((hospital) => typeof hospital.distance_km === 'number')).toBe(true);
  expect(manual).toEqual([
    expect.objectContaining({ name: 'Marham Medical Center', city: 'Karachi' }),
  ]);
});

test('demo hospital detail exposes related departments, doctors, and 12-hour working hours', async () => {
  const hospital = await demoGetHospitalById('demo-hosp-1');

  expect(hospital.departments).toEqual([
    expect.objectContaining({ department_id: 'demo-dept-cardiology' }),
  ]);
  expect(hospital.doctors).toEqual([
    expect.objectContaining({ doctor_id: 'demo-doctor-1' }),
  ]);
  expect(hospital.working_hours[0]).toEqual(
    expect.objectContaining({ opening_time_12h: '9:00 AM', closing_time_12h: '5:00 PM' })
  );
});
