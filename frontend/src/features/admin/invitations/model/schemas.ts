import { z } from 'zod';

export const invitationCreateSchema = z.object({
  email: z.string().email(),
  employee_id: z.string().min(1),
  position: z.string().min(2),
  department_id: z.string().optional(),
});

export type InvitationFormValues = z.infer<typeof invitationCreateSchema>;
