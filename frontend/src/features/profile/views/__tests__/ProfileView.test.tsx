import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import * as api from '../../model/api';
import { ProfileView } from '../ProfileView';

jest.mock('../../model/api');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => ({ router: { back: jest.fn(), replace: jest.fn() } }));
jest.mock('../../../../providers/AuthProvider', () => ({ useAuth: () => ({ logout: jest.fn().mockResolvedValue(undefined) }) }));

const profile = {
  patient_id: 'p1',
  user_id: 'u1',
  full_name: 'Ayesha Khan',
  email: 'ayesha@example.com',
  phone: '03001234567',
  preferred_language: 'ENGLISH' as const,
  date_of_birth: '1990-01-01',
  gender: 'Female',
  address: '123 Main Street',
  city: 'Karachi',
  emergency_contact: '03007654321',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (api.getProfile as jest.Mock).mockResolvedValue(profile);
  (api.updateProfile as jest.Mock).mockImplementation(async (input) => ({ ...profile, ...input }));
});

test('shows complete read-only identity without a location field', async () => {
  await render(<ProfileView />, { wrapper });

  expect(await screen.findByTestId('profile-full-name')).toHaveTextContent('Ayesha Khan');
  expect(screen.getByTestId('profile-email')).toHaveTextContent('ayesha@example.com');
  expect(screen.getByTestId('profile-phone')).toHaveTextContent('03001234567');
  expect(screen.getByTestId('profile-date-of-birth')).toHaveTextContent('1 Jan 1990');
  expect(screen.getByTestId('profile-gender')).toHaveTextContent('Female');
  expect(screen.getByTestId('profile-address')).toHaveTextContent('123 Main Street');
  expect(screen.getByTestId('profile-city')).toHaveTextContent('Karachi');
  expect(screen.getByTestId('profile-emergency-contact')).toHaveTextContent('03007654321');
  expect(screen.getByTestId('profile-preferred-language')).toHaveTextContent('English');
  expect(screen.queryByText(/^Location$/)).not.toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(router.back).toHaveBeenCalledTimes(1);
});

test('signs out and redirects to login from the profile screen', async () => {
  await render(<ProfileView />, { wrapper });

  await fireEvent.press(await screen.findByRole('button', { name: 'Sign Out' }));

  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
});

test('supports edit, preferred language, save, and cancel while email stays read-only', async () => {
  await render(<ProfileView />, { wrapper });
  expect(await screen.findByTestId('profile-edit')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Edit profile' }));

  expect(screen.getByLabelText('Full name')).toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: 'English', selected: true })).toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: 'اردو' })).toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: 'Roman Urdu' })).toBeOnTheScreen();
  expect(screen.queryByDisplayValue('ayesha@example.com')).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Save' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  expect(await screen.findByTestId('profile-email')).toHaveTextContent('ayesha@example.com');
});

test('saves editable profile fields without sending read-only email', async () => {
  await render(<ProfileView />, { wrapper });
  await fireEvent.press(await screen.findByRole('button', { name: 'Edit profile' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'اردو' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

  await waitFor(() => expect(api.updateProfile).toHaveBeenCalledTimes(1));
  expect(api.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
    full_name: 'Ayesha Khan',
    preferred_language: 'URDU',
  }));
  expect(api.updateProfile).not.toHaveBeenCalledWith(expect.objectContaining({ email: expect.anything() }));
});
