import React from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../../shared/components/Screen';
import { LocationPicker } from '../../../shared/components/LocationPicker';
import type { DoctorDetail } from '../model/types';
import { useFindDoctorViewModel } from '../viewmodels/useFindDoctorViewModel';

function DoctorResult({ doctor }: { doctor: DoctorDetail }) {
  const bookingHref = `/appointments?doctorId=${doctor.doctor_id}&hospitalId=${doctor.hospital_id}&departmentId=${doctor.department_id}`;

  return (
    <View testID={`doctor-row-${doctor.doctor_id}`}>
      <Text>{doctor.name}</Text>
      {doctor.specialization ? <Text>{doctor.specialization}</Text> : null}
      <Text>{doctor.hospital.name}</Text>
      <Text>Available Days</Text>
      <Text>Available Timings</Text>
      {doctor.schedules.length > 0 ? (
        doctor.schedules.map((schedule) => (
          <View key={schedule.schedule_id}>
            <Text>{schedule.day_of_week}</Text>
            <Text>{schedule.start_time} - {schedule.end_time}</Text>
          </View>
        ))
      ) : (
        <Text>No schedule available.</Text>
      )}
      <Link href={bookingHref} asChild>
        <Pressable accessibilityRole="button">
          <Text>Book Appointment</Text>
        </Pressable>
      </Link>
    </View>
  );
}

export function FindDoctorView() {
  const { doctors, isLoading, isError, query, setQuery, selector } =
    useFindDoctorViewModel();
  const hasQuery = query.trim().length > 0;

  return (
    <Screen>
      <Text accessibilityRole="header">Find Doctor</Text>
      <LocationPicker selector={selector} />
      <TextInput
        accessibilityLabel="Search doctors"
        placeholder="Doctor name or specialty"
        value={query}
        onChangeText={setQuery}
      />

      {isLoading ? <Text testID="find-doctor-loading">Loading...</Text> : null}
      {!isLoading && isError ? (
        <Text testID="find-doctor-error">Something went wrong.</Text>
      ) : null}
      {!isLoading && !isError && hasQuery && doctors.length === 0 ? (
        <Text testID="find-doctor-empty">No doctors found.</Text>
      ) : null}
      {!isLoading && !isError && doctors.length > 0 ? (
        <FlatList
          testID="find-doctor-list"
          data={doctors}
          keyExtractor={(doctor) => doctor.doctor_id}
          renderItem={({ item }) => <DoctorResult doctor={item} />}
        />
      ) : null}
    </Screen>
  );
}
