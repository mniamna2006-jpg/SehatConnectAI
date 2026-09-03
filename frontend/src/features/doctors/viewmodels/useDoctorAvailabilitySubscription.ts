import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/constants/queryKeys';
import {
  getDoctorAvailabilitySubscription,
  subscribeToDoctorAvailability,
  unsubscribeFromDoctorAvailability,
} from '../model/api';

export function useDoctorAvailabilitySubscription(
  doctorId: string,
  isAvailable: boolean
) {
  const queryClient = useQueryClient();
  const canManageAlert = !isAvailable;
  const queryKey = queryKeys.doctorAvailabilitySubscription(doctorId);
  const subscriptionQuery = useQuery({
    queryKey,
    queryFn: () => getDoctorAvailabilitySubscription(doctorId),
    enabled: doctorId.length > 0 && canManageAlert,
  });

  const mutation = useMutation({
    mutationFn: (subscribe: boolean) => subscribe
      ? subscribeToDoctorAvailability(doctorId)
      : unsubscribeFromDoctorAvailability(doctorId),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

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
