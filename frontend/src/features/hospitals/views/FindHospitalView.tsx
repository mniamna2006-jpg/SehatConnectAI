import React from 'react';
import { Text, FlatList, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { Screen } from '../../../shared/components/Screen';
import { LocationPicker } from '../../../shared/components/LocationPicker';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { useFindHospitalViewModel } from '../viewmodels/useFindHospitalViewModel';
import type { Hospital } from '../model/types';

export function FindHospitalView() {
  const { hospitals, isLoading, isError, refetch, selector } = useFindHospitalViewModel();

  return (
    <Screen>
      <Text accessibilityRole="header">Find Hospital</Text>
      <LocationPicker selector={selector} />

      {isLoading && <LoadingState />}
      {!isLoading && isError && <ErrorState onRetry={() => void refetch()} />}
      {!isLoading && !isError && hospitals.length === 0 && (
        <EmptyState message="No hospitals found." />
      )}
      {!isLoading && !isError && hospitals.length > 0 && (
        <FlatList
          testID="find-hospital-list"
          data={hospitals}
          keyExtractor={(item: Hospital) => item.hospital_id}
          renderItem={({ item }: { item: Hospital }) => (
            <Link href={`/hospital/${item.hospital_id}`} asChild>
              <Pressable accessibilityRole="button" testID={`hospital-row-${item.hospital_id}`}>
                <Image
                  source={item.logo_url ? { uri: item.logo_url } : undefined}
                  placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                  style={{ width: 48, height: 48 }}
                  contentFit="cover"
                />
                <Text testID={`hospital-name-${item.hospital_id}`}>{item.name}</Text>
                {item.city && <Text testID={`hospital-city-${item.hospital_id}`}>{item.city}</Text>}
                {item.distance_km !== undefined && (
                  <Text testID={`hospital-distance-${item.hospital_id}`}>
                    {item.distance_km.toFixed(1)} km
                  </Text>
                )}
              </Pressable>
            </Link>
          )}
        />
      )}
    </Screen>
  );
}
