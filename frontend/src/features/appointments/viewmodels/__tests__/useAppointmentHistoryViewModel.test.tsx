import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import * as api from '../../model/api';
import { useAppointmentHistoryViewModel } from '../useAppointmentHistoryViewModel';

jest.mock('../../model/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

const appointments = [
  { appointment_id: 'a1', status: 'BOOKED' },
  { appointment_id: 'a2', status: 'COMPLETED' },
  { appointment_id: 'a3', status: 'CANCELLED' },
];

beforeEach(() => {
  jest.clearAllMocks();
  (api.getMyAppointments as jest.Mock).mockResolvedValue(appointments);
});

test('upcoming filter shows only active appointment statuses', async () => {
  const { result } = await renderHook(() => useAppointmentHistoryViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.appointments.map((appointment) => appointment.appointment_id)).toEqual([
    'a1',
  ]);
});

test('filter can switch to completed and cancelled appointments', async () => {
  const { result } = await renderHook(() => useAppointmentHistoryViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(() => result.current.setFilter('completed'));
  expect(result.current.appointments.map((appointment) => appointment.appointment_id)).toEqual([
    'a2',
  ]);

  await act(() => result.current.setFilter('cancelled'));
  expect(result.current.appointments.map((appointment) => appointment.appointment_id)).toEqual([
    'a3',
  ]);
});

test('onCancel calls cancelAppointment for the selected appointment', async () => {
  (api.cancelAppointment as jest.Mock).mockResolvedValue({
    appointment_id: 'a1',
    status: 'CANCELLED',
  });
  const { result } = await renderHook(() => useAppointmentHistoryViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    await result.current.onCancel('a1');
  });
  expect(api.cancelAppointment).toHaveBeenCalledWith('a1');
});
