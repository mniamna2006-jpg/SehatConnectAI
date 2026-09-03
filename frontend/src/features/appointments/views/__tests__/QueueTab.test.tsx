import { render, screen } from '@testing-library/react-native';
import { useQueueViewModel } from '../../viewmodels/useQueueViewModel';
import { QueueTab } from '../QueueTab';

jest.mock('../../viewmodels/useQueueViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);

test('shows the doctor and hospital name from the enriched appointment, never a raw id', async () => {
  (useQueueViewModel as jest.Mock).mockReturnValue({
    queue: [
      {
        queue_id: 'q1',
        hospital_id: 'hosp-11111111-1111-1111-1111-111111111111',
        doctor_id: 'doc-22222222-2222-2222-2222-222222222222',
        appointment_id: 'a1',
        token_number: 14,
        queue_status: 'WAITING',
        appointment: {
          appointment_time: '09:00',
          appointment_time_12h: '9:00 AM',
          doctor: { name: 'Dr. Ahmed Khan' },
          hospital: { name: 'SehatConnect Test Hospital' },
        },
      },
    ],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  await render(<QueueTab />);

  expect(screen.getByText('14')).toBeOnTheScreen();
  expect(screen.getByText('Dr. Ahmed Khan')).toBeOnTheScreen();
  expect(screen.getByText('SehatConnect Test Hospital')).toBeOnTheScreen();
  expect(screen.queryByText(/hosp-|doc-/)).not.toBeOnTheScreen();
});
