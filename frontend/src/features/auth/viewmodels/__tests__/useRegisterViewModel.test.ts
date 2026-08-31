import { renderHook, act } from '@testing-library/react-native';
import { useRegisterViewModel } from '../useRegisterViewModel';
import { useAuth } from '../../../../providers/AuthProvider';
import { router } from 'expo-router';

jest.mock('../../../../providers/AuthProvider');
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
});

test('onSubmit strips confirmPassword and calls useAuth().register with preferred_language', async () => {
  const register = jest.fn().mockResolvedValue(undefined);
  (useAuth as jest.Mock).mockReturnValue({ register });

  const { result } = await renderHook(() => useRegisterViewModel());
  await act(async () => {
    result.current.setValue('full_name', 'Ayesha Khan');
    result.current.setValue('email', 'ayesha@example.com');
    result.current.setValue('password', 'secret12');
    result.current.setValue('confirmPassword', 'secret12');
    result.current.setValue('preferred_language', 'URDU');
  });
  await act(async () => {
    await result.current.onSubmit();
  });

  expect(register).toHaveBeenCalledWith({
    full_name: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: 'secret12',
    preferred_language: 'URDU',
  });
  expect(router.replace).toHaveBeenCalledWith('/home');
});
