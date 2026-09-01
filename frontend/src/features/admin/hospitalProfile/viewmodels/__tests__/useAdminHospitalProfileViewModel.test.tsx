import React from 'react';
import { Controller } from 'react-hook-form';
import { Pressable, Text, TextInput } from 'react-native';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../../core/query/testUtils';
import { useHospitalAuth } from '../../../../../providers/HospitalAuthProvider';
import { getAdminHospitalProfile, updateAdminHospitalProfile } from '../../model/api';
import { useAdminHospitalProfileViewModel } from '../useAdminHospitalProfileViewModel';

jest.mock('../../../../../providers/HospitalAuthProvider');
jest.mock('../../model/api');

const hospital = {
  hospital_id: 'h1',
  name: 'City Hospital',
  facility_type: 'HOSPITAL' as const,
  description: null,
  logo_url: 'https://example.com/logo.png',
  cover_image_url: null,
  theme: null,
  phone: '+92 21 111 222 333',
  email: 'ops@cityhospital.test',
  address: 'Main Road',
  city: 'Karachi',
  latitude: 24.8607,
  longitude: 67.0011,
  is_active: true,
};

function ProfileFormHarness() {
  const viewModel = useAdminHospitalProfileViewModel();

  if (viewModel.isLoading) return <Text>Loading</Text>;

  if (!viewModel.isEditing) {
    return (
      <>
        <Text>{viewModel.saveSuccess ? 'Saved' : viewModel.noChanges ? 'Unchanged' : 'Ready'}</Text>
        <Pressable accessibilityRole="button" onPress={viewModel.onEdit}><Text>Edit</Text></Pressable>
      </>
    );
  }

  return (
    <>
      <Controller
        control={viewModel.control}
        name="city"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput accessibilityLabel="City" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      <Pressable accessibilityRole="button" onPress={() => void viewModel.onSave()}><Text>Save</Text></Pressable>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (useHospitalAuth as jest.Mock).mockReturnValue({ hospitalUser: { hospital: { hospital_id: 'h1' } } });
  (getAdminHospitalProfile as jest.Mock).mockResolvedValue(hospital);
});

test('PATCHes only the profile fields changed by the admin', async () => {
  const user = userEvent.setup();
  (updateAdminHospitalProfile as jest.Mock).mockResolvedValue({ ...hospital, city: 'Lahore' });
  await render(<ProfileFormHarness />, { wrapper: TestQueryProvider });

  expect(await screen.findByText('Ready')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Edit' }));
  await user.clear(screen.getByLabelText('City'));
  await user.type(screen.getByLabelText('City'), 'Lahore');
  await user.press(screen.getByRole('button', { name: 'Save' }));

  await waitFor(() => expect(updateAdminHospitalProfile).toHaveBeenCalledWith('h1', { city: 'Lahore' }));
  expect(await screen.findByText('Saved')).toBeOnTheScreen();
});

test('does not send an empty PATCH when no profile values changed', async () => {
  const user = userEvent.setup();
  await render(<ProfileFormHarness />, { wrapper: TestQueryProvider });

  expect(await screen.findByText('Ready')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Edit' }));
  await user.press(screen.getByRole('button', { name: 'Save' }));

  expect(await screen.findByText('Unchanged')).toBeOnTheScreen();
  expect(updateAdminHospitalProfile).not.toHaveBeenCalled();
});
