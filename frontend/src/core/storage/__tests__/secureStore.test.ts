import * as SecureStore from 'expo-secure-store';
import { getToken, setToken, clearToken } from '../secureStore';

jest.mock('expo-secure-store');

test('setToken/getToken/clearToken proxy to SecureStore under one fixed key', async () => {
  await setToken('abc123');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sehatconnect_auth_token', 'abc123');

  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('abc123');
  await expect(getToken()).resolves.toBe('abc123');

  await clearToken();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sehatconnect_auth_token');
});
