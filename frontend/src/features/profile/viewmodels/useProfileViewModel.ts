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

  const { data: profile, isLoading } = useQuery({ queryKey: queryKeys.profile, queryFn: getProfile });

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
    setIsEditing(true);
  };

  const onCancel = () => setIsEditing(false);

  const onSave = handleSubmit((values) => mutation.mutateAsync(values));

  return {
    profile, isLoading, isEditing, control, errors, setValue,
    onEdit, onCancel, onSave, isSaving: mutation.isPending,
  };
}
