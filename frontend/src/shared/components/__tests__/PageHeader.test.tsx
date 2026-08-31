import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { PageHeader } from '../PageHeader';

let mockIsRTL = false;

jest.mock('../../../providers/LocaleProvider', () => ({
  useOptionalLocale: () => ({ isRTL: mockIsRTL }),
}));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text: MockText } = require('react-native');
  return ({ name }: { name: string }) => <MockText testID={`icon-${name}`} />;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockIsRTL = false;
});

test('renders title, subtitle, right slot, and working back action', async () => {
  await render(<PageHeader title="Find Hospital" subtitle="Trusted care" right={<Text>Help</Text>} />);

  expect(screen.getByRole('header', { name: 'Find Hospital' })).toBeOnTheScreen();
  expect(screen.getByText('Trusted care')).toBeOnTheScreen();
  expect(screen.getByText('Help')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(router.back).toHaveBeenCalledTimes(1);
});

test('can hide back action', async () => {
  await render(<PageHeader title="Home" showBack={false} />);

  expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeOnTheScreen();
});

test('reverses back chevron for RTL', async () => {
  mockIsRTL = true;
  await render(<PageHeader title="Profile" />);

  expect(screen.getByTestId('icon-chevron-forward')).toBeOnTheScreen();
  expect(screen.queryByTestId('icon-chevron-back')).not.toBeOnTheScreen();
});
