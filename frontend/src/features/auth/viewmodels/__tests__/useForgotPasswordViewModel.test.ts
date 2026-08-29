import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useForgotPasswordViewModel } from '../useForgotPasswordViewModel';

test('onSubmit sets submitted true after the adapter resolves', async () => {
  const { result } = await renderHook(() => useForgotPasswordViewModel());
  await act(() => {
    result.current.setIdentifier('a@b.com');
  });
  await act(async () => {
    await result.current.onSubmit();
  });
  await waitFor(() => expect(result.current.submitted).toBe(true));
});
