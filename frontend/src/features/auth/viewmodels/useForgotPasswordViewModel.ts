import { useState } from 'react';
import { requestPasswordReset } from '../model/adapters/forgotPasswordAdapter';

export function useForgotPasswordViewModel() {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(identifier);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { identifier, setIdentifier, onSubmit, isSubmitting, submitted };
}
