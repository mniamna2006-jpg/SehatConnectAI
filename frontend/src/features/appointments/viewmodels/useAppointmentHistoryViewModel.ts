import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from '../../../providers/LocaleProvider';
import { queryKeys } from '../../../shared/constants/queryKeys';
import type { AppointmentStatus } from '../../../shared/types/api';
import { cancelAppointment, getMyAppointments } from '../model/api';

export type HistoryFilter = 'upcoming' | 'completed' | 'cancelled';

const FILTER_STATUSES: Record<HistoryFilter, AppointmentStatus[]> = {
  upcoming: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'],
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED', 'NO_SHOW'],
};

export function useAppointmentHistoryViewModel() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [filter, setFilter] = useState<HistoryFilter>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const {
    data: allAppointments = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.myAppointments,
    queryFn: getMyAppointments,
  });

  const appointments = allAppointments.filter((appointment) =>
    FILTER_STATUSES[filter].includes(appointment.status)
  );
  const mutation = useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onMutate: (id) => {
      setCancelError(null);
      setCancellingId(id);
    },
    onSettled: () => setCancellingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myAppointments });
    },
  });

  const onCancel = async (id: string) => {
    try {
      await mutation.mutateAsync(id);
    } catch {
      setCancelError(t('appointments.history.cancelError'));
    }
  };

  return {
    filter,
    setFilter,
    appointments,
    isLoading,
    isError,
    refetch,
    onCancel,
    isCancelling: (id: string) => cancellingId === id,
    cancelError,
  };
}
