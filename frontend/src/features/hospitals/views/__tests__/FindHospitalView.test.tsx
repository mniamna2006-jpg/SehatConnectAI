import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { useFindHospitalViewModel } from '../../viewmodels/useFindHospitalViewModel';
import { FindHospitalView } from '../FindHospitalView';

jest.mock('../../viewmodels/useFindHospitalViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => {
  const { View: MockView } = require('react-native');
  return {
    router: { back: jest.fn() },
    Link: ({ children, href }: { children: ReactNode; href: string }) => (
      <MockView accessibilityRole="link" accessibilityLabel={href}>{children}</MockView>
    ),
  };
});

const selector = {
  mode: 'manual',
  coordinates: null,
  permissionDenied: false,
  locationUnavailable: false,
  isRequestingGps: false,
  manualCity: 'Karachi',
  requestGpsLocation: jest.fn(),
  setManualCity: jest.fn(),
  reset: jest.fn(),
};

test('renders hospital identity, optional metadata, fallback logo, and details action', async () => {
  (useFindHospitalViewModel as jest.Mock).mockReturnValue({
    hospitals: [{
      hospital_id: 'h1',
      name: 'City Hospital',
      facility_type: 'HOSPITAL',
      address: 'Main Road, Karachi',
      phone: '+92 21 111 222 333',
      distance_km: 2.45,
    }],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    selector,
  });

  await render(<FindHospitalView />);

  expect(screen.getByText('City Hospital')).toBeOnTheScreen();
  expect(screen.getByText('Main Road, Karachi')).toBeOnTheScreen();
  expect(screen.getByText('+92 21 111 222 333')).toBeOnTheScreen();
  expect(screen.getByText('2.5 km away')).toBeOnTheScreen();
  expect(screen.getByLabelText('City Hospital logo')).toBeOnTheScreen();
  expect(screen.getByLabelText('/hospital/h1')).toBeOnTheScreen();
});
