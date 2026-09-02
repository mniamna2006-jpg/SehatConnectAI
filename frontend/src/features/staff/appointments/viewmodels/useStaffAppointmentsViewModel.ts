import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../../shared/constants/queryKeys';
import type { AppointmentStatus } from '../../../../shared/types/api';
import { getStaffTodayAppointments, updateAppointmentStatus } from '../model/api';

/** Mirrors the server-enforced transition table in appointment.routes.js — used only to decide which action buttons to show; the backend remains the source of truth. */
const NEXT_STATUS_OPTIONS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  BOOKED: ['CONFIRMED', 'CHECKED_IN', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
};

export function nextStatusOptions(status: AppointmentStatus): AppointmentStatus[] {
  return NEXT_STATUS_OPTIONS[status] ?? [];
}

export function useStaffAppointmentsViewModel() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.staffTodayAppointments,
    queryFn: getStaffTodayAppointments,
  });

  const mutation = useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(appointmentId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staffTodayAppointments });
      void queryClient.invalidateQueries({ queryKey: queryKeys.staffQueue });
    },
    onError: () => setActionError('Unable to update appointment status. Please try again.'),
    onSettled: () => setPendingId(null),
  });

  const updateStatus = (appointmentId: string, status: AppointmentStatus) => {
    setActionError(null);
    setPendingId(appointmentId);
    mutation.mutate({ appointmentId, status });
  };

  return {
    date: data?.date,
    appointments: data?.appointments ?? [],
    isLoading,
    isError,
    refetch,
    actionError,
    pendingId,
    updateStatus,
  };
}
