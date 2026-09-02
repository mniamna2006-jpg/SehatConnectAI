import { useState } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHospitalAuth } from '../../../../providers/HospitalAuthProvider';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { queryKeys } from '../../../../shared/constants/queryKeys';
import { getDepartments } from '../../departments/model/api';
import { createStaff, deactivateStaff, getStaff, updateStaff } from '../model/api';
import { buildStaffUpdate, type StaffFormValues } from '../model/mappers';
import { staffCreateSchema, staffUpdateSchema } from '../model/schemas';
import type { StaffMember } from '../model/types';

export function useStaffManagementViewModel() {
  const { hospitalUser } = useHospitalAuth();
  const t = useTranslations();
  const hospitalId = hospitalUser?.hospital?.hospital_id ?? '';
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: staff = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminStaff(hospitalId),
    queryFn: () => getStaff(hospitalId),
    enabled: hospitalId.length > 0,
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.adminDepartments(hospitalId),
    queryFn: () => getDepartments(hospitalId),
    enabled: hospitalId.length > 0,
  });

  const {
    control, handleSubmit, reset, setValue, formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(editing ? staffUpdateSchema : staffCreateSchema),
    defaultValues: { full_name: '', employee_id: '', position: '', email: '', phone: '', password: '', department_id: '' },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.adminStaff(hospitalId) });

  const openCreate = () => {
    setEditing(null);
    reset({ full_name: '', employee_id: '', position: '', email: '', phone: '', password: '', department_id: '' });
    setApiError(null);
    setSuccessMessage(null);
    setFormOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    reset({
      full_name: member.user.full_name,
      employee_id: member.employee_id,
      position: member.position,
      email: member.user.email ?? '',
      phone: member.user.phone ?? '',
      password: '',
      department_id: member.department_id ?? '',
    });
    setApiError(null);
    setSuccessMessage(null);
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setSuccessMessage(null);
    try {
      if (editing) {
        const patch = buildStaffUpdate(editing, values);
        if (Object.keys(patch).length === 0) {
          setApiError(t('admin.staffManagement.noChanges'));
          return;
        }
        await updateStaff(editing.staff_id, patch);
        setSuccessMessage(t('admin.staffManagement.success.updated'));
      } else {
        await createStaff({
          hospital_id: hospitalId,
          department_id: values.department_id || undefined,
          employee_id: values.employee_id.trim(),
          position: values.position.trim(),
          full_name: values.full_name.trim(),
          email: values.email || undefined,
          phone: values.phone || undefined,
          password: values.password ?? '',
        });
        setSuccessMessage(t('admin.staffManagement.success.created'));
      }
      await invalidate();
      setFormOpen(false);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t('common.error'));
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateStaff(id),
    onSuccess: async () => {
      await invalidate();
      setApiError(null);
      setSuccessMessage(t('admin.staffManagement.success.deactivated'));
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : t('common.error');
      setApiError(message);
      Alert.alert(t('common.errorTitle'), message);
    },
  });

  const confirmDeactivate = (member: StaffMember) => {
    setApiError(null);
    setSuccessMessage(null);
    Alert.alert(
      t('admin.staffManagement.deactivateTitle'),
      t('admin.staffManagement.deactivateMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.staffManagement.deactivateConfirm'),
          style: 'destructive',
          onPress: () => deactivateMutation.mutate(member.staff_id),
        },
      ]
    );
  };

  return {
    staff,
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
    editing,
    openCreate,
    openEdit,
    closeForm,
    confirmDeactivate,
    deactivatingId: deactivateMutation.isPending ? deactivateMutation.variables : undefined,
  };
}
