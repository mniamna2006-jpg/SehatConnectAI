import { fireEvent, render, screen } from '@testing-library/react-native';
import type { LocationMode } from '../../../core/location/useLocationSelector';
import { useAuth } from '../../../providers/AuthProvider';
import { LocaleProvider } from '../../../providers/LocaleProvider';
import { LocationPicker } from '../LocationPicker';

jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('../../../providers/AuthProvider');

function baseSelector() {
  return {
    mode: 'manual' as LocationMode,
    coordinates: null,
    permissionDenied: false,
    locationUnavailable: false,
    isRequestingGps: false,
    manualCity: '',
    requestGpsLocation: jest.fn(),
    setManualCity: jest.fn(),
    reset: jest.fn(),
  };
}

function selector(overrides: Partial<ReturnType<typeof baseSelector>> = {}) {
  return { ...baseSelector(), ...overrides };
}

test('supports GPS action and manual city entry', async () => {
  const requestGpsLocation = jest.fn();
  const setManualCity = jest.fn();
  await render(<LocationPicker selector={selector({ requestGpsLocation, setManualCity })} />);

  await fireEvent.press(screen.getByRole('button', { name: 'Use Current Location' }));
  await fireEvent.changeText(screen.getByLabelText('City or area'), 'Karachi');

  expect(requestGpsLocation).toHaveBeenCalledTimes(1);
  expect(setManualCity).toHaveBeenCalledWith('Karachi');
  expect(screen.getByPlaceholderText('e.g. Gulshan-e-Iqbal, Karachi')).toBeOnTheScreen();
});

test.each([
  { permissionDenied: true },
  { locationUnavailable: true },
])('shows manual recovery when GPS is denied or unavailable', async (state) => {
  await render(<LocationPicker selector={selector(state)} />);

  expect(screen.getByTestId('location-notice')).toHaveTextContent("Couldn't use your location. Search by city instead.");
});

test('disables GPS action while location request is active', async () => {
  await render(<LocationPicker selector={selector({ isRequestingGps: true })} />);

  expect(screen.getByTestId('use-current-location')).toBeDisabled();
});

test('renders location controls in the Urdu locale', async () => {
  (useAuth as jest.Mock).mockReturnValue({ user: { preferred_language: 'URDU' } });

  await render(
    <LocaleProvider>
      <LocationPicker selector={selector()} />
    </LocaleProvider>
  );

  expect(screen.getByText('آپ کا مقام')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'موجودہ مقام استعمال کریں' })).toBeOnTheScreen();
  expect(screen.getByLabelText('شہر یا علاقہ')).toBeOnTheScreen();
});
