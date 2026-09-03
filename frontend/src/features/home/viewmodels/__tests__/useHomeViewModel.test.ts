import { renderHook } from '@testing-library/react-native';
import { useHomeViewModel } from '../useHomeViewModel';
import { useAuth } from '../../../../providers/AuthProvider';

jest.mock('../../../../providers/AuthProvider');

test('exposes the authenticated patient without a logout action', async () => {
  (useAuth as jest.Mock).mockReturnValue({ user: { full_name: 'Ayesha' }, logout: jest.fn() });

  const { result } = await renderHook(() => useHomeViewModel());

  expect(result.current.user).toEqual({ full_name: 'Ayesha' });
  expect(result.current).not.toHaveProperty('onLogout');
});
