import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { DoctorCard } from '../DoctorCard';

jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => {
  const { View: MockView } = require('react-native');
  return {
    Link: ({ children, href }: { children: ReactNode; href: string }) => (
      <MockView accessibilityRole="link" accessibilityLabel={href}>{children}</MockView>
    ),
  };
});

test('renders clinician identity, one hospital, 12-hour schedule, and booking action', async () => {
  await render(
    <DoctorCard
      id="d1"
      name="Ayesha Khan"
      specialization="Neurology"
      hospital="City Hospital"
      isAvailable
      schedules={[{ id: 's1', day: 'MONDAY', start: '09:00', end: '13:00' }]}
      bookingHref="/appointments?doctorId=d1"
    />
  );

  expect(screen.getByText('Ayesha Khan')).toBeOnTheScreen();
  expect(screen.getByText('Neurology')).toBeOnTheScreen();
  expect(screen.getByText('City Hospital')).toBeOnTheScreen();
  expect(screen.getByText('Available')).toBeOnTheScreen();
  expect(screen.getByText('Monday')).toBeOnTheScreen();
  expect(screen.getByText('9:00 AM - 1:00 PM')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Book Appointment' })).toBeOnTheScreen();
  expect(screen.getByLabelText('/appointments?doctorId=d1')).toBeOnTheScreen();
  expect(screen.queryByText(/rating|review|fee/i)).not.toBeOnTheScreen();
});

test('shows unavailable status without hiding doctor', async () => {
  await render(
    <DoctorCard
      id="d2"
      name="Ayesha Khan"
      isAvailable={false}
      bookingHref="/appointments?doctorId=d2"
    />
  );

  expect(screen.getByText('Ayesha Khan')).toBeOnTheScreen();
  expect(screen.getByText('Unavailable')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Book Appointment' })).not.toBeOnTheScreen();
});

test('uses initials when photo is absent, and never pairs a missing-schedule label with an active Book action', async () => {
  await render(
    <DoctorCard id="d2" name="Ayesha Khan" bookingHref="/appointments?doctorId=d2" />
  );

  expect(screen.getByText('AK')).toBeOnTheScreen();
  expect(screen.queryByText('Schedule not available')).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Book Appointment' })).toBeOnTheScreen();
});
