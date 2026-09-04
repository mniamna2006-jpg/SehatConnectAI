import { fireEvent, render, screen } from '@testing-library/react-native';
import { useDoctorAvailabilitySubscription } from '../../viewmodels/useDoctorAvailabilitySubscription';
import { DoctorAvailabilityAlert } from '../DoctorAvailabilityAlert';

jest.mock('../../viewmodels/useDoctorAvailabilitySubscription');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);

function mockViewModel(overrides: Record<string, unknown> = {}) {
  (useDoctorAvailabilitySubscription as jest.Mock).mockReturnValue({
    subscribed: false,
    isLoading: false,
    isError: false,
    isUpdating: false,
    hasMutationError: false,
    canManageAlert: true,
    toggleAlert: jest.fn(),
    refetch: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => jest.clearAllMocks());

test('offers subscription for an unavailable doctor', async () => {
  const toggleAlert = jest.fn();
  mockViewModel({ toggleAlert });
  await render(<DoctorAvailabilityAlert doctorId="d1" isAvailable={false} />);

  await fireEvent.press(screen.getByRole('button', { name: 'Notify me when available' }));
  expect(toggleAlert).toHaveBeenCalledTimes(1);
});

test('shows active subscription and lets patient turn it off', async () => {
  const toggleAlert = jest.fn();
  mockViewModel({ subscribed: true, toggleAlert });
  await render(<DoctorAvailabilityAlert doctorId="d1" isAvailable={false} />);

  expect(screen.getByText('Availability alert on')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Turn off availability alert' }));
  expect(toggleAlert).toHaveBeenCalledTimes(1);
});

test('does not show subscription CTA for an available doctor', async () => {
  mockViewModel({ canManageAlert: false });
  await render(<DoctorAvailabilityAlert doctorId="d1" isAvailable={false} />);

  expect(screen.queryByRole('button')).not.toBeOnTheScreen();
});

test('shows loading, retry, and mutation failure states safely', async () => {
  mockViewModel({ isLoading: true });
  await render(<DoctorAvailabilityAlert doctorId="d1" isAvailable={false} />);
  expect(screen.getByText('Updating...')).toBeOnTheScreen();

  const refetch = jest.fn();
  mockViewModel({ isError: true, refetch });
  await screen.rerender(<DoctorAvailabilityAlert doctorId="d1" isAvailable={false} />);
  expect(screen.getByText('Unable to update availability')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(refetch).toHaveBeenCalledTimes(1);

  mockViewModel({ hasMutationError: true });
  await screen.rerender(<DoctorAvailabilityAlert doctorId="d1" isAvailable={false} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to update availability');
});
