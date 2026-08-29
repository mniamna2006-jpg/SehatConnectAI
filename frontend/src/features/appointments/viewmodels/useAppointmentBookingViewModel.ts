import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { ApiError } from '../../../core/api/client';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { getDepartmentsByHospital } from '../../departments/model/api';
import { getDoctorsByHospital } from '../../doctors/model/api';
import { getHospitals } from '../../hospitals/model/api';
import { createAppointment, getTimeSlots } from '../model/api';
import { bookingSchema, type BookingInput } from '../model/schemas';

interface AppointmentPrefill {
  doctorId?: string;
  hospitalId?: string;
  departmentId?: string;
}

export function useAppointmentBookingViewModel(prefill: AppointmentPrefill) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
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

  const { data: hospitals = [], isLoading: isLoadingHospitals } = useQuery({
    queryKey: queryKeys.hospitals(),
    queryFn: getHospitals,
  });
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: queryKeys.departmentsByHospital(hospitalId),
    queryFn: () => getDepartmentsByHospital(hospitalId),
    enabled: hospitalId.length > 0,
  });
  const { data: hospitalDoctors = [], isLoading: isLoadingDoctors } = useQuery({
    queryKey: queryKeys.doctorsByHospital(hospitalId),
    queryFn: () => getDoctorsByHospital(hospitalId),
    enabled: hospitalId.length > 0,
  });
  const doctors = departmentId
    ? hospitalDoctors.filter((doctor) => doctor.department_id === departmentId)
    : hospitalDoctors;

  const { data: allTimeSlots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: queryKeys.timeSlots(doctorId, selectedDate),
    queryFn: () => getTimeSlots(doctorId, selectedDate),
    enabled: doctorId.length > 0 && selectedDate.length > 0,
  });
  const timeSlots = allTimeSlots.filter((slot) => slot.status === 'AVAILABLE');

  const mutation = useMutation({
    mutationFn: (values: BookingInput) => createAppointment(values),
    onSuccess: (appointment) => {
      setBookingSuccess(`Booked: ${appointment.booking_reference}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.myAppointments });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeSlots(doctorId, selectedDate) });
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
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setBookingError(
        error instanceof ApiError && error.status === 400
          ? 'This slot was just taken'
          : 'Booking failed. Please try again.'
      );
      if (doctorId && selectedDate) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.timeSlots(doctorId, selectedDate),
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
    selectedSlotId,
    isLoadingHospitals,
    isLoadingDepartments,
    isLoadingDoctors,
    isLoadingSlots,
    onSelectHospital,
    onSelectDepartment,
    onSelectDoctor,
    onSelectDate,
    onSelectSlot,
    onSubmit,
    isSubmitting,
    bookingError,
    bookingSuccess,
  };
}
