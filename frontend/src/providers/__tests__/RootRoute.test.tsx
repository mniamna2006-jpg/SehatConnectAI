import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useAuth } from '../AuthProvider';

jest.mock('../AuthProvider');
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
  sessionError = null,
  retrySession = jest.fn(),
}: {
  patient?: { role: 'PATIENT' } | null;
  patientLoading?: boolean;
  sessionError?: 'network' | null;
  retrySession?: () => void;
} = {}) {
  (useAuth as jest.Mock).mockReturnValue({ user: patient, isLoading: patientLoading, sessionError, retrySession });
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

test('root waits while Patient auth restoration is loading', async () => {
  setSessionState({ patientLoading: true });

  await renderRootRoute();

  expect(screen.getByText('Loading…')).toBeOnTheScreen();
  expect(screen.queryByText(/^redirect:/)).not.toBeOnTheScreen();
});

test('root offers a retry instead of redirecting to login when session restore fails offline', async () => {
  const retrySession = jest.fn();
  setSessionState({ sessionError: 'network', retrySession });

  await renderRootRoute();

  expect(screen.queryByText(/^redirect:/)).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
});

test('root route exists for the normal launcher URL', async () => {
  setSessionState();

  await renderRootRoute();

  expect(screen.queryByText('Unmatched Route')).not.toBeOnTheScreen();
});
