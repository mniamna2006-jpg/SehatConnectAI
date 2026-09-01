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
