import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/constants/queryKeys';
import {
  getDoctorAvailabilitySubscription,
  subscribeToDoctorAvailability,
  unsubscribeFromDoctorAvailability,
} from '../model/api';

// Doctor list/detail endpoints never return `is_available` (see DATA_CONTRACTS.md) —
// this per-doctor endpoint is the only source of truth, so it must always be queried.
export function useDoctorAvailabilitySubscription(doctorId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.doctorAvailabilitySubscription(doctorId);
  const subscriptionQuery = useQuery({
    queryKey,
    queryFn: () => getDoctorAvailabilitySubscription(doctorId),
    enabled: doctorId.length > 0,
  });

  const mutation = useMutation({
    mutationFn: (subscribe: boolean) => subscribe
      ? subscribeToDoctorAvailability(doctorId)
      : unsubscribeFromDoctorAvailability(doctorId),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const canManageAlert = subscriptionQuery.data?.is_available === false;
  const subscribed = subscriptionQuery.data?.subscribed ?? false;
  const toggleAlert = () => {
    if (!canManageAlert || subscriptionQuery.data === undefined || mutation.isPending) return;
    mutation.mutate(!subscribed);
  };

  return {
    subscribed,
    isLoading: subscriptionQuery.isLoading,
    isError: subscriptionQuery.isError,
    isUpdating: mutation.isPending,
    hasMutationError: mutation.isError,
    canManageAlert,
    toggleAlert,
    refetch: subscriptionQuery.refetch,
  };
}
