import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { ApiError } from '../../../core/api/client';
import { useTranslations } from '../../../providers/LocaleProvider';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { getDepartmentsByHospital } from '../../departments/model/api';
import { getDoctorById, getDoctorsByHospital } from '../../doctors/model/api';
import { getHospitals } from '../../hospitals/model/api';
import { isTodayOrFutureDate } from '../../../shared/utils/dateValidation';
import { createAppointment, getTimeSlots } from '../model/api';
import { createBookingSchema, type BookingInput } from '../model/schemas';

interface AppointmentPrefill {
  doctorId?: string;
  hospitalId?: string;
  departmentId?: string;
}

export function useAppointmentBookingViewModel(prefill: AppointmentPrefill) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const bookingSchema = useMemo(() => createBookingSchema(t), [t]);
  const {
    control,
    getValues,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      doctor_id: prefill.doctorId ?? '',
      hospital_id: prefill.hospitalId ?? '',
      department_id: prefill.departmentId ?? '',
      slot_id: '',
      reason: '',
    },
  });

  const hospitalId = useWatch({ control, name: 'hospital_id' });
  const departmentId = useWatch({ control, name: 'department_id' });
  const doctorId = useWatch({ control, name: 'doctor_id' });
  const selectedSlotId = useWatch({ control, name: 'slot_id' });

  // Doctor-only prefill (no hospitalId/departmentId): resolve the doctor's
  // own hospital/department so the dependent queries below aren't stuck
  // disabled and the prefill survives mount.
  const hasDoctorOnlyPrefill =
  Boolean(prefill.doctorId) && !prefill.hospitalId && !prefill.departmentId;

const {
  data: prefillDoctor,
  isError: isPrefillDoctorError,
  isLoading: isLoadingPrefillDoctor,
  refetch: refetchPrefillDoctor,
} = useQuery({
  queryKey: queryKeys.doctor(prefill.doctorId ?? ''),
  queryFn: () => getDoctorById(prefill.doctorId as string),
  enabled: hasDoctorOnlyPrefill,
});

const isPrefilling = hasDoctorOnlyPrefill && isLoadingPrefillDoctor;
  useEffect(() => {
    if (!prefillDoctor) return;
    setValue('hospital_id', prefillDoctor.hospital.hospital_id);
    setValue('department_id', prefillDoctor.department.department_id);
  }, [prefillDoctor, setValue]);

  const {
    data: hospitals = [],
    isLoading: isLoadingHospitals,
    isError: isHospitalsError,
    refetch: refetchHospitals,
  } = useQuery({
    queryKey: queryKeys.hospitals(),
    queryFn: getHospitals,
  });
  const {
    data: departments = [],
    isLoading: isLoadingDepartments,
    isError: isDepartmentsError,
    refetch: refetchDepartments,
  } = useQuery({
    queryKey: queryKeys.departmentsByHospital(hospitalId),
    queryFn: () => getDepartmentsByHospital(hospitalId),
    enabled: hospitalId.length > 0,
  });
  const {
    data: hospitalDoctors = [],
    isLoading: isLoadingDoctors,
    isError: isHospitalDoctorsError,
    refetch: refetchHospitalDoctors,
  } = useQuery({
    queryKey: queryKeys.doctorsByHospital(hospitalId),
    queryFn: () => getDoctorsByHospital(hospitalId),
    enabled: hospitalId.length > 0,
  });
  const doctors = departmentId
    ? hospitalDoctors.filter((doctor) => doctor.department_id === departmentId)
    : hospitalDoctors;

  const debouncedDate = useDebouncedValue(selectedDate);
  const isCompleteDate = isTodayOrFutureDate(debouncedDate);
  const isInvalidDate = debouncedDate.length > 0 && !isCompleteDate;
  const {
    data: allTimeSlots = [],
    isLoading: isLoadingSlots,
    isError: isSlotsError,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: queryKeys.timeSlots(doctorId, debouncedDate),
    queryFn: () => getTimeSlots(doctorId, debouncedDate),
    enabled: doctorId.length > 0 && isCompleteDate,
  });
  const timeSlots = allTimeSlots.filter((slot) => slot.status === 'AVAILABLE');

  const mutation = useMutation({
    mutationFn: (values: BookingInput) => createAppointment(values),
    onSuccess: (appointment) => {
      setBookingSuccess(`${t('appointments.booking.booked')}: ${appointment.booking_reference}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.myAppointments });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeSlots(doctorId, debouncedDate) });
    },
  });

  const onSelectHospital = (id: string) => {
    setValue('hospital_id', id);
    setValue('department_id', '');
    setValue('doctor_id', '');
    setValue('slot_id', '');
  };
  const onSelectDepartment = (id: string) => {
    setValue('department_id', id);
    setValue('doctor_id', '');
    setValue('slot_id', '');
  };
  const onSelectDoctor = (id: string) => {
    setValue('doctor_id', id);
    setValue('slot_id', '');
  };
  const onSelectDate = (date: string) => {
    setSelectedDate(date);
    setValue('slot_id', '');
  };
  const onSelectSlot = (id: string) => setValue('slot_id', id);

  const onSubmit = handleSubmit(async (values) => {
    setBookingError(null);
    setBookingSuccess(null);
    const reason = values.reason?.trim();
    try {
      await mutation.mutateAsync({ ...values, reason: reason ? reason : undefined });
    } catch (error) {
      setBookingError(
        error instanceof ApiError && error.status === 400
          ? t('appointments.booking.slotTaken')
          : t('appointments.booking.failed')
      );
      if (doctorId && debouncedDate) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.timeSlots(doctorId, debouncedDate),
        });
      }
    }
  });

  return {
    control,
    errors,
    getValues,
    setValue,
    hospitals,
    departments,
    doctors,
    timeSlots,
    hospitalId,
    departmentId,
    doctorId,
    selectedDate,
    isInvalidDate,
    selectedSlotId,
    isLoadingHospitals,
    isLoadingDepartments,
    isLoadingDoctors,
    isLoadingSlots,
    isHospitalsError,
    isDepartmentsError,
    isDoctorsError: isPrefillDoctorError || isHospitalDoctorsError,
    isSlotsError,
    refetchHospitals,
    refetchDepartments,
    refetchDoctors: hasDoctorOnlyPrefill ? refetchPrefillDoctor : refetchHospitalDoctors,
    refetchSlots,
    onSelectHospital,
    onSelectDepartment,
    onSelectDoctor,
    onSelectDate,
    onSelectSlot,
    onSubmit,
    isSubmitting,
    isPrefilling,
    bookingError,
    bookingSuccess,
  };
}
