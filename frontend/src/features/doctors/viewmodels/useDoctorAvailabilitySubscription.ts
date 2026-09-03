import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/constants/queryKeys';
import {
  getDoctorAvailabilitySubscription,
  subscribeToDoctorAvailability,
  unsubscribeFromDoctorAvailability,
} from '../model/api';

// Doctor list/detail endpoints already return `is_available` (see FRONTEND_API_CONTRACTS.md);
// the subscription endpoint only needs to be queried once a doctor is confirmed unavailable,
// since that's the only case where a "notify me" alert can be managed.
export function useDoctorAvailabilitySubscription(doctorId: string, isAvailable: boolean) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.doctorAvailabilitySubscription(doctorId);
  const subscriptionQuery = useQuery({
    queryKey,
    queryFn: () => getDoctorAvailabilitySubscription(doctorId),
    enabled: doctorId.length > 0 && !isAvailable,
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
