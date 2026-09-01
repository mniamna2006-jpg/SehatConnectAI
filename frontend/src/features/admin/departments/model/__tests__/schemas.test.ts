import { departmentSchema } from '../schemas';

test('uses a localizable validation key for an invalid department name', () => {
  const result = departmentSchema.safeParse({ name: '', description: '' });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0]?.message).toBe('admin.departments.validation.name');
  }
});
