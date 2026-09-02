import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useTranslations } from '../../../providers/LocaleProvider';
import { getLoginErrorMessage } from '../../../shared/utils/loginError';
import { hospitalLoginSchema } from '../model/schemas';
import type { HospitalLoginInput } from '../model/types';
import { useHospitalAuth } from '../../../providers/HospitalAuthProvider';

export function useHospitalLoginViewModel() {
  const { login } = useHospitalAuth();
  const t = useTranslations();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    control, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<HospitalLoginInput>({ resolver: zodResolver(hospitalLoginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    try {
      const user = await login(values);
      router.replace(user.role === 'ADMIN' ? '/admin/dashboard' : '/staff/dashboard');
    } catch (err) {
      console.warn('[useHospitalLoginViewModel] login failed', err);
      setApiError(getLoginErrorMessage(err, t));
    }
  });

  return { control, errors, onSubmit, isSubmitting, apiError };
}
