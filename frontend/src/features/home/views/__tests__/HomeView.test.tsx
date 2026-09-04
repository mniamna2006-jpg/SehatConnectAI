import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { useHomeViewModel } from '../../viewmodels/useHomeViewModel';
import { HomeView } from '../HomeView';

let mockIsRTL = false;

jest.mock('../../viewmodels/useHomeViewModel');
jest.mock('../../../notifications/views/NotificationBell', () => ({ NotificationBell: () => null }));
jest.mock('../../../../providers/LocaleProvider', () => {
  const { translate } = require('../../../../i18n');
  return {
    useOptionalLocale: () => ({ isRTL: mockIsRTL }),
    useTranslations: () => (key: string) => translate(mockIsRTL ? 'URDU' : 'ENGLISH', key),
  };
});
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text: MockText } = require('react-native');
  return ({ name }: { name: string }) => <MockText testID={`icon-${name}`} />;
});

beforeEach(() => {
  mockIsRTL = false;
});
jest.mock('expo-router', () => {
  const { View: MockView } = require('react-native');
  return {
    Link: ({ children, href }: { children: ReactNode; href: string }) => (
      <MockView accessibilityRole="link" accessibilityLabel={href}>
        {children}
      </MockView>
    ),
  };
});

test('presents patient identity and the four frozen care actions', async () => {
  (useHomeViewModel as jest.Mock).mockReturnValue({
    user: { full_name: 'Demo Patient' },
    hasAppointmentHistory: true,
  });

  await render(<HomeView />);

  expect(screen.getByText('Demo Patient')).toBeOnTheScreen();
  expect(screen.getByText('How can we help you today?')).toBeOnTheScreen();
  expect(screen.getByLabelText('/find-hospital')).toBeOnTheScreen();
  expect(screen.getByLabelText('/find-doctor')).toBeOnTheScreen();
  expect(screen.getByLabelText('/find-department')).toBeOnTheScreen();
  expect(screen.getByLabelText('/appointments')).toBeOnTheScreen();
  expect(screen.getByLabelText('/ai-chat')).toBeOnTheScreen();
});

test('keeps sign-out off the home screen; it lives on the profile screen instead', async () => {
  (useHomeViewModel as jest.Mock).mockReturnValue({
    user: { full_name: 'Demo Patient' },
  });

  await render(<HomeView />);

  expect(screen.queryByTestId('home-logout')).not.toBeOnTheScreen();
  expect(screen.queryByLabelText('Log out')).not.toBeOnTheScreen();
});

test('flips the appointment-details disclosure chevron for RTL locales', async () => {
  (useHomeViewModel as jest.Mock).mockReturnValue({ user: { full_name: 'Demo Patient' }, hasAppointmentHistory: true });

  await render(<HomeView />);
  expect(screen.getByTestId('icon-chevron-forward')).toBeOnTheScreen();
  expect(screen.queryByTestId('icon-chevron-back')).not.toBeOnTheScreen();
  expect(screen.getAllByTestId('action-arrow-wrap')[0]).toHaveStyle({ right: 16, left: undefined });

  mockIsRTL = true;
  await render(<HomeView />);
  expect(screen.getAllByTestId('icon-chevron-back').length).toBeGreaterThan(0);
  expect(screen.getAllByTestId('action-arrow-wrap')[0]).toHaveStyle({ left: 16, right: undefined });
});

test('has no appointment link at all for a patient with zero appointment history', async () => {
  (useHomeViewModel as jest.Mock).mockReturnValue({
    user: { full_name: 'Demo Patient' },
    hasAppointmentHistory: false,
  });

  await render(<HomeView />);

  expect(screen.queryByLabelText('/appointments')).not.toBeOnTheScreen();
  expect(screen.getByText('Care starts with the right place')).toBeOnTheScreen();
});

test('gives the upcoming appointment priority over the discovery hero', async () => {
  (useHomeViewModel as jest.Mock).mockReturnValue({
    user: { full_name: 'Demo Patient' },
    hasAppointmentHistory: true,
    upcomingAppointment: {
      appointment_date: '2026-09-10',
      appointment_time: '09:00',
      doctor: { name: 'Dr. Ali Raza' },
      hospital: { name: 'City General Hospital' },
    },
  });

  await render(<HomeView />);

  expect(screen.getByText('Dr. Ali Raza')).toBeOnTheScreen();
  expect(screen.getByText('City General Hospital')).toBeOnTheScreen();
  expect(screen.getByLabelText('/appointments')).toBeOnTheScreen();
  expect(screen.queryByText('Care starts with the right place')).not.toBeOnTheScreen();
});
