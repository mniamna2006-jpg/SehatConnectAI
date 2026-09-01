import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminHospitalProfile, updateAdminHospitalProfile } from '../model/api';
import { buildHospitalProfilePatch } from '../model/mappers';
import { hospitalProfileSchema } from '../model/schemas';
import type { HospitalProfileFormInput } from '../model/schemas';
import type { HospitalProfileInput, HospitalProfilePatch } from '../model/types';
import { useHospitalAuth } from '../../../../providers/HospitalAuthProvider';
import { queryKeys } from '../../../../shared/constants/queryKeys';

export function useAdminHospitalProfileViewModel() {
  const { hospitalUser } = useHospitalAuth();
  const hospitalId = hospitalUser?.hospital?.hospital_id ?? '';
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [noChanges, setNoChanges] = useState(false);

  const { data: hospital, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminHospitalProfile(hospitalId),
    queryFn: () => getAdminHospitalProfile(hospitalId),
    enabled: !!hospitalId,
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<
    HospitalProfileFormInput,
    undefined,
    HospitalProfileInput
  >({ resolver: zodResolver(hospitalProfileSchema) });

  const mutation = useMutation({
    mutationFn: (patch: HospitalProfilePatch) => updateAdminHospitalProfile(hospitalId, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.adminHospitalProfile(hospitalId), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      setSaveSuccess(true);
      setIsEditing(false);
    },
  });

  const onEdit = () => {
    if (hospital) {
      reset({
        name: hospital.name,
        facility_type: hospital.facility_type,
        description: hospital.description ?? '',
        logo_url: hospital.logo_url ?? '',
        cover_image_url: hospital.cover_image_url ?? '',
        theme: hospital.theme ?? '',
        phone: hospital.phone ?? '',
        email: hospital.email ?? '',
        address: hospital.address,
        city: hospital.city,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
      });
    }
    setSaveError(null);
    setSaveSuccess(false);
    setNoChanges(false);
    setIsEditing(true);
  };

  const onCancel = () => setIsEditing(false);

  const onSave = handleSubmit(async (values) => {
    setSaveError(null);
    setSaveSuccess(false);
    setNoChanges(false);
    if (!hospital) return;

    const patch = buildHospitalProfilePatch(hospital, values);
    if (Object.keys(patch).length === 0) {
      setNoChanges(true);
      setIsEditing(false);
      return;
    }

    try {
      await mutation.mutateAsync(patch);
    } catch (err) {
      console.warn('[useAdminHospitalProfileViewModel] save failed', err);
      setSaveError(err instanceof Error ? err.message : 'Unable to save changes. Please try again.');
    }
  });

  return {
    hospital, isLoading, isError, error, refetch, isEditing, control, errors,
    onEdit, onCancel, onSave, isSaving: mutation.isPending, saveError, saveSuccess, noChanges,
  };
}
