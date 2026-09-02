import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../../core/query/testUtils';
import { getHospitalQueue, updateQueueStatus } from '../../model/api';
import { nextQueueStatus, useStaffQueueViewModel } from '../useStaffQueueViewModel';

jest.mock('../../model/api');

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

const entry = {
  queue_id: 'q1',
  hospital_id: 'h1',
  doctor_id: 'd1',
  appointment_id: 'a1',
  token_number: 5,
  queue_status: 'WAITING' as const,
  patient: { full_name: 'Bilal Ahmed' },
  doctor: { name: 'Dr. Sana' },
};

beforeEach(() => jest.clearAllMocks());

test('nextQueueStatus mirrors the backend transition table', () => {
  expect(nextQueueStatus('WAITING')).toBe('CALLED');
  expect(nextQueueStatus('CALLED')).toBe('IN_PROGRESS');
  expect(nextQueueStatus('IN_PROGRESS')).toBe('COMPLETED');
  expect(nextQueueStatus('COMPLETED')).toBeUndefined();
  expect(nextQueueStatus('SKIPPED')).toBeUndefined();
});

test('loads the hospital queue', async () => {
  (getHospitalQueue as jest.Mock).mockResolvedValue([entry]);

  const { result } = await renderHook(() => useStaffQueueViewModel(), { wrapper });

  await waitFor(() => expect(result.current.queue).toHaveLength(1));
});

test('advance calls the backend and does not locally pre-empt state', async () => {
  (getHospitalQueue as jest.Mock).mockResolvedValue([entry]);
  (updateQueueStatus as jest.Mock).mockResolvedValue({ ...entry, queue_status: 'CALLED' });

  const { result } = await renderHook(() => useStaffQueueViewModel(), { wrapper });
  await waitFor(() => expect(result.current.queue).toHaveLength(1));

  await act(() => result.current.advance('q1', 'CALLED'));

  await waitFor(() => expect(updateQueueStatus).toHaveBeenCalledWith('q1', 'CALLED'));
});

test('surfaces an error when the backend rejects the transition', async () => {
  (getHospitalQueue as jest.Mock).mockResolvedValue([entry]);
  (updateQueueStatus as jest.Mock).mockRejectedValue(new Error('Invalid transition'));

  const { result } = await renderHook(() => useStaffQueueViewModel(), { wrapper });
  await waitFor(() => expect(result.current.queue).toHaveLength(1));

  await act(() => result.current.advance('q1', 'CALLED'));

  await waitFor(() => expect(result.current.actionError).toBe('Unable to update queue status. Please try again.'));
  expect(result.current.pendingId).toBeNull();
});
