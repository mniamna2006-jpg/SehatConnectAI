import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../../core/query/testUtils';
import { useHospitalAuth } from '../../../../../providers/HospitalAuthProvider';
import { createInvitation, getInvitations, revokeInvitation } from '../../model/api';
import { getDepartments } from '../../../departments/model/api';
import { useInvitationsViewModel } from '../useInvitationsViewModel';

jest.mock('../../../../../providers/HospitalAuthProvider');
jest.mock('../../model/api');
jest.mock('../../../departments/model/api');

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

const invitation = {
  invitation_id: 'i1',
  hospital_id: 'h1',
  email: 'newstaff@hospital.test',
  employee_id: 'E-2',
  position: 'Receptionist',
  department_id: null,
  status: 'PENDING' as const,
  expires_at: '2026-09-09T00:00:00.000Z',
  created_at: '2026-09-02T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useHospitalAuth as jest.Mock).mockReturnValue({ hospitalUser: { hospital: { hospital_id: 'h1' } } });
  (getDepartments as jest.Mock).mockResolvedValue([]);
});

test('loads invitations for the admin hospital', async () => {
  (getInvitations as jest.Mock).mockResolvedValue([invitation]);

  const { result } = await renderHook(() => useInvitationsViewModel(), { wrapper });

  await waitFor(() => expect(result.current.invitations).toHaveLength(1));
  expect(getInvitations).toHaveBeenCalledWith('h1');
});

test('creates an invitation with the entered fields', async () => {
  (getInvitations as jest.Mock).mockResolvedValue([]);
  (createInvitation as jest.Mock).mockResolvedValue(invitation);

  const { result } = await renderHook(() => useInvitationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(() => result.current.openCreate());
  await act(() => {
    result.current.setValue('email', 'NewStaff@Hospital.test');
    result.current.setValue('employee_id', 'E-2');
    result.current.setValue('position', 'Receptionist');
  });

  await act(async () => {
    await result.current.onSubmit();
  });

  expect(createInvitation).toHaveBeenCalledWith({
    hospital_id: 'h1',
    email: 'newstaff@hospital.test',
    employee_id: 'E-2',
    position: 'Receptionist',
    department_id: undefined,
  });
  expect(result.current.formOpen).toBe(false);
  expect(result.current.successMessage).toBe('Invitation sent.');
});

test('surfaces the backend message when create fails', async () => {
  (getInvitations as jest.Mock).mockResolvedValue([]);
  (createInvitation as jest.Mock).mockRejectedValue(new Error('A pending invitation already exists for this email at this hospital'));

  const { result } = await renderHook(() => useInvitationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(() => result.current.openCreate());
  await act(() => {
    result.current.setValue('email', 'newstaff@hospital.test');
    result.current.setValue('employee_id', 'E-2');
    result.current.setValue('position', 'Receptionist');
  });

  await act(async () => {
    await result.current.onSubmit();
  });

  expect(result.current.apiError).toBe('A pending invitation already exists for this email at this hospital');
  expect(result.current.formOpen).toBe(true);
});

test('confirmRevoke asks for confirmation then revokes on confirm', async () => {
  (getInvitations as jest.Mock).mockResolvedValue([invitation]);
  (revokeInvitation as jest.Mock).mockResolvedValue({ ...invitation, status: 'REVOKED' });
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
    buttons?.find((button) => button.style === 'destructive')?.onPress?.();
  });

  const { result } = await renderHook(() => useInvitationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.invitations).toHaveLength(1));

  await act(() => result.current.confirmRevoke(invitation));

  expect(alertSpy).toHaveBeenCalled();
  await waitFor(() => expect(revokeInvitation).toHaveBeenCalledWith('i1'));
  await waitFor(() => expect(result.current.successMessage).toBe('Invitation revoked.'));
});

test('surfaces the backend message when revoke fails', async () => {
  (getInvitations as jest.Mock).mockResolvedValue([invitation]);
  (revokeInvitation as jest.Mock).mockRejectedValue(new Error('Cannot revoke an invitation with status ACCEPTED'));
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
    buttons?.find((button) => button.style === 'destructive')?.onPress?.();
  });

  const { result } = await renderHook(() => useInvitationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.invitations).toHaveLength(1));
  await act(() => result.current.confirmRevoke(invitation));

  await waitFor(() => expect(result.current.apiError).toBe('Cannot revoke an invitation with status ACCEPTED'));
});
