import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useTranslations } from '../../../providers/LocaleProvider';
import { createRegisterSchema } from '../model/schemas';
import type { RegisterInput } from '../model/types';
import { useAuth } from '../../../providers/AuthProvider';

interface RegisterFormValues extends RegisterInput {
  confirmPassword: string;
}

export function useRegisterViewModel() {
  const { register: registerPatient } = useAuth();
  const t = useTranslations();
  const [apiError, setApiError] = useState<string | null>(null);
  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);
  const {
    control, handleSubmit, setValue, formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async ({ confirmPassword: _confirmPassword, ...rest }) => {
    setApiError(null);
    try {
      await registerPatient(rest);
      router.replace('/home');
    } catch (err) {
      console.warn('[useRegisterViewModel] registration failed', err);
      setApiError(t('auth.validation.registerFailed'));
    }
  });

  return { control, setValue, errors, onSubmit, isSubmitting, apiError };
}
