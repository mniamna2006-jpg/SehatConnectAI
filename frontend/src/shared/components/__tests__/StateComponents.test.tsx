import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { LoadingState } from '../LoadingState';

test('renders loading state with a custom label', async () => {
  await render(<LoadingState label="Finding hospitals…" />);
  expect(screen.getByText('Finding hospitals…')).toBeTruthy();
});

test('renders error state and invokes retry', async () => {
  const onRetry = jest.fn();
  await render(<ErrorState onRetry={onRetry} />);

  await act(() => fireEvent.press(screen.getByText('Try again')));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('renders the supplied empty-state message', async () => {
  await render(<EmptyState message="No hospitals found." />);
  expect(screen.getByText('No hospitals found.')).toBeTruthy();
});
