import { fireEvent, render, screen } from '@testing-library/react-native';
import { SearchBar } from '../SearchBar';

jest.mock('@expo/vector-icons/Ionicons', () => () => null);

test('provides accessible search input and forwards query changes', async () => {
  const onChangeText = jest.fn();
  await render(
    <SearchBar
      accessibilityLabel="Doctor name or specialty"
      placeholder="Search doctors"
      value=""
      onChangeText={onChangeText}
    />
  );

  await fireEvent.changeText(screen.getByLabelText('Doctor name or specialty'), 'Cardiology');

  expect(onChangeText).toHaveBeenCalledWith('Cardiology');
  expect(screen.getByPlaceholderText('Search doctors')).toBeOnTheScreen();
});
