import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useHospitalAuth } from '../../../../providers/HospitalAuthProvider';
import { useHospitalLoginViewModel } from '../useHospitalLoginViewModel';

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
