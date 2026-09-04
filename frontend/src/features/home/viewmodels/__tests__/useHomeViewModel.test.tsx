import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import * as api from '../../../appointments/model/api';
import { useHomeViewModel } from '../useHomeViewModel';
import { useAuth } from '../../../../providers/AuthProvider';

jest.mock('../../../../providers/AuthProvider');
jest.mock('../../../appointments/model/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ user: { full_name: 'Ayesha' }, logout: jest.fn() });
});

test('exposes the authenticated patient without a logout action', async () => {
  (api.getMyAppointments as jest.Mock).mockResolvedValue([]);

  const { result } = await renderHook(() => useHomeViewModel(), { wrapper });
  await waitFor(() => expect(result.current.hasAppointmentHistory).toBe(false));

  expect(result.current.user).toEqual({ full_name: 'Ayesha' });
  expect(result.current).not.toHaveProperty('onLogout');
});

test('picks the soonest active appointment as the upcoming one', async () => {
  (api.getMyAppointments as jest.Mock).mockResolvedValue([
    { appointment_id: 'later', status: 'BOOKED', appointment_date: '2026-09-10', appointment_time: '09:00' },
    { appointment_id: 'sooner', status: 'CONFIRMED', appointment_date: '2026-09-05', appointment_time: '14:00' },
    { appointment_id: 'past', status: 'COMPLETED', appointment_date: '2026-08-01', appointment_time: '10:00' },
  ]);

  const { result } = await renderHook(() => useHomeViewModel(), { wrapper });
  await waitFor(() => expect(result.current.upcomingAppointment).toBeDefined());

  expect(result.current.upcomingAppointment?.appointment_id).toBe('sooner');
  expect(result.current.hasAppointmentHistory).toBe(true);
});

test('has no upcoming appointment when there are none active', async () => {
  (api.getMyAppointments as jest.Mock).mockResolvedValue([]);

  const { result } = await renderHook(() => useHomeViewModel(), { wrapper });
  await waitFor(() => expect(result.current.hasAppointmentHistory).toBe(false));

  expect(result.current.upcomingAppointment).toBeUndefined();
});
