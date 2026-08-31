import { queryClient } from '../queryClient';

test('queryClient retries once and has a 30s stale time for queries', () => {
  const defaults = queryClient.getDefaultOptions();
  expect(defaults.queries?.retry).toBe(1);
  expect(defaults.queries?.staleTime).toBe(30_000);
});
