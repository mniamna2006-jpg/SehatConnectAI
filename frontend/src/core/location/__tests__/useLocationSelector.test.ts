import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useLocationSelector } from '../useLocationSelector';

jest.mock('expo-location');

test('requestGpsLocation sets coordinates and mode=gps on granted permission', async () => {
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
    coords: { latitude: 24.86, longitude: 67.0 },
  });

  const { result } = await renderHook(() => useLocationSelector());
  await act(async () => {
    await result.current.requestGpsLocation();
  });

  expect(result.current.mode).toBe('gps');
  expect(result.current.coordinates).toEqual({ latitude: 24.86, longitude: 67.0 });
  expect(result.current.permissionDenied).toBe(false);
});

test('requestGpsLocation sets permissionDenied=true on denial, does not clear manual entry', async () => {
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

  const { result } = await renderHook(() => useLocationSelector());
  await act(() => result.current.setManualCity('Karachi'));
  await act(async () => {
    await result.current.requestGpsLocation();
  });

  expect(result.current.permissionDenied).toBe(true);
  expect(result.current.coordinates).toBeNull();
  expect(result.current.manualCity).toBe('Karachi');
});

test('setManualCity switches mode to manual and clears coordinates', async () => {
  const { result } = await renderHook(() => useLocationSelector());
  await act(() => result.current.setManualCity('Lahore'));
  expect(result.current.mode).toBe('manual');
  expect(result.current.coordinates).toBeNull();
});
