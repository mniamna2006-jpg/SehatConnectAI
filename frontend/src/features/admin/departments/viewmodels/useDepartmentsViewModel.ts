import { useState } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHospitalAuth } from '../../../../providers/HospitalAuthProvider';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { queryKeys } from '../../../../shared/constants/queryKeys';
import { createDepartment, deactivateDepartment, getDepartments, updateDepartment } from '../model/api';
import { buildDepartmentUpdate } from '../model/mappers';
import { departmentSchema } from '../model/schemas';
import type { Department, DepartmentFormValues } from '../model/types';

export function useDepartmentsViewModel() {
  const { hospitalUser } = useHospitalAuth();
  const t = useTranslations();
  const hospitalId = hospitalUser?.hospital?.hospital_id ?? '';
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Department | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: departments = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminDepartments(hospitalId),
    queryFn: () => getDepartments(hospitalId),
    enabled: hospitalId.length > 0,
  });

  const {
    control, handleSubmit, reset, setValue, formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '' },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.adminDepartments(hospitalId) });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '' });
    setApiError(null);
    setSuccessMessage(null);
    setFormOpen(true);
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    reset({ name: department.name, description: department.description ?? '' });
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
        const patch = buildDepartmentUpdate(editing, values);
        if (Object.keys(patch).length === 0) {
          setApiError(t('admin.departments.noChanges'));
          return;
        }
        await updateDepartment(editing.department_id, patch);
        setSuccessMessage(t('admin.departments.success.updated'));
      } else {
        await createDepartment({
          hospital_id: hospitalId,
          name: values.name.trim(),
          description: values.description?.trim() || null,
        });
        setSuccessMessage(t('admin.departments.success.created'));
      }
      await invalidate();
      setFormOpen(false);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t('common.error'));
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateDepartment(id),
    onSuccess: async () => {
      await invalidate();
      setApiError(null);
      setSuccessMessage(t('admin.departments.success.deactivated'));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t('common.error');
      setApiError(message);
      Alert.alert(t('common.errorTitle'), message);
    },
  });

  const confirmDeactivate = (department: Department) => {
    setApiError(null);
    setSuccessMessage(null);
    Alert.alert(
      t('admin.departments.deactivateTitle'),
      t('admin.departments.deactivateMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.departments.deactivateConfirm'),
          style: 'destructive',
          onPress: () => deactivateMutation.mutate(department.department_id),
        },
      ]
    );
  };

  return {
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
