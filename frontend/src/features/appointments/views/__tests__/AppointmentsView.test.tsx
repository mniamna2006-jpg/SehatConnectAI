import { fireEvent, render, screen } from '@testing-library/react-native';
import { useAppointmentsViewModel } from '../../viewmodels/useAppointmentsViewModel';
import { AppointmentsView } from '../AppointmentsView';

jest.mock('../../viewmodels/useAppointmentsViewModel');
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
  const setActiveTab = jest.fn();
  (useAppointmentsViewModel as jest.Mock).mockReturnValue({ activeTab: 'booking', setActiveTab });
  await render(<AppointmentsView />);

  expect(screen.getAllByRole('tab')).toHaveLength(3);
  expect(screen.getByRole('tab', { name: 'Booking', selected: true })).toBeOnTheScreen();
  expect(screen.getByText('Booking content')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('tab', { name: 'History' }));
  expect(setActiveTab).toHaveBeenCalledWith('history');
});
