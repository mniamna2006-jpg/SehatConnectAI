import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AdminLayout from '../../../../app/(hospital)/admin/_layout';
import StaffLayout from '../../../../app/(hospital)/staff/_layout';
import { useHospitalAuth } from '../../../providers/HospitalAuthProvider';

jest.mock('../../../providers/HospitalAuthProvider');
jest.mock('expo-router', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');

  return {
    Redirect: ({ href }: { href: string }) =>
      ReactModule.createElement(NativeText, null, `redirect:${href}`),
    Stack: () => ReactModule.createElement(NativeText, null, 'role-stack'),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('admin routes render only for an admin session', async () => {
  (useHospitalAuth as jest.Mock).mockReturnValue({ hospitalUser: { role: 'ADMIN' } });

  await render(<AdminLayout />);

  expect(screen.getByText('role-stack')).toBeOnTheScreen();
});

test('staff sessions entering admin routes are redirected to the staff dashboard', async () => {
  (useHospitalAuth as jest.Mock).mockReturnValue({ hospitalUser: { role: 'STAFF' } });

  await render(<AdminLayout />);

  expect(screen.getByText('redirect:/staff/dashboard')).toBeOnTheScreen();
});

test('staff routes render only for a staff session', async () => {
  (useHospitalAuth as jest.Mock).mockReturnValue({ hospitalUser: { role: 'STAFF' } });

  await render(<StaffLayout />);

  expect(screen.getByText('role-stack')).toBeOnTheScreen();
});

test('admin sessions entering staff routes are redirected to the admin dashboard', async () => {
  (useHospitalAuth as jest.Mock).mockReturnValue({ hospitalUser: { role: 'ADMIN' } });

  await render(<StaffLayout />);

  expect(screen.getByText('redirect:/admin/dashboard')).toBeOnTheScreen();
});
