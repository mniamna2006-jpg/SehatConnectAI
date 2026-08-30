import { renderHook, act } from '@testing-library/react-native';
import { useHomeViewModel } from '../useHomeViewModel';
import { useAuth } from '../../../../providers/AuthProvider';
import { router } from 'expo-router';

jest.mock('../../../../providers/AuthProvider');
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

test('onLogout calls useAuth().logout and redirects to /login', async () => {
  const logout = jest.fn().mockResolvedValue(undefined);
  (useAuth as jest.Mock).mockReturnValue({ user: { full_name: 'Ayesha' }, logout });

  const { result } = await renderHook(() => useHomeViewModel());
  await act(async () => {
    await result.current.onLogout();
  });

  expect(logout).toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith('/login');
});
