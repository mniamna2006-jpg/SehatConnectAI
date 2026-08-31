import { demoGetDepartmentsByHospital } from '../demoAdapter';

test('demo departments are scoped to the selected hospital', async () => {
  const departments = await demoGetDepartmentsByHospital('demo-hosp-2');

  expect(departments).toEqual([
    expect.objectContaining({
      department_id: 'demo-dept-pediatrics',
      hospital_id: 'demo-hosp-2',
      name: 'Pediatrics',
    }),
  ]);
});
