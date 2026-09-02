import { useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react-native';
import { useAdminHospitalProfileViewModel } from '../../viewmodels/useAdminHospitalProfileViewModel';
import { AdminHospitalProfileView } from '../AdminHospitalProfileView';

jest.mock('../../viewmodels/useAdminHospitalProfileViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

const hospital = {
  hospital_id: 'h1',
  name: 'City Hospital',
  facility_type: 'HOSPITAL',
  description: 'Round-the-clock care',
  logo_url: 'https://example.com/logo.png',
  cover_image_url: null,
  theme: 'blue',
  phone: '+92 21 111 222 333',
  email: 'ops@cityhospital.test',
  address: 'Main Road',
  city: 'Karachi',
  latitude: 24.8607,
  longitude: 67.0011,
  is_active: true,
};

beforeEach(() => jest.clearAllMocks());

function EditingProfileHarness() {
  const { control, formState: { errors } } = useForm({
    defaultValues: {
      name: hospital.name,
      facility_type: hospital.facility_type,
      description: hospital.description ?? '',
      logo_url: hospital.logo_url ?? '',
      cover_image_url: hospital.cover_image_url ?? '',
      theme: hospital.theme ?? '',
      phone: hospital.phone ?? '',
      email: hospital.email ?? '',
      address: hospital.address,
      city: hospital.city,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
    },
  });

  (useAdminHospitalProfileViewModel as jest.Mock).mockReturnValue({
    hospital,
    isLoading: false,
    isError: false,
    isEditing: true,
    control,
    errors,
    onCancel: jest.fn(),
    onSave: jest.fn(),
    isSaving: false,
    saveError: null,
    saveSuccess: false,
    noChanges: false,
  });

  return <AdminHospitalProfileView />;
}

test('shows the loading state while the hospital profile is requested', async () => {
  (useAdminHospitalProfileViewModel as jest.Mock).mockReturnValue({ isLoading: true });

  await render(<AdminHospitalProfileView />);

  expect(screen.getByText('Loading hospital profile…')).toBeOnTheScreen();
});

test('shows an error state when the hospital profile request fails', async () => {
  (useAdminHospitalProfileViewModel as jest.Mock).mockReturnValue({
    isLoading: false,
    isError: true,
    error: new Error('Profile unavailable'),
    refetch: jest.fn(),
  });

  await render(<AdminHospitalProfileView />);

  expect(screen.getByText('Profile unavailable')).toBeOnTheScreen();
});

test('shows only backend-supported profile values and URL actions', async () => {
  (useAdminHospitalProfileViewModel as jest.Mock).mockReturnValue({
    hospital,
    isLoading: false,
    isError: false,
    isEditing: false,
    onEdit: jest.fn(),
    saveSuccess: false,
  });

  await render(<AdminHospitalProfileView />);

  expect(screen.getByRole('header', { name: 'Hospital profile' })).toBeOnTheScreen();
  expect(screen.getByText('City Hospital')).toBeOnTheScreen();
  expect(screen.getByText('Round-the-clock care')).toBeOnTheScreen();
  expect(screen.getByText('https://example.com/logo.png')).toBeOnTheScreen();
  expect(screen.getByText('24.8607, 67.0011')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Edit profile' })).toBeOnTheScreen();
  expect(screen.queryByText(/upload/i)).not.toBeOnTheScreen();
});

test('shows a success state after the profile is updated', async () => {
  (useAdminHospitalProfileViewModel as jest.Mock).mockReturnValue({
    hospital,
    isLoading: false,
    isError: false,
    isEditing: false,
    onEdit: jest.fn(),
    saveSuccess: true,
  });

  await render(<AdminHospitalProfileView />);

  expect(screen.getByRole('alert')).toHaveTextContent(/Hospital profile updated/);
});

test('edits only backend-supported fields and represents images as URLs', async () => {
  await render(<EditingProfileHarness />);

  expect(screen.getByLabelText('Hospital name')).toHaveDisplayValue('City Hospital');
  expect(screen.getByRole('button', { name: 'Hospital', selected: true })).toBeOnTheScreen();
  expect(screen.getByLabelText('Logo URL')).toHaveDisplayValue('https://example.com/logo.png');
  expect(screen.getByLabelText('Cover image URL')).toHaveDisplayValue('');
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeOnTheScreen();
  expect(screen.queryByText(/upload/i)).not.toBeOnTheScreen();
});
