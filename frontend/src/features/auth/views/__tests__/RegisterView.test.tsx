import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRegisterViewModel } from '../../viewmodels/useRegisterViewModel';
import { RegisterView } from '../RegisterView';

const mockChangeHandlers = new Map<string, jest.Mock>();

jest.mock('../../viewmodels/useRegisterViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('react-hook-form', () => ({
  Controller: ({ name, render: renderField }: { name: string; render: (args: unknown) => ReactNode }) => {
    const onChange = jest.fn();
    mockChangeHandlers.set(name, onChange);
    return renderField({ field: { value: name === 'preferred_language' ? 'ENGLISH' : '', onChange } });
  },
}));
jest.mock('expo-router', () => {
  const { Text: MockText } = require('react-native');
  return {
    Link: ({ children, href }: { children: ReactNode; href: string }) => (
      <MockText accessibilityRole="link" accessibilityLabel={href}>{children}</MockText>
    ),
  };
});

const baseViewModel = {
  control: {},
  errors: {},
  onSubmit: jest.fn(),
  isSubmitting: false,
  apiError: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockChangeHandlers.clear();
  (useRegisterViewModel as jest.Mock).mockReturnValue({ ...baseViewModel, onSubmit: jest.fn() });
});

test('renders exact frozen registration fields and no location field', async () => {
  await render(<RegisterView />);

  for (const label of ['Full name', 'Email', 'Phone number', 'Password', 'Confirm password']) {
    expect(screen.getByLabelText(label)).toBeOnTheScreen();
  }
  expect(screen.getAllByRole('radio')).toHaveLength(3);
  expect(screen.getByRole('radio', { name: 'English', selected: true })).toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: 'اردو' })).toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: 'Roman Urdu' })).toBeOnTheScreen();
  expect(screen.queryByLabelText('Location')).not.toBeOnTheScreen();
  expect(screen.getByLabelText('/login')).toBeOnTheScreen();
});

test('forwards language selection and submit actions', async () => {
  const onSubmit = jest.fn();
  (useRegisterViewModel as jest.Mock).mockReturnValue({ ...baseViewModel, onSubmit });
  await render(<RegisterView />);

  await fireEvent.press(screen.getByRole('radio', { name: 'اردو' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

  expect(mockChangeHandlers.get('preferred_language')).toHaveBeenCalledWith('URDU');
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

test('password and confirmation visibility toggle independently', async () => {
  await render(<RegisterView />);
  const password = screen.getByLabelText('Password');
  const confirmation = screen.getByLabelText('Confirm password');
  expect(password).toHaveProp('secureTextEntry', true);
  expect(confirmation).toHaveProp('secureTextEntry', true);

  const showButtons = screen.getAllByRole('button', { name: 'Show password' });
  await fireEvent.press(showButtons[0]);
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', false);
  expect(screen.getByLabelText('Confirm password')).toHaveProp('secureTextEntry', true);

  await fireEvent.press(showButtons[1]);
  expect(screen.getByLabelText('Confirm password')).toHaveProp('secureTextEntry', false);
});
