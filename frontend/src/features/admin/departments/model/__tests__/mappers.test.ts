import { buildDepartmentUpdate } from '../mappers';

const department = {
  department_id: 'd1',
  hospital_id: 'h1',
  name: 'Cardiology',
  description: 'Heart care',
  is_active: true,
};

test('builds a changed-only department patch and clears an empty description', () => {
  expect(buildDepartmentUpdate(department, { name: ' Cardiology ', description: '' })).toEqual({
    description: null,
  });
});

test('returns an empty patch when normalized department values are unchanged', () => {
  expect(buildDepartmentUpdate(department, { name: ' Cardiology ', description: ' Heart care ' })).toEqual({});
});
