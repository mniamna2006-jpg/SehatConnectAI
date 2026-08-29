import React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useLocationSelector } from '../../core/location/useLocationSelector';

export function LocationPicker({ selector }: { selector: ReturnType<typeof useLocationSelector> }) {
  const { mode, permissionDenied, locationUnavailable, isRequestingGps, manualCity, requestGpsLocation, setManualCity } =
    selector;

  return (
    <View>
      <Pressable testID="use-current-location" onPress={requestGpsLocation} disabled={isRequestingGps}>
        {isRequestingGps ? <ActivityIndicator /> : <Text>Use Current Location</Text>}
      </Pressable>
      {(permissionDenied || locationUnavailable) && (
        <Text testID="location-notice">
          Couldn't use your location. Search by city instead.
        </Text>
      )}
      <TextInput
        testID="manual-city-input"
        placeholder="e.g. Gulshan-e-Iqbal, Karachi"
        value={manualCity}
        onChangeText={setManualCity}
      />
      <Text testID="location-mode">{mode}</Text>
    </View>
  );
}
