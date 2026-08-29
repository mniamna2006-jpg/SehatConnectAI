import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLoginViewModel } from '../useLoginViewModel';
import { useAuth } from '../../../../providers/AuthProvider';
import { router } from 'expo-router';

jest.mock('../../../../providers/AuthProvider');
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
});

test('onSubmit calls useAuth().login and navigates to /home on success', async () => {
  const login = jest.fn().mockResolvedValue(undefined);
  (useAuth as jest.Mock).mockReturnValue({ login });

  const { result } = await renderHook(() => useLoginViewModel());
  await act(() => {
    result.current.setValue('email', 'a@b.com');
    result.current.setValue('password', 'secret1');
  });
  await act(async () => {
    await result.current.onSubmit();
  });

  expect(login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret1' });
  expect(router.replace).toHaveBeenCalledWith('/home');
});

test('onSubmit surfaces a safe apiError message on failure, does not navigate', async () => {
  const login = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
  (useAuth as jest.Mock).mockReturnValue({ login });

  const { result } = await renderHook(() => useLoginViewModel());
  await act(() => {
    result.current.setValue('email', 'a@b.com');
    result.current.setValue('password', 'wrongpass');
  });
  await act(async () => {
    await result.current.onSubmit();
  });

  await waitFor(() =>
    expect(result.current.apiError).toBe('Unable to sign in. Please check your details and try again.')
  );
  expect(router.replace).not.toHaveBeenCalled();
});

test('onSubmit accepts a phone-only submission (no email)', async () => {
  const login = jest.fn().mockResolvedValue(undefined);
  (useAuth as jest.Mock).mockReturnValue({ login });

  const { result } = await renderHook(() => useLoginViewModel());
  await act(() => {
    result.current.setValue('phone', '03001234567');
    result.current.setValue('password', 'secret1');
  });
  await act(async () => {
    await result.current.onSubmit();
  });

  expect(login).toHaveBeenCalledWith({ phone: '03001234567', password: 'secret1' });
  expect(router.replace).toHaveBeenCalledWith('/home');
});
