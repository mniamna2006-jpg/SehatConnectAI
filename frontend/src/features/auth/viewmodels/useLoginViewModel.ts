import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useTranslations } from '../../../providers/LocaleProvider';
import { createLoginSchema } from '../model/schemas';
import type { LoginInput } from '../model/types';
import { useAuth } from '../../../providers/AuthProvider';
import { getLoginErrorMessage } from '../../../shared/utils/loginError';

export function useLoginViewModel() {
  const { login } = useAuth();
  const t = useTranslations();
  const [apiError, setApiError] = useState<string | null>(null);
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);
  const {
    control, handleSubmit, setValue, formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    try {
      await login(values);
      router.replace('/home');
    } catch (err) {
      console.warn('[useLoginViewModel] login failed', err);
      setApiError(getLoginErrorMessage(err, t));
    }
  });

  return { control, setValue, errors, onSubmit, isSubmitting, apiError };
}
