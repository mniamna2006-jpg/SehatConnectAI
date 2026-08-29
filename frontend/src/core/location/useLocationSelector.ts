import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationMode = 'gps' | 'manual';

export function useLocationSelector() {
  const [mode, setMode] = useState<LocationMode>('manual');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [manualCity, setManualCityState] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const [isRequestingGps, setIsRequestingGps] = useState(false);

  const requestGpsLocation = useCallback(async () => {
    setIsRequestingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
      setLocationUnavailable(false);
      try {
        const position = await Location.getCurrentPositionAsync({});
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setMode('gps');
      } catch {
        // GPS unavailable or timed out: surface a non-blocking notice and
        // leave manual entry usable, same as the permission-denied path.
        setLocationUnavailable(true);
      }
    } finally {
      setIsRequestingGps(false);
    }
  }, []);

  const setManualCity = useCallback((city: string) => {
    setManualCityState(city);
    setMode('manual');
    setCoordinates(null);
  }, []);

  const reset = useCallback(() => {
    setMode('manual');
    setCoordinates(null);
    setManualCityState('');
    setPermissionDenied(false);
    setLocationUnavailable(false);
  }, []);

  return {
    mode,
    coordinates,
    manualCity,
    permissionDenied,
    locationUnavailable,
    isRequestingGps,
    requestGpsLocation,
    setManualCity,
    reset,
  };
}
