import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useAuth } from '../AuthProvider';
import { useHospitalAuth } from '../HospitalAuthProvider';

jest.mock('../AuthProvider');
jest.mock('../HospitalAuthProvider');
jest.mock('expo-router', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');

  return {
    Redirect: ({ href }: { href: string }) =>
      ReactModule.createElement(NativeText, null, `redirect:${href}`),
  };
});

type RootRouteComponent = React.ComponentType;

let RootRoute: RootRouteComponent | undefined;
try {
  RootRoute = require('../../../app/index').default;
} catch {
  RootRoute = undefined;
}

function setSessionState({
  patient = null,
  patientLoading = false,
  hospitalUser = null,
  hospitalLoading = false,
}: {
  patient?: { role: 'PATIENT' } | null;
  patientLoading?: boolean;
  hospitalUser?: { role: 'ADMIN' | 'STAFF' } | null;
  hospitalLoading?: boolean;
} = {}) {
  (useAuth as jest.Mock).mockReturnValue({ user: patient, isLoading: patientLoading });
  (useHospitalAuth as jest.Mock).mockReturnValue({
    hospitalUser,
    isLoading: hospitalLoading,
  });
}

async function renderRootRoute() {
  expect(RootRoute).toBeDefined();
  if (!RootRoute) return;
  await render(<RootRoute />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('root sends an unauthenticated cold launch to Patient Login', async () => {
  setSessionState();

  await renderRootRoute();

  expect(screen.getByText('redirect:/login')).toBeOnTheScreen();
});

test('root sends an authenticated Patient session to Patient Home', async () => {
  setSessionState({ patient: { role: 'PATIENT' } });

  await renderRootRoute();

  expect(screen.getByText('redirect:/home')).toBeOnTheScreen();
});

test('root sends an authenticated ADMIN session to Admin Dashboard', async () => {
  setSessionState({ hospitalUser: { role: 'ADMIN' } });

  await renderRootRoute();

  expect(screen.getByText('redirect:/admin/dashboard')).toBeOnTheScreen();
});

test('root sends an authenticated STAFF session to Staff Dashboard', async () => {
  setSessionState({ hospitalUser: { role: 'STAFF' } });

  await renderRootRoute();

  expect(screen.getByText('redirect:/staff/dashboard')).toBeOnTheScreen();
});

test.each([
  ['Patient', true, false],
  ['hospital', false, true],
])('root waits while %s auth restoration is loading', async (_scope, patientLoading, hospitalLoading) => {
  setSessionState({ patientLoading, hospitalLoading });

  await renderRootRoute();

  expect(screen.getByText('Preparing your session…')).toBeOnTheScreen();
  expect(screen.queryByText(/^redirect:/)).not.toBeOnTheScreen();
});

test('root route exists for the normal launcher URL', async () => {
  setSessionState();

  await renderRootRoute();

  expect(screen.queryByText('Unmatched Route')).not.toBeOnTheScreen();
});
