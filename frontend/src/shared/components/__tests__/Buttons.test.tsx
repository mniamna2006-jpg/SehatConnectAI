import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppButton, IconButton } from '../Buttons';

jest.mock('@expo/vector-icons/Ionicons', () => () => null);

test.each(['primary', 'secondary', 'quiet', 'danger'] as const)('supports %s button variant', async (variant) => {
  await render(<AppButton label={`${variant} action`} variant={variant} onPress={jest.fn()} />);

  expect(screen.getByRole('button', { name: `${variant} action` })).toBeEnabled();
});

test('invokes enabled action and blocks disabled action', async () => {
  const onPress = jest.fn();
  await render(<AppButton label="Continue" onPress={onPress} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(onPress).toHaveBeenCalledTimes(1);

  await screen.rerender(<AppButton label="Continue" onPress={onPress} disabled />);
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
});

test('keeps loading action named, busy, and disabled', async () => {
  await render(<AppButton label="Save" loading onPress={jest.fn()} />);

  const button = screen.getByRole('button', { name: 'Save' });
  expect(button).toBeBusy();
  expect(button).toBeDisabled();
});

test('icon button provides compact 48px target plus hit slop', async () => {
  const onPress = jest.fn();
  await render(<IconButton icon="close" label="Close" onPress={onPress} />);

  const button = screen.getByRole('button', { name: 'Close' });
  expect(button).toHaveStyle({ width: 48, height: 48 });
  expect(button).toHaveProp('hitSlop', 8);
  await fireEvent.press(button);
  expect(onPress).toHaveBeenCalledTimes(1);
});
