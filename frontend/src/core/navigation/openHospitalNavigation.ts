import { Linking, Alert, Platform } from 'react-native';

interface HospitalNavigationParams {
  latitude?: number | string | null;
  longitude?: number | string | null;
  address?: string | null;
  city?: string | null;
  hospitalName?: string | null;
}

/**
 * Open Google Maps (or device map app) with directions to a hospital.
 *
 * Uses lat/lng when available, otherwise falls back to the address.
 * Returns true if a URL was opened successfully, false otherwise.
 */
export async function openHospitalNavigation(
  params: HospitalNavigationParams
): Promise<boolean> {
  const { latitude, longitude, address, city, hospitalName } = params;

  const lat = latitude != null ? Number(latitude) : NaN;
  const lng = longitude != null ? Number(longitude) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

  let url: string;

  if (hasCoords) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  } else {
    const parts: string[] = [];
    if (address?.trim()) parts.push(address.trim());
    if (city?.trim()) parts.push(city.trim());
    const query = parts.join(', ');

    if (!query) {
      Alert.alert(
        'Navigation Unavailable',
        'This hospital does not have location information. Please contact the hospital directly.'
      );
      return false;
    }

    url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`;
  }

  // Add the hospital name as a label param (Google Maps supports &destination_place_id but label is simpler)
  if (hospitalName?.trim()) {
    url += `&dir_action=navigate`;
  }

  try {
    const supported = Platform.select({
      web: true,
      default: await Linking.canOpenURL(url),
    });

    if (!supported) {
      // Fallback: open the URL in browser anyway
      const browserUrl = url;
      const browserSupported = await Linking.canOpenURL(browserUrl);
      if (!browserSupported) {
        Alert.alert('Cannot Open Maps', 'Unable to open the map application on this device.');
        return false;
      }
      await Linking.openURL(browserUrl);
      return true;
    }

    await Linking.openURL(url);
    return true;
  } catch (error) {
    Alert.alert(
      'Navigation Error',
      'Could not open directions. Please try again or open Google Maps manually.'
    );
    return false;
  }
}
