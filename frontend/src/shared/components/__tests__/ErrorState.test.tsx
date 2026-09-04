import { render, screen } from '@testing-library/react-native';
import { ErrorState } from '../ErrorState';

jest.mock('@expo/vector-icons/Ionicons', () => () => null);

test('default variant renders the full empty-state block with a title', async () => {
  await render(<ErrorState message="Could not load this." />);

  expect(screen.getByText('We couldn\'t load this')).toBeOnTheScreen();
  expect(screen.getByText('Could not load this.')).toBeOnTheScreen();
});

test('inline variant renders a compact banner with no title', async () => {
  await render(<ErrorState inline message="Could not cancel this appointment." />);

  expect(screen.queryByText('We couldn\'t load this')).not.toBeOnTheScreen();
  expect(screen.getByText('Could not cancel this appointment.')).toBeOnTheScreen();
});
