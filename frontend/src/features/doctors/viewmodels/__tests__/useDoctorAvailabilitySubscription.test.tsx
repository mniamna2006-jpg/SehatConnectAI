import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import {
  getDoctorAvailabilitySubscription,
  subscribeToDoctorAvailability,
  unsubscribeFromDoctorAvailability,
} from '../../model/api';
import { useDoctorAvailabilitySubscription } from '../useDoctorAvailabilitySubscription';

jest.mock('../../model/api');

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (getDoctorAvailabilitySubscription as jest.Mock).mockResolvedValue({
    doctor_id: 'd1',
    subscribed: false,
    is_available: false,
  });
});

test('loads subscription state only for an unavailable doctor', async () => {
  const { result } = await renderHook(
    () => useDoctorAvailabilitySubscription('d1', false),
    { wrapper }
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(getDoctorAvailabilitySubscription).toHaveBeenCalledWith('d1');
  expect(result.current.subscribed).toBe(false);
});

test('does not request or expose a subscription action for an available doctor', async () => {
  const { result } = await renderHook(
    () => useDoctorAvailabilitySubscription('d1', true),
    { wrapper }
  );

  expect(result.current.canManageAlert).toBe(false);
  expect(getDoctorAvailabilitySubscription).not.toHaveBeenCalled();
});

test('subscribes and refreshes server-owned state', async () => {
  (subscribeToDoctorAvailability as jest.Mock).mockResolvedValue({
    doctor_id: 'd1', subscribed: true, is_available: false,
  });
  (getDoctorAvailabilitySubscription as jest.Mock)
    .mockResolvedValueOnce({ doctor_id: 'd1', subscribed: false, is_available: false })
    .mockResolvedValue({ doctor_id: 'd1', subscribed: true, is_available: false });
  const { result } = await renderHook(
    () => useDoctorAvailabilitySubscription('d1', false),
    { wrapper }
  );
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(() => result.current.toggleAlert());

  await waitFor(() => expect(subscribeToDoctorAvailability).toHaveBeenCalledWith('d1'));
  await waitFor(() => expect(result.current.subscribed).toBe(true));
});

test('unsubscribes and refreshes server-owned state', async () => {
  (getDoctorAvailabilitySubscription as jest.Mock)
    .mockResolvedValueOnce({ doctor_id: 'd1', subscribed: true, is_available: false })
    .mockResolvedValue({ doctor_id: 'd1', subscribed: false, is_available: false });
  (unsubscribeFromDoctorAvailability as jest.Mock).mockResolvedValue({
    doctor_id: 'd1', subscribed: false,
  });
  const { result } = await renderHook(
    () => useDoctorAvailabilitySubscription('d1', false),
    { wrapper }
  );
  await waitFor(() => expect(result.current.subscribed).toBe(true));

  await act(() => result.current.toggleAlert());

  await waitFor(() => expect(unsubscribeFromDoctorAvailability).toHaveBeenCalledWith('d1'));
  await waitFor(() => expect(result.current.subscribed).toBe(false));
});

test('surfaces mutation failure without inventing local subscription state', async () => {
  (subscribeToDoctorAvailability as jest.Mock).mockRejectedValue(new Error('offline'));
  const { result } = await renderHook(
    () => useDoctorAvailabilitySubscription('d1', false),
    { wrapper }
  );
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(() => result.current.toggleAlert());

  await waitFor(() => expect(result.current.hasMutationError).toBe(true));
  expect(result.current.subscribed).toBe(false);
});
