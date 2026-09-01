import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'sehatconnect_auth_token';
const HOSPITAL_TOKEN_KEY = 'sehatconnect_hospital_auth_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getHospitalToken(): Promise<string | null> {
  return SecureStore.getItemAsync(HOSPITAL_TOKEN_KEY);
}

export async function setHospitalToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(HOSPITAL_TOKEN_KEY, token);
}

export async function clearHospitalToken(): Promise<void> {
  await SecureStore.deleteItemAsync(HOSPITAL_TOKEN_KEY);
}
