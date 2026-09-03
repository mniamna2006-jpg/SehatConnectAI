import { fireEvent, render, screen } from '@testing-library/react-native';
import { useDoctorsViewModel } from '../../viewmodels/useDoctorsViewModel';
import { DoctorsView } from '../DoctorsView';

jest.mock('../../viewmodels/useDoctorsViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

const doctor = {
  doctor_id: 'doctor-1',
  hospital_id: 'hospital-1',
  department_id: 'department-1',
  department_name: 'Cardiology',
  name: 'Dr. Amina Shah',
  specialization: 'Cardiology',
  qualification: 'FCPS',
  license_number: 'PMC-1001',
  bio: null,
  consultation_fee: '2500.00',
  is_active: true,
  is_available: true,
};

function mockViewModel(overrides: Record<string, unknown> = {}) {
  (useDoctorsViewModel as jest.Mock).mockReturnValue({
    doctors: [doctor],
    doctorRows: [doctor],
    departments: [{ department_id: 'department-1', name: 'Cardiology' }],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    control: {},
    errors: {},
    isSubmitting: false,
    setValue: jest.fn(),
    editing: null,
    formOpen: false,
    apiError: null,
    successMessage: null,
    openCreate: jest.fn(),
    openEdit: jest.fn(),
    closeForm: jest.fn(),
    onSubmit: jest.fn(),
    confirmDeactivate: jest.fn(),
    openSchedules: jest.fn(),
    setAvailability: jest.fn(),
    updatingDoctorId: undefined,
    deactivatingId: undefined,
    ...overrides,
  });
}

beforeEach(() => jest.clearAllMocks());

test('shows persisted availability and toggles it through view model', async () => {
  const setAvailability = jest.fn();
  mockViewModel({ setAvailability });
  await render(<DoctorsView />);

  const toggle = screen.getByRole('switch', { name: 'Dr. Amina Shah: Available' });
  expect(toggle).toBeChecked();
  await fireEvent(toggle, 'valueChange', false);

  expect(setAvailability).toHaveBeenCalledWith(doctor, false);
});

test('shows update progress and disables duplicate availability actions', async () => {
  mockViewModel({ updatingDoctorId: 'doctor-1' });
  await render(<DoctorsView />);

  expect(screen.getByText('Updating...')).toBeOnTheScreen();
  expect(screen.getByRole('switch', { name: 'Dr. Amina Shah: Available' })).toBeDisabled();
});

test('keeps a deactivated doctor unavailable and disables its toggle', async () => {
  const inactiveDoctor = { ...doctor, is_active: false, is_available: true };
  mockViewModel({ doctors: [inactiveDoctor], doctorRows: [inactiveDoctor] });
  await render(<DoctorsView />);

  expect(screen.getByText('Unavailable')).toBeOnTheScreen();
  expect(screen.getByRole('switch', { name: 'Dr. Amina Shah: Unavailable' })).toBeDisabled();
});
