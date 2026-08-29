import { useState } from 'react';
import { requestPasswordReset } from '../model/adapters/forgotPasswordAdapter';

export function useForgotPasswordViewModel() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { email, setEmail, onSubmit, isSubmitting, submitted };
}
