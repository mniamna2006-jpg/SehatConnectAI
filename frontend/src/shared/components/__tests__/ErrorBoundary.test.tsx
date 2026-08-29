import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';

function Bomb(): React.ReactElement {
  throw new Error('boom');
}

test('renders a fallback with a retry action instead of crashing', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  await render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeTruthy();
  await act(() => fireEvent.press(screen.getByText(/try again/i)));
  consoleError.mockRestore();
});

test('renders children normally when nothing throws', async () => {
  await render(
    <ErrorBoundary>
      <Text>fine</Text>
    </ErrorBoundary>
  );

  expect(screen.getByText('fine')).toBeTruthy();
});
