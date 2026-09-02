import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useHospitalAuth } from '../../../../providers/HospitalAuthProvider';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { queryKeys } from '../../../../shared/constants/queryKeys';
import { getDoctors } from '../../doctors/model/api';
import { createDoctorSchedule, generateTimeSlots, getDoctorSchedules } from '../model/api';
import { scheduleSchema, timeSlotGenerationSchema } from '../model/schemas';
import type { ScheduleFormValues, TimeSlotGenerationFormValues } from '../model/schemas';
import type { GeneratedTimeSlot } from '../model/types';

const SCHEDULE_DEFAULTS: ScheduleFormValues = {
  day_of_week: 'MONDAY',
  start_time: '',
  end_time: '',
  appointment_duration: '',
};

export function useDoctorSchedulesViewModel() {
  const params = useLocalSearchParams<{ doctorId?: string | string[] }>();
  const routeDoctorId = Array.isArray(params.doctorId) ? params.doctorId[0] : params.doctorId;
  const doctorId = routeDoctorId ?? '';
  const { hospitalUser } = useHospitalAuth();
  const hospitalId = hospitalUser?.hospital?.hospital_id ?? '';
  const t = useTranslations();
  const queryClient = useQueryClient();
  const generationLock = useRef(false);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
  const [generatedSlots, setGeneratedSlots] = useState<GeneratedTimeSlot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const doctorsQuery = useQuery({
    queryKey: queryKeys.adminDoctors(hospitalId),
    queryFn: () => getDoctors(hospitalId),
    enabled: hospitalId.length > 0,
  });
  const doctor = doctorsQuery.data?.find((candidate) => candidate.doctor_id === doctorId) ?? null;
  const schedulesQuery = useQuery({
    queryKey: queryKeys.adminDoctorSchedules(doctorId),
    queryFn: () => getDoctorSchedules(doctorId),
    enabled: doctor !== null,
  });

  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: SCHEDULE_DEFAULTS,
  });
  const generationForm = useForm<TimeSlotGenerationFormValues>({
    resolver: zodResolver(timeSlotGenerationSchema),
    defaultValues: { date: '' },
  });

  const openScheduleForm = () => {
    scheduleForm.reset(SCHEDULE_DEFAULTS);
    setScheduleError(null);
    setScheduleSuccess(null);
    setScheduleFormOpen(true);
  };

  const closeScheduleForm = () => setScheduleFormOpen(false);

  const onCreateSchedule = scheduleForm.handleSubmit(async (values) => {
    setScheduleError(null);
    setScheduleSuccess(null);
    try {
      await createDoctorSchedule({
        doctor_id: doctorId,
        day_of_week: values.day_of_week,
        start_time: values.start_time,
        end_time: values.end_time,
        appointment_duration: Number(values.appointment_duration),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctorSchedules(doctorId) });
      setScheduleSuccess(t('admin.schedules.success.created'));
      setScheduleFormOpen(false);
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : t('common.error'));
    }
  });

  const submitGeneration = generationForm.handleSubmit(async (values) => {
    setGenerationError(null);
    setGenerationSuccess(null);
    setGeneratedSlots([]);
    try {
      const slots = await generateTimeSlots({
        doctor_id: doctorId,
        hospital_id: hospitalId,
        date: values.date,
      });
      setGeneratedSlots(slots);
      const labelKey = slots.length === 1
        ? 'admin.schedules.generation.generatedSingle'
        : 'admin.schedules.generation.generatedMany';
      setGenerationSuccess(`${slots.length} ${t(labelKey)}`);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : t('common.error'));
    }
  });

  const onGenerateSlots = async () => {
    if (generationLock.current) return;
    generationLock.current = true;
    setIsGenerating(true);
    try {
      await submitGeneration();
    } finally {
      generationLock.current = false;
      setIsGenerating(false);
    }
  };

  const refetch = async () => {
    await Promise.all([doctorsQuery.refetch(), schedulesQuery.refetch()]);
  };

  return {
    doctor,
    doctorMissing: !doctorsQuery.isLoading && !doctorsQuery.isError && doctor === null,
    schedules: schedulesQuery.data ?? [],
    isLoading: doctorsQuery.isLoading || (doctor !== null && schedulesQuery.isLoading),
    isError: doctorsQuery.isError || schedulesQuery.isError,
    error: doctorsQuery.error ?? schedulesQuery.error,
    refetch,
    scheduleFormOpen,
    openScheduleForm,
    closeScheduleForm,
    scheduleControl: scheduleForm.control,
    scheduleErrors: scheduleForm.formState.errors,
    setScheduleValue: scheduleForm.setValue,
    isCreatingSchedule: scheduleForm.formState.isSubmitting,
    onCreateSchedule,
    scheduleError,
    scheduleSuccess,
    generationControl: generationForm.control,
    generationErrors: generationForm.formState.errors,
    setGenerationValue: generationForm.setValue,
    onGenerateSlots,
    isGenerating,
    generationError,
    generationSuccess,
    generatedSlots,
  };
}
