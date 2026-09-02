import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { TestQueryProvider } from '../../../../../core/query/testUtils';
import { useHospitalAuth } from '../../../../../providers/HospitalAuthProvider';
import { getDoctors } from '../../../doctors/model/api';
import { createDoctorSchedule, generateTimeSlots, getDoctorSchedules } from '../../model/api';
import { useDoctorSchedulesViewModel } from '../useDoctorSchedulesViewModel';

jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('../../../../../providers/HospitalAuthProvider');
jest.mock('../../../doctors/model/api');
jest.mock('../../model/api');

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

const doctor = {
  doctor_id: 'doctor-1',
  hospital_id: 'hospital-1',
  department_id: 'department-1',
  name: 'Dr. Amina Shah',
  specialization: 'Cardiology',
  qualification: 'FCPS',
  license_number: 'PMC-1001',
  bio: null,
  consultation_fee: '2500.00',
  is_active: true,
};

const schedule = {
  schedule_id: 'schedule-1',
  doctor_id: 'doctor-1',
  day_of_week: 'MONDAY',
  start_time: '09:00',
  end_time: '12:00',
  start_time_12h: '9:00 AM',
  end_time_12h: '12:00 PM',
  appointment_duration: 30,
  is_active: true,
};

const slot = {
  slot_id: 'slot-1',
  doctor_id: 'doctor-1',
  hospital_id: 'hospital-1',
  date: '2026-09-07T00:00:00.000Z',
  start_time: '09:00',
  end_time: '09:30',
  status: 'AVAILABLE',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useLocalSearchParams as jest.Mock).mockReturnValue({ doctorId: 'doctor-1' });
  (useHospitalAuth as jest.Mock).mockReturnValue({
    hospitalUser: { hospital: { hospital_id: 'hospital-1' } },
  });
  (getDoctors as jest.Mock).mockResolvedValue([doctor]);
  (getDoctorSchedules as jest.Mock).mockResolvedValue([schedule]);
});

test('loads schedules only after resolving the real doctor in the admin hospital', async () => {
  const { result } = await renderHook(() => useDoctorSchedulesViewModel(), { wrapper });

  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.schedules).toHaveLength(1));
  expect(getDoctors).toHaveBeenCalledWith('hospital-1');
  expect(getDoctorSchedules).toHaveBeenCalledWith('doctor-1');
  expect(result.current.doctor?.name).toBe('Dr. Amina Shah');
});

test('creates a schedule with the exact backend-supported payload', async () => {
  (createDoctorSchedule as jest.Mock).mockResolvedValue(schedule);
  const { result } = await renderHook(() => useDoctorSchedulesViewModel(), { wrapper });
  await waitFor(() => expect(result.current.schedules).toHaveLength(1));

  await act(() => result.current.openScheduleForm());
  await act(() => {
    result.current.setScheduleValue('day_of_week', 'MONDAY');
    result.current.setScheduleValue('start_time', '09:00');
    result.current.setScheduleValue('end_time', '12:00');
    result.current.setScheduleValue('appointment_duration', '30');
  });
  await act(async () => result.current.onCreateSchedule());

  expect(createDoctorSchedule).toHaveBeenCalledWith({
    doctor_id: 'doctor-1',
    day_of_week: 'MONDAY',
    start_time: '09:00',
    end_time: '12:00',
    appointment_duration: 30,
  });
  expect(result.current.scheduleSuccess).toBe('Schedule created.');
});

test('surfaces backend schedule creation errors and keeps the form open', async () => {
  (createDoctorSchedule as jest.Mock).mockRejectedValue(new Error('Schedule already exists'));
  const { result } = await renderHook(() => useDoctorSchedulesViewModel(), { wrapper });
  await waitFor(() => expect(result.current.schedules).toHaveLength(1));

  await act(() => result.current.openScheduleForm());
  await act(() => {
    result.current.setScheduleValue('day_of_week', 'MONDAY');
    result.current.setScheduleValue('start_time', '09:00');
    result.current.setScheduleValue('end_time', '12:00');
    result.current.setScheduleValue('appointment_duration', '30');
  });
  await act(async () => result.current.onCreateSchedule());

  expect(result.current.scheduleError).toBe('Schedule already exists');
  expect(result.current.scheduleFormOpen).toBe(true);
});

test('generates and exposes only slots returned by the backend', async () => {
  (generateTimeSlots as jest.Mock).mockResolvedValue([slot]);
  const { result } = await renderHook(() => useDoctorSchedulesViewModel(), { wrapper });
  await waitFor(() => expect(result.current.schedules).toHaveLength(1));

  await act(() => result.current.setGenerationValue('date', '2026-09-07'));
  await act(async () => result.current.onGenerateSlots());

  expect(generateTimeSlots).toHaveBeenCalledWith({
    doctor_id: 'doctor-1',
    hospital_id: 'hospital-1',
    date: '2026-09-07',
  });
  expect(result.current.generatedSlots).toEqual([slot]);
  expect(result.current.generationSuccess).toBe('1 time slot generated.');
});

test('prevents duplicate slot generation while a request is in flight', async () => {
  let resolveGeneration: ((slots: typeof slot[]) => void) | undefined;
  (generateTimeSlots as jest.Mock).mockReturnValue(new Promise((resolve) => {
    resolveGeneration = resolve;
  }));
  const { result } = await renderHook(() => useDoctorSchedulesViewModel(), { wrapper });
  await waitFor(() => expect(result.current.schedules).toHaveLength(1));
  await act(() => result.current.setGenerationValue('date', '2026-09-07'));

  let firstRequest: Promise<void> | undefined;
  let duplicateRequest: Promise<void> | undefined;
  await act(() => {
    firstRequest = result.current.onGenerateSlots();
    duplicateRequest = result.current.onGenerateSlots();
  });
  await waitFor(() => expect(generateTimeSlots).toHaveBeenCalledTimes(1));

  resolveGeneration?.([slot]);
  await act(async () => Promise.all([firstRequest, duplicateRequest]));
  expect(generateTimeSlots).toHaveBeenCalledTimes(1);
});

test('surfaces backend time-slot generation errors', async () => {
  (generateTimeSlots as jest.Mock).mockRejectedValue(new Error('Doctor has no active schedule for MONDAY'));
  const { result } = await renderHook(() => useDoctorSchedulesViewModel(), { wrapper });
  await waitFor(() => expect(result.current.schedules).toHaveLength(1));

  await act(() => result.current.setGenerationValue('date', '2026-09-07'));
  await act(async () => result.current.onGenerateSlots());

  expect(result.current.generationError).toBe('Doctor has no active schedule for MONDAY');
  expect(result.current.generatedSlots).toEqual([]);
});
