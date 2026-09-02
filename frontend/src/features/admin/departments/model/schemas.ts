import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().trim().min(2, 'admin.departments.validation.name'),
  description: z.string().trim().optional(),
});
