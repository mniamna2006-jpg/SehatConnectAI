import { z } from 'zod';

type T = (key: string) => string;

export function createLoginSchema(t: T) {
  return z.object({
    email: z.string().email(t('auth.validation.email')),
    password: z.string().min(6, t('auth.validation.password')),
  });
}

export function createRegisterSchema(t: T) {
  return z
    .object({
      full_name: z.string().min(2, t('auth.validation.fullName')),
      email: z.string().email(t('auth.validation.email')).optional(),
      phone: z.string().min(7, t('auth.validation.phone')).optional(),
      password: z.string().min(6, t('auth.validation.password')),
      confirmPassword: z.string().min(6, t('auth.validation.password')),
      preferred_language: z.enum(['ENGLISH', 'URDU', 'ROMAN_URDU'], {
        message: t('auth.validation.language'),
      }),
    })
    .refine((v) => !!v.email || !!v.phone, { message: t('auth.validation.contactRequired'), path: ['email'] })
    .refine((v) => v.password === v.confirmPassword, {
      message: t('auth.validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });
}
