import { useState } from 'react';
import { Alert } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useHospitalAuth } from '../../../../providers/HospitalAuthProvider';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { queryKeys } from '../../../../shared/constants/queryKeys';
import { getDepartments } from '../../departments/model/api';
import { createDoctor, deactivateDoctor, getDoctors, updateDoctor } from '../model/api';
import { buildDoctorCreateInput, buildDoctorUpdate } from '../model/mappers';
import { doctorSchema } from '../model/schemas';
import type { DoctorFormValues } from '../model/schemas';
import type { AdminDoctor } from '../model/types';

const EMPTY_FORM: DoctorFormValues = {
  department_id: '',
  name: '',
  specialization: '',
  qualification: '',
  license_number: '',
  bio: '',
  consultation_fee: '',
};

export function useDoctorsViewModel() {
  const { hospitalUser } = useHospitalAuth();
  const t = useTranslations();
  const queryClient = useQueryClient();
  const hospitalId = hospitalUser?.hospital?.hospital_id ?? '';
  const [editing, setEditing] = useState<AdminDoctor | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const doctorsQuery = useQuery({
    queryKey: queryKeys.adminDoctors(hospitalId),
    queryFn: () => getDoctors(hospitalId),
    enabled: hospitalId.length > 0,
  });
  const departmentsQuery = useQuery({
    queryKey: queryKeys.adminDepartments(hospitalId),
    queryFn: () => getDepartments(hospitalId),
    enabled: hospitalId.length > 0,
  });

  const doctors = doctorsQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const departmentNames = Object.fromEntries(
    departments.map((department) => [department.department_id, department.name])
  );
  const doctorRows = doctors.map((doctor) => ({
    ...doctor,
    department_name: departmentNames[doctor.department_id] ?? t('common.notProvided'),
  }));

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: EMPTY_FORM,
  });

  const invalidateDoctors = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors(hospitalId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard }),
  ]);

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setApiError(null);
    setSuccessMessage(null);
    setFormOpen(true);
  };

  const openEdit = (doctor: AdminDoctor) => {
    setEditing(doctor);
    reset({
      department_id: doctor.department_id,
      name: doctor.name,
      specialization: doctor.specialization,
      qualification: doctor.qualification ?? '',
      license_number: doctor.license_number,
      bio: doctor.bio ?? '',
      consultation_fee: doctor.consultation_fee === null ? '' : String(doctor.consultation_fee),
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
        const patch = buildDoctorUpdate(editing, values);
        if (Object.keys(patch).length === 0) {
          setApiError(t('admin.doctors.noChanges'));
          return;
        }
        await updateDoctor(editing.doctor_id, patch);
        setSuccessMessage(t('admin.doctors.success.updated'));
      } else {
        await createDoctor(buildDoctorCreateInput(hospitalId, values));
        setSuccessMessage(t('admin.doctors.success.created'));
      }
      await invalidateDoctors();
      setFormOpen(false);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : t('common.error'));
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (doctorId: string) => deactivateDoctor(doctorId),
    onSuccess: async () => {
      await invalidateDoctors();
      setApiError(null);
      setSuccessMessage(t('admin.doctors.success.deactivated'));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t('common.error');
      setApiError(message);
      Alert.alert(t('common.errorTitle'), message);
    },
  });

  const confirmDeactivate = (doctor: AdminDoctor) => {
    setApiError(null);
    setSuccessMessage(null);
    Alert.alert(
      t('admin.doctors.deactivateTitle'),
      t('admin.doctors.deactivateMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.doctors.deactivateConfirm'),
          style: 'destructive',
          onPress: () => deactivateMutation.mutate(doctor.doctor_id),
        },
      ]
    );
  };

  const openSchedules = (doctor: AdminDoctor) => {
    router.push({
      pathname: '/admin/doctors/[doctorId]/schedules',
      params: { doctorId: doctor.doctor_id, doctorName: doctor.name },
    });
  };

  const refetch = async () => {
    await Promise.all([doctorsQuery.refetch(), departmentsQuery.refetch()]);
  };

  return {
    doctors,
    doctorRows,
    departments,
    isLoading: doctorsQuery.isLoading || departmentsQuery.isLoading,
    isError: doctorsQuery.isError || departmentsQuery.isError,
    error: doctorsQuery.error ?? departmentsQuery.error,
    refetch,
    control,
    errors,
    isSubmitting,
    setValue,
    editing,
    formOpen,
    apiError,
    successMessage,
    openCreate,
    openEdit,
    closeForm,
    onSubmit,
    confirmDeactivate,
    openSchedules,
    deactivatingId: deactivateMutation.isPending ? deactivateMutation.variables : undefined,
  };
}
