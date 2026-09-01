import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ApiError } from '../../../../core/api/client';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import { getDepartmentsByHospital } from '../../../departments/model/api';
import { getDoctorById, getDoctorsByHospital } from '../../../doctors/model/api';
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
  (getDoctorById as jest.Mock).mockResolvedValue(undefined);
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

test('doctor-only prefill resolves hospital_id/department_id from the doctor detail without clearing doctor_id', async () => {
  (getDoctorById as jest.Mock).mockResolvedValue({
    doctor_id: 'd1',
    hospital_id: 'h1',
    department_id: 'dep1',
    name: 'Dr. Ali',
    is_active: true,
    hospital: { hospital_id: 'h1', name: 'City Hospital' },
    department: { department_id: 'dep1', name: 'Cardiology' },
    schedules: [],
  });

  const { result } = await renderHook(
    () => useAppointmentBookingViewModel({ doctorId: 'd1' }),
    { wrapper }
  );

  await waitFor(() => expect(getDoctorById).toHaveBeenCalledWith('d1'));
  await waitFor(() => expect(result.current.getValues('hospital_id')).toBe('h1'));
  expect(result.current.getValues('department_id')).toBe('dep1');
  expect(result.current.getValues('doctor_id')).toBe('d1');
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

test('exposes hospital, department, and doctor query failures with retry actions', async () => {
  (getHospitals as jest.Mock).mockRejectedValue(new Error('hospital outage'));
  (getDepartmentsByHospital as jest.Mock).mockRejectedValue(new Error('department outage'));
  (getDoctorsByHospital as jest.Mock).mockRejectedValue(new Error('doctor outage'));

  const { result } = await renderHook(
    () => useAppointmentBookingViewModel({ hospitalId: 'h1', departmentId: 'dep1' }),
    { wrapper }
  );

  await waitFor(() => {
    expect([
      result.current.isHospitalsError,
      result.current.isDepartmentsError,
      result.current.isDoctorsError,
    ]).toEqual([true, true, true]);
  });
  expect(typeof result.current.refetchHospitals).toBe('function');
  expect(typeof result.current.refetchDepartments).toBe('function');
  expect(typeof result.current.refetchDoctors).toBe('function');
});
