import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import type { Doctor } from '../../doctors/model/types';
import { useDepartmentDoctorsViewModel } from '../viewmodels/useDepartmentDoctorsViewModel';

export function DepartmentDoctorsView({ departmentId }: { departmentId: string }) {
  const { doctors, isLoading, isError, refetch } = useDepartmentDoctorsViewModel(departmentId);

  return (
    <Screen>
      <Text accessibilityRole="header">Department Doctors</Text>
      {isLoading ? <LoadingState /> : null}
      {!isLoading && isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && doctors.length === 0 ? (
        <EmptyState message="No doctors found." />
      ) : null}
      {!isLoading && !isError && doctors.length > 0 ? (
        <FlatList
          testID="department-doctors-list"
          data={doctors}
          keyExtractor={(doctor: Doctor) => doctor.doctor_id}
          renderItem={({ item }: { item: Doctor }) => (
            <View testID={`department-doctor-${item.doctor_id}`}>
              <Text>{item.name}</Text>
              {item.specialization ? <Text>{item.specialization}</Text> : null}
              <Link
                href={`/appointments?doctorId=${item.doctor_id}&hospitalId=${item.hospital_id}&departmentId=${item.department_id}`}
                asChild
              >
                <Pressable accessibilityRole="button">
                  <Text>Book Appointment</Text>
                </Pressable>
              </Link>
            </View>
          )}
        />
      ) : null}
    </Screen>
  );
}
