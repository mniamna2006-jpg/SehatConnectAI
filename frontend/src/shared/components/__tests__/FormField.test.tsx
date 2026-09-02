import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FormField } from '../FormField';

jest.mock('@expo/vector-icons/Ionicons', () => () => null);

test('labels input accessibly and forwards text changes', async () => {
  const onChangeText = jest.fn();
  await render(<FormField label="Email" value="" onChangeText={onChangeText} />);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'patient@example.com');

  expect(onChangeText).toHaveBeenCalledWith('patient@example.com');
});

test('exposes validation error as an alert', async () => {
  await render(<FormField label="Email" error="Enter a valid email" />);

  expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
});

test('forwards focus and blur while preserving focus treatment', async () => {
  const onFocus = jest.fn();
  const onBlur = jest.fn();
  await render(<FormField testID="email" label="Email" onFocus={onFocus} onBlur={onBlur} />);

  await fireEvent(screen.getByTestId('email'), 'focus');
  expect(screen.getByTestId('email-shell')).toHaveStyle({ borderColor: '#2563EB' });
  expect(onFocus).toHaveBeenCalledTimes(1);

  await fireEvent(screen.getByTestId('email'), 'blur');
  expect(onBlur).toHaveBeenCalledTimes(1);
});

test('password action toggles visibility without clearing the typed value', async () => {
  function PasswordFieldHarness() {
    const [value, setValue] = useState('');
    return (
      <FormField
        label="Password"
        secureTextEntry
        value={value}
        onChangeText={setValue}
        passwordToggleLabels={{ show: 'Show password', hide: 'Hide password' }}
      />
    );
  }

  await render(<PasswordFieldHarness />);
  const input = screen.getByLabelText('Password');
  const showButton = screen.getByRole('button', { name: 'Show password' });
  expect(input).toHaveProp('secureTextEntry', true);
  expect(showButton).toHaveStyle({ minWidth: 48, minHeight: 48 });

  await fireEvent.changeText(input, 'AdminPassword123');
  await fireEvent.press(showButton);

  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', false);
  expect(screen.getByLabelText('Password')).toHaveDisplayValue('AdminPassword123');

  await fireEvent.press(screen.getByRole('button', { name: 'Hide password' }));

  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);
  expect(screen.getByLabelText('Password')).toHaveDisplayValue('AdminPassword123');
});
