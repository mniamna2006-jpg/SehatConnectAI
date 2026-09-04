import { z } from 'zod';
import { isTodayOrPastDate } from '../../../shared/utils/dateValidation';

type T = (key: string) => string;

export function createProfileUpdateSchema(t: T) {
  return z.object({
    full_name: z.string().min(2, t('auth.validation.fullName')).optional(),
    phone: z.string().min(7, t('auth.validation.phone')).optional(),
    preferred_language: z
      .enum(['ENGLISH', 'URDU', 'ROMAN_URDU'], { message: t('auth.validation.language') })
      .optional(),
    date_of_birth: z
      .string()
      .refine((value) => value === '' || isTodayOrPastDate(value), { message: t('auth.validation.dateOfBirth') })
      .optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    emergency_contact: z.string().optional(),
  });
}
