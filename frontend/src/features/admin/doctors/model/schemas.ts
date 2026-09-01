import { z } from 'zod';

export const doctorSchema = z.object({
  department_id: z.string().min(1, 'admin.doctors.validation.department'),
  name: z.string().trim().min(1, 'admin.doctors.validation.name'),
  specialization: z.string().trim().min(1, 'admin.doctors.validation.specialization'),
  qualification: z.string().trim(),
  license_number: z.string().trim().min(1, 'admin.doctors.validation.licenseNumber'),
  bio: z.string().trim(),
  consultation_fee: z.string().trim().refine(
    (value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
    { message: 'admin.doctors.validation.consultationFee' }
  ),
});

export type DoctorFormValues = z.infer<typeof doctorSchema>;
