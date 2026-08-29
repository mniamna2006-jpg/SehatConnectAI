import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from '../useDebouncedValue';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('returns the initial value immediately', async () => {
  const { result } = await renderHook(() => useDebouncedValue('a', 300));
  expect(result.current).toBe('a');
});

test('only updates after the delay has elapsed', async () => {
  const { result, rerender } = await renderHook(
    ({ value }: { value: string }) => useDebouncedValue(value, 300),
    { initialProps: { value: 'a' } }
  );

  await rerender({ value: 'b' });
  expect(result.current).toBe('a');

  await act(async () => {
    jest.advanceTimersByTime(299);
  });
  expect(result.current).toBe('a');

  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(result.current).toBe('b');
});

test('resets the timer on rapid changes, only committing the latest value', async () => {
  const { result, rerender } = await renderHook(
    ({ value }: { value: string }) => useDebouncedValue(value, 300),
    { initialProps: { value: '2' } }
  );

  await rerender({ value: '20' });
  await act(async () => {
    jest.advanceTimersByTime(200);
  });
  await rerender({ value: '202' });
  await act(async () => {
    jest.advanceTimersByTime(200);
  });
  expect(result.current).toBe('2');

  await act(async () => {
    jest.advanceTimersByTime(100);
  });
  expect(result.current).toBe('202');
});
