import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import { getDoctorsByDepartment } from '../../../doctors/model/api';
import { useDepartmentDoctorsViewModel } from '../useDepartmentDoctorsViewModel';

jest.mock('../../../doctors/model/api');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

test('fetches doctors scoped to the given department id', async () => {
  (getDoctorsByDepartment as jest.Mock).mockResolvedValue([
    {
      doctor_id: 'd1',
      hospital_id: 'h1',
      department_id: 'dep1',
      name: 'Dr. Ali',
      is_active: true,
    },
  ]);

  const { result } = await renderHook(
    () => useDepartmentDoctorsViewModel('dep1'),
    { wrapper }
  );
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(getDoctorsByDepartment).toHaveBeenCalledWith('dep1');
  expect(result.current.doctors).toHaveLength(1);
});
