import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { loginSchema } from '../model/schemas';
import type { LoginInput } from '../model/types';
import { useAuth } from '../../../providers/AuthProvider';

export function useLoginViewModel() {
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    control, handleSubmit, setValue, formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    try {
      await login(values);
      router.replace('/home');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  });

  return { control, setValue, errors, onSubmit, isSubmitting, apiError };
}
