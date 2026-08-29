import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { registerSchema } from '../model/schemas';
import type { RegisterInput } from '../model/types';
import { useAuth } from '../../../providers/AuthProvider';

interface RegisterFormValues extends RegisterInput {
  confirmPassword: string;
}

export function useRegisterViewModel() {
  const { register: registerPatient } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
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
      setApiError('Unable to create your account. Please try again.');
    }
  });

  return { control, setValue, errors, onSubmit, isSubmitting, apiError };
}
