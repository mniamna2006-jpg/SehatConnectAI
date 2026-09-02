import { fireEvent, render, screen } from '@testing-library/react-native';
import { StaffQueueView } from '../StaffQueueView';
import { useStaffQueueViewModel } from '../../viewmodels/useStaffQueueViewModel';

jest.mock('../../viewmodels/useStaffQueueViewModel', () => ({
  ...jest.requireActual('../../viewmodels/useStaffQueueViewModel'),
  useStaffQueueViewModel: jest.fn(),
}));
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

const baseVm = {
  queue: [],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  actionError: null,
  pendingId: null,
  advance: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

test('renders the loading state', async () => {
  (useStaffQueueViewModel as jest.Mock).mockReturnValue({ ...baseVm, isLoading: true });
  await render(<StaffQueueView />);
  expect(screen.getByText('Loading queue…')).toBeOnTheScreen();
});

test('renders the error state with retry', async () => {
  (useStaffQueueViewModel as jest.Mock).mockReturnValue({ ...baseVm, isError: true });
  await render(<StaffQueueView />);
  expect(screen.getByText("We couldn't load this")).toBeOnTheScreen();
});

test('renders the empty state', async () => {
  (useStaffQueueViewModel as jest.Mock).mockReturnValue(baseVm);
  await render(<StaffQueueView />);
  expect(screen.getByText('Queue is empty')).toBeOnTheScreen();
});

test('renders queue entries with the single next-transition action', async () => {
  const advance = jest.fn();
  (useStaffQueueViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    advance,
    queue: [
      { queue_id: 'q1', hospital_id: 'h1', doctor_id: 'd1', appointment_id: 'a1', token_number: 5, queue_status: 'WAITING', patient: { full_name: 'Bilal Ahmed' }, doctor: { name: 'Dr. Sana' } },
      { queue_id: 'q2', hospital_id: 'h1', doctor_id: 'd1', appointment_id: 'a2', token_number: 6, queue_status: 'COMPLETED', patient: { full_name: 'Sara Ali' }, doctor: { name: 'Dr. Sana' } },
    ],
  });
  await render(<StaffQueueView />);

  expect(screen.getByText('Bilal Ahmed')).toBeOnTheScreen();
  expect(screen.getByText('Sara Ali')).toBeOnTheScreen();
  expect(screen.getByTestId('queue-action-q1')).toBeOnTheScreen();
  expect(screen.queryByTestId('queue-action-q2')).not.toBeOnTheScreen();

  fireEvent.press(screen.getByTestId('queue-action-q1'));
  expect(advance).toHaveBeenCalledWith('q1', 'CALLED');
});
