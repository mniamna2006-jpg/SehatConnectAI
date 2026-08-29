import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { useHospitalDetailsViewModel } from '../viewmodels/useHospitalDetailsViewModel';
import type { WorkingHours } from '../model/types';

interface HospitalDetailsViewProps {
  hospitalId: string;
}

export function HospitalDetailsView({ hospitalId }: HospitalDetailsViewProps) {
  const { hospital, isLoading, isError, refetch } = useHospitalDetailsViewModel(hospitalId);

  return (
    <Screen>
      {isLoading && <LoadingState />}
      {!isLoading && isError && <ErrorState onRetry={() => void refetch()} />}
      {!isLoading && !isError && !hospital && (
        <EmptyState message="Hospital not found." />
      )}
      {!isLoading && !isError && hospital && (
        <View>
          <Text accessibilityRole="header" testID="hospital-name">
            {hospital.name}
          </Text>

          {hospital.address && (
            <Text testID="hospital-address">{hospital.address}</Text>
          )}

          {hospital.working_hours && hospital.working_hours.length > 0 && (
            <View testID="hospital-working-hours-section">
              <Text testID="hospital-working-hours-title">Working Hours</Text>
              <FlatList
                testID="hospital-working-hours-list"
                scrollEnabled={false}
                data={hospital.working_hours}
                keyExtractor={(item: WorkingHours, index: number) => `${item.day_of_week}-${index}`}
                renderItem={({ item }: { item: WorkingHours }) => (
                  <Text testID={`working-hours-${item.day_of_week}`}>
                    {item.day_of_week}: {item.open_time} - {item.close_time}
                  </Text>
                )}
              />
            </View>
          )}

          {hospital.departments && hospital.departments.length > 0 && (
            <View testID="hospital-departments-section">
              <Text testID="hospital-departments-title">Departments</Text>
              <FlatList
                testID="hospital-departments-list"
                scrollEnabled={false}
                data={hospital.departments}
                keyExtractor={(item) => item.department_id}
                renderItem={({ item }) => (
                  <Link
                    href={`/find-department?hospitalId=${hospitalId}&departmentId=${item.department_id}`}
                    testID={`department-link-${item.department_id}`}
                  >
                    <Text testID={`department-name-${item.department_id}`}>{item.name}</Text>
                  </Link>
                )}
              />
            </View>
          )}

          {hospital.doctors && hospital.doctors.length > 0 && (
            <View testID="hospital-doctors-section">
              <Text testID="hospital-doctors-title">Doctors</Text>
              <FlatList
                testID="hospital-doctors-list"
                scrollEnabled={false}
                data={hospital.doctors}
                keyExtractor={(item) => item.doctor_id}
                renderItem={({ item }) => (
                  <Link
                    href={`/appointments?doctorId=${item.doctor_id}`}
                    testID={`doctor-link-${item.doctor_id}`}
                  >
                    <Text testID={`doctor-name-${item.doctor_id}`}>{item.name}</Text>
                    {item.specialization && (
                      <Text testID={`doctor-specialization-${item.doctor_id}`}>
                        {item.specialization}
                      </Text>
                    )}
                  </Link>
                )}
              />
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}
