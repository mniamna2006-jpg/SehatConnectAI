import { act, renderHook } from '@testing-library/react-native';
import { useAppointmentsViewModel } from '../useAppointmentsViewModel';

test('owns hub tab state and preserves appointment prefill params', async () => {
  const prefill = { doctorId: 'd1', hospitalId: 'h1', departmentId: 'dep1' };
  const { result } = await renderHook(() => useAppointmentsViewModel(prefill));

  expect(result.current.activeTab).toBe('booking');
  expect(result.current.prefill).toEqual(prefill);

  await act(() => {
    result.current.setActiveTab('history');
  });
  expect(result.current.activeTab).toBe('history');
});
