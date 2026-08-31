import { fireEvent, render, screen } from '@testing-library/react-native';
import { useAuth } from '../../../../providers/AuthProvider';
import { LocaleProvider } from '../../../../providers/LocaleProvider';
import { useAppointmentsViewModel } from '../../viewmodels/useAppointmentsViewModel';
import { AppointmentsView } from '../AppointmentsView';

jest.mock('../../viewmodels/useAppointmentsViewModel');
jest.mock('../../../../providers/AuthProvider');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('../BookingTab', () => {
  const { Text: MockText } = require('react-native');
  return { BookingTab: () => <MockText>Booking content</MockText> };
});
jest.mock('../HistoryTab', () => {
  const { Text: MockText } = require('react-native');
  return { HistoryTab: () => <MockText>History content</MockText> };
});
jest.mock('../QueueTab', () => {
  const { Text: MockText } = require('react-native');
  return { QueueTab: () => <MockText>Queue content</MockText> };
});

test('renders one dominant appointment tablist and forwards tab selection', async () => {
  (useAuth as jest.Mock).mockReturnValue({ user: { preferred_language: 'ENGLISH' } });
  const setActiveTab = jest.fn();
  (useAppointmentsViewModel as jest.Mock).mockReturnValue({ activeTab: 'booking', setActiveTab });
  await render(<AppointmentsView />);

  expect(screen.getAllByRole('tab')).toHaveLength(3);
  expect(screen.getByRole('tab', { name: 'Booking', selected: true })).toBeOnTheScreen();
  expect(screen.getByText('Booking content')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('tab', { name: 'History' }));
  expect(setActiveTab).toHaveBeenCalledWith('history');
});

test('renders appointment navigation in the Urdu locale', async () => {
  (useAuth as jest.Mock).mockReturnValue({ user: { preferred_language: 'URDU' } });
  (useAppointmentsViewModel as jest.Mock).mockReturnValue({
    activeTab: 'booking',
    setActiveTab: jest.fn(),
  });

  await render(
    <LocaleProvider>
      <AppointmentsView />
    </LocaleProvider>
  );

  expect(screen.getByRole('header', { name: 'اپائنٹمنٹس' })).toBeOnTheScreen();
  expect(screen.getByRole('tab', { name: 'بکنگ', selected: true })).toBeOnTheScreen();
  expect(screen.getByRole('tab', { name: 'ہسٹری' })).toBeOnTheScreen();
  expect(screen.getByRole('tab', { name: 'قطار' })).toBeOnTheScreen();
});
