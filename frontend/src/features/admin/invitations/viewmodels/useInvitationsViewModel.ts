import { useState } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHospitalAuth } from '../../../../providers/HospitalAuthProvider';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { queryKeys } from '../../../../shared/constants/queryKeys';
import { getDepartments } from '../../departments/model/api';
import { createInvitation, getInvitations, revokeInvitation } from '../model/api';
import { invitationCreateSchema, type InvitationFormValues } from '../model/schemas';
import type { StaffInvitation } from '../model/types';

export function useInvitationsViewModel() {
  const { hospitalUser } = useHospitalAuth();
  const t = useTranslations();
  const hospitalId = hospitalUser?.hospital?.hospital_id ?? '';
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: invitations = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminInvitations(hospitalId),
    queryFn: () => getInvitations(hospitalId),
    enabled: hospitalId.length > 0,
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.adminDepartments(hospitalId),
    queryFn: () => getDepartments(hospitalId),
    enabled: hospitalId.length > 0,
  });

  const {
    control, handleSubmit, reset, setValue, formState: { errors, isSubmitting },
  } = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationCreateSchema),
    defaultValues: { email: '', employee_id: '', position: '', department_id: '' },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.adminInvitations(hospitalId) });

  const openCreate = () => {
    reset({ email: '', employee_id: '', position: '', department_id: '' });
    setApiError(null);
    setSuccessMessage(null);
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setSuccessMessage(null);
    try {
      await createInvitation({
        hospital_id: hospitalId,
        email: values.email.trim().toLowerCase(),
        employee_id: values.employee_id.trim(),
        position: values.position.trim(),
        department_id: values.department_id || undefined,
      });
      setSuccessMessage(t('admin.invitations.success.created'));
      await invalidate();
      setFormOpen(false);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t('common.error'));
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: async () => {
      await invalidate();
      setApiError(null);
      setSuccessMessage(t('admin.invitations.success.revoked'));
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : t('common.error');
      setApiError(message);
      Alert.alert(t('common.errorTitle'), message);
    },
  });

  const confirmRevoke = (invitation: StaffInvitation) => {
    setApiError(null);
    setSuccessMessage(null);
    Alert.alert(
      t('admin.invitations.revokeTitle'),
      t('admin.invitations.revokeMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.invitations.revokeConfirm'),
          style: 'destructive',
          onPress: () => revokeMutation.mutate(invitation.invitation_id),
        },
      ]
    );
  };

  return {
    invitations,
    departments,
    isLoading,
    isError,
    error,
    refetch,
    control,
    setValue,
    errors,
    onSubmit,
    isSubmitting,
    apiError,
    successMessage,
    formOpen,
    openCreate,
    closeForm,
    confirmRevoke,
    revokingId: revokeMutation.isPending ? revokeMutation.variables : undefined,
  };
}
