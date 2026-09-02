import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLoginViewModel } from '../useLoginViewModel';
import { useAuth } from '../../../../providers/AuthProvider';
import { router } from 'expo-router';
import { ApiError } from '../../../../core/api/client';

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

test.each([
  [new ApiError(401, 'raw credentials detail'), 'Email or password is incorrect.'],
  [new ApiError(0, 'Network request failed'), 'Unable to connect to the server. Please try again.'],
  [new ApiError(503, 'raw infrastructure detail'), 'Server is temporarily unavailable. Please try again.'],
  [new Error('raw unexpected detail'), 'Unable to sign in. Please try again.'],
])('onSubmit maps login failure to a safe message', async (failure, expectedMessage) => {
  const login = jest.fn().mockRejectedValue(failure);
  (useAuth as jest.Mock).mockReturnValue({ login });

  const { result } = await renderHook(() => useLoginViewModel());
  await act(() => {
    result.current.setValue('email', 'a@b.com');
    result.current.setValue('password', 'wrongpass');
  });
  await act(async () => {
    await result.current.onSubmit();
  });

  await waitFor(() => expect(result.current.apiError).toBe(expectedMessage));
  expect(router.replace).not.toHaveBeenCalled();
});
