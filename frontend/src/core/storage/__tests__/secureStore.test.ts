import * as SecureStore from 'expo-secure-store';
import {
  clearHospitalToken,
  clearToken,
  getHospitalToken,
  getToken,
  setHospitalToken,
  setToken,
} from '../secureStore';

jest.mock('expo-secure-store');

beforeEach(() => {
  jest.clearAllMocks();
});

test('setToken/getToken/clearToken proxy to SecureStore under one fixed key', async () => {
  await setToken('abc123');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sehatconnect_auth_token', 'abc123');

  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('abc123');
  await expect(getToken()).resolves.toBe('abc123');

  await clearToken();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sehatconnect_auth_token');
});

test('hospital token operations use a separate SecureStore key from the patient token', async () => {
  await setHospitalToken('hospital-token');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
    'sehatconnect_hospital_auth_token',
    'hospital-token'
  );

  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('hospital-token');
  await expect(getHospitalToken()).resolves.toBe('hospital-token');

  await clearHospitalToken();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
    'sehatconnect_hospital_auth_token'
  );
  expect(SecureStore.deleteItemAsync).not.toHaveBeenCalledWith('sehatconnect_auth_token');
});
