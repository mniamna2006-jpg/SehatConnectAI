import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '../model/api';
import { profileUpdateSchema } from '../model/schemas';
import type { ProfileUpdateInput } from '../model/types';
import { queryKeys } from '../../../shared/constants/queryKeys';

export function useProfileViewModel() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: getProfile,
  });

  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: ProfileUpdateInput) => updateProfile(values),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.profile, updated);
      setIsEditing(false);
    },
  });

  const onEdit = () => {
    if (profile) reset(profile);
    setSaveError(null);
    setIsEditing(true);
  };

  const onCancel = () => setIsEditing(false);

  const onSave = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (err) {
      console.warn('[useProfileViewModel] save failed', err);
      setSaveError('Unable to save your changes. Please try again.');
    }
  });

  return {
    profile, isLoading, isError, refetch, isEditing, control, errors, setValue,
    onEdit, onCancel, onSave, isSaving: mutation.isPending, saveError,
  };
}
