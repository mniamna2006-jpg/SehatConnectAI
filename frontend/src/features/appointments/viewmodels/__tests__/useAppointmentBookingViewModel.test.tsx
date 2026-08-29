import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ApiError } from '../../../../core/api/client';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import { getDepartmentsByHospital } from '../../../departments/model/api';
import { getDoctorsByHospital } from '../../../doctors/model/api';
import { getHospitals } from '../../../hospitals/model/api';
import * as api from '../../model/api';
import { useAppointmentBookingViewModel } from '../useAppointmentBookingViewModel';

jest.mock('../../model/api');
jest.mock('../../../hospitals/model/api');
jest.mock('../../../departments/model/api');
jest.mock('../../../doctors/model/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (getHospitals as jest.Mock).mockResolvedValue([]);
  (getDepartmentsByHospital as jest.Mock).mockResolvedValue([]);
  (getDoctorsByHospital as jest.Mock).mockResolvedValue([]);
  (api.getTimeSlots as jest.Mock).mockResolvedValue([]);
});

test('prefills doctor, hospital, and department from route params', async () => {
  const { result } = await renderHook(
    () =>
      useAppointmentBookingViewModel({
        doctorId: 'd1',
        hospitalId: 'h1',
        departmentId: 'dep1',
      }),
    { wrapper }
  );

  expect(result.current.getValues('doctor_id')).toBe('d1');
  expect(result.current.getValues('hospital_id')).toBe('h1');
  expect(result.current.getValues('department_id')).toBe('dep1');
  await waitFor(() => {
    expect([
      result.current.isLoadingHospitals,
      result.current.isLoadingDepartments,
      result.current.isLoadingDoctors,
    ]).toEqual([false, false, false]);
  });
});

test('onSelectDate loads available time slots for the chosen doctor and date', async () => {
  (api.getTimeSlots as jest.Mock).mockResolvedValue([
    {
      slot_id: 's1',
      doctor_id: 'd1',
      hospital_id: 'h1',
      date: '2026-09-01',
      start_time: '09:00',
      end_time: '09:30',
      status: 'AVAILABLE',
    },
  ]);
  const { result } = await renderHook(
    () => useAppointmentBookingViewModel({ doctorId: 'd1' }),
    { wrapper }
  );

  await act(() => {
    result.current.onSelectDate('2026-09-01');
  });

  await waitFor(() => expect(result.current.timeSlots).toHaveLength(1));
  expect(api.getTimeSlots).toHaveBeenCalledWith('d1', '2026-09-01');
});

test('onSubmit maps a 400 response to the slot-taken message', async () => {
  (api.createAppointment as jest.Mock).mockRejectedValue(
    new ApiError(400, 'backend text must not leak')
  );
  const { result } = await renderHook(
    () =>
      useAppointmentBookingViewModel({
        doctorId: 'd1',
        hospitalId: 'h1',
        departmentId: 'dep1',
      }),
    { wrapper }
  );

  await act(() => {
    result.current.setValue('slot_id', 's1');
  });
  await act(async () => {
    await result.current.onSubmit();
  });

  await waitFor(() => {
    expect(result.current.bookingError).toBe('This slot was just taken');
  });
});
