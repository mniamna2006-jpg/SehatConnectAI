import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../../shared/components/Screen';
import type { Doctor } from '../../doctors/model/types';
import { useDepartmentDoctorsViewModel } from '../viewmodels/useDepartmentDoctorsViewModel';

export function DepartmentDoctorsView({ departmentId }: { departmentId: string }) {
  const { doctors, isLoading, isError } = useDepartmentDoctorsViewModel(departmentId);

  return (
    <Screen>
      <Text accessibilityRole="header">Department Doctors</Text>
      {isLoading ? <Text testID="department-doctors-loading">Loading...</Text> : null}
      {!isLoading && isError ? (
        <Text testID="department-doctors-error">Something went wrong.</Text>
      ) : null}
      {!isLoading && !isError && doctors.length === 0 ? (
        <Text testID="department-doctors-empty">No doctors found.</Text>
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
