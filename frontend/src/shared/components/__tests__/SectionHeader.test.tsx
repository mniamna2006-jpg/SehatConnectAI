import { render, screen } from '@testing-library/react-native';
import { SectionHeader } from '../SectionHeader';

test('announces section title and renders optional detail', async () => {
  await render(<SectionHeader title="Doctors" detail="3 available" />);

  expect(screen.getByRole('header', { name: 'Doctors' })).toBeOnTheScreen();
  expect(screen.getByText('3 available')).toBeOnTheScreen();
});
