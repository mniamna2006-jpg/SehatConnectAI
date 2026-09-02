import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useHospitalAuth } from '../../../../providers/HospitalAuthProvider';
import { useHospitalLoginViewModel } from '../useHospitalLoginViewModel';
import { ApiError } from '../../../../core/api/client';

jest.mock('../../../../providers/HospitalAuthProvider');
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit:
      (submit: (values: { email: string; password: string }) => Promise<void>) => () =>
        submit({ email: 'user@hospital.test', password: 'secret1' }),
    formState: { errors: {}, isSubmitting: false },
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test.each([
  ['ADMIN', '/admin/dashboard'],
  ['STAFF', '/staff/dashboard'],
] as const)('routes a %s login to %s', async (role, destination) => {
  const login = jest.fn().mockResolvedValue({ role });
  (useHospitalAuth as jest.Mock).mockReturnValue({ login });
  const { result } = await renderHook(() => useHospitalLoginViewModel());

  await act(async () => {
    await result.current.onSubmit();
  });

  expect(login).toHaveBeenCalledWith({
    email: 'user@hospital.test',
    password: 'secret1',
  });
  expect(router.replace).toHaveBeenCalledWith(destination);
});

test.each([
  [new ApiError(401, 'raw credentials detail'), 'Email or password is incorrect.'],
  [new ApiError(0, 'Network request failed'), 'Unable to connect to the server. Please try again.'],
  [new ApiError(500, 'raw infrastructure detail'), 'Server is temporarily unavailable. Please try again.'],
])('maps hospital login failure to a safe message', async (failure, expectedMessage) => {
  const login = jest.fn().mockRejectedValue(failure);
  (useHospitalAuth as jest.Mock).mockReturnValue({ login });
  const { result } = await renderHook(() => useHospitalLoginViewModel());

  await act(async () => {
    await result.current.onSubmit();
  });

  expect(result.current.apiError).toBe(expectedMessage);
  expect(router.replace).not.toHaveBeenCalled();
});
