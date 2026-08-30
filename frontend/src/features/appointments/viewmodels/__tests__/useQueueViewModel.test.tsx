import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import { getMyQueue } from '../../model/api';
import { useQueueViewModel } from '../useQueueViewModel';

jest.mock('../../model/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

test('fetches the patient active queue entries', async () => {
  (getMyQueue as jest.Mock).mockResolvedValue([
    {
      queue_id: 'q1',
      hospital_id: 'h1',
      doctor_id: 'd1',
      appointment_id: 'a1',
      queue_status: 'WAITING',
      token_number: 5,
    },
  ]);

  const { result } = await renderHook(() => useQueueViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.queue).toHaveLength(1);
  expect(getMyQueue).toHaveBeenCalled();
});
