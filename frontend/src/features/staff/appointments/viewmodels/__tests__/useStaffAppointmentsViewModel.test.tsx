import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../../core/query/testUtils';
import { getStaffTodayAppointments, updateAppointmentStatus } from '../../model/api';
import { nextStatusOptions, useStaffAppointmentsViewModel } from '../useStaffAppointmentsViewModel';

jest.mock('../../model/api');

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

const appointment = {
  appointment_id: 'a1',
  appointment_date: '2026-09-02',
  appointment_time: '10:00',
  appointment_time_12h: '10:00 AM',
  status: 'BOOKED' as const,
  patient: { user_id: 'u1', full_name: 'Bilal Ahmed', phone: null },
  doctor: { doctor_id: 'd1', name: 'Dr. Sana', specialization: 'Cardiology' },
  department: { department_id: 'dep1', name: 'Cardiology' },
};

beforeEach(() => jest.clearAllMocks());

test('nextStatusOptions mirrors the backend transition table', () => {
  expect(nextStatusOptions('BOOKED')).toEqual(['CONFIRMED', 'CHECKED_IN', 'CANCELLED']);
  expect(nextStatusOptions('CHECKED_IN')).toEqual(['IN_PROGRESS']);
  expect(nextStatusOptions('COMPLETED')).toEqual([]);
});

test("loads today's appointments", async () => {
  (getStaffTodayAppointments as jest.Mock).mockResolvedValue({ date: '2026-09-02', total: 1, appointments: [appointment] });

  const { result } = await renderHook(() => useStaffAppointmentsViewModel(), { wrapper });

  await waitFor(() => expect(result.current.appointments).toHaveLength(1));
});

test('updateStatus calls the backend and does not locally pre-empt the status', async () => {
  (getStaffTodayAppointments as jest.Mock).mockResolvedValue({ date: '2026-09-02', total: 1, appointments: [appointment] });
  (updateAppointmentStatus as jest.Mock).mockResolvedValue({ data: { ...appointment, status: 'CHECKED_IN' }, queue: { queue_id: 'q1' } });

  const { result } = await renderHook(() => useStaffAppointmentsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.appointments).toHaveLength(1));

  await act(() => result.current.updateStatus('a1', 'CHECKED_IN'));

  await waitFor(() => expect(updateAppointmentStatus).toHaveBeenCalledWith('a1', 'CHECKED_IN'));
});

test('surfaces an error when the backend rejects the transition', async () => {
  (getStaffTodayAppointments as jest.Mock).mockResolvedValue({ date: '2026-09-02', total: 1, appointments: [appointment] });
  (updateAppointmentStatus as jest.Mock).mockRejectedValue(new Error('Invalid transition'));

  const { result } = await renderHook(() => useStaffAppointmentsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.appointments).toHaveLength(1));

  await act(() => result.current.updateStatus('a1', 'CHECKED_IN'));

  await waitFor(() => expect(result.current.actionError).toBe('Unable to update appointment status. Please try again.'));
  expect(result.current.pendingId).toBeNull();
});
