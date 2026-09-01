import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Screen } from '../Screen';
import { colors } from '../../theme';

let mockIsRTL = false;

jest.mock('../../../providers/LocaleProvider', () => ({
  useOptionalLocale: () => ({ isRTL: mockIsRTL }),
}));

beforeEach(() => { mockIsRTL = false; });

test('renders content on premium canvas in LTR', async () => {
  await render(<Screen><Text>Patient content</Text></Screen>);

  const content = screen.getByText('Patient content');
  expect(content).toBeOnTheScreen();
  expect(content.parent).toHaveStyle({ backgroundColor: colors.canvas, direction: 'ltr' });
});

test('switches screen direction for Urdu', async () => {
  mockIsRTL = true;
  await render(<Screen><Text>اردو</Text></Screen>);

  expect(screen.getByText('اردو').parent).toHaveStyle({ direction: 'rtl' });
});
