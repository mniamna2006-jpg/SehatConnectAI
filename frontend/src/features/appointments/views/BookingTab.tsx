import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Controller } from 'react-hook-form';
import type { AppointmentPrefill } from '../viewmodels/useAppointmentsViewModel';
import { useAppointmentBookingViewModel } from '../viewmodels/useAppointmentBookingViewModel';

export function BookingTab({ prefill }: { prefill: AppointmentPrefill }) {
  const vm = useAppointmentBookingViewModel(prefill);

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header">Book Appointment</Text>

      <Text>Hospital</Text>
      {vm.isLoadingHospitals ? <ActivityIndicator /> : null}
      {vm.hospitals.map((hospital) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: vm.hospitalId === hospital.hospital_id }}
          key={hospital.hospital_id}
          onPress={() => vm.onSelectHospital(hospital.hospital_id)}
        >
          <Text>{hospital.name}</Text>
        </Pressable>
      ))}
      {vm.errors.hospital_id ? <Text>{vm.errors.hospital_id.message}</Text> : null}

      <Text>Department</Text>
      {vm.isLoadingDepartments ? <ActivityIndicator /> : null}
      {vm.departments.map((department) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: vm.departmentId === department.department_id }}
          key={department.department_id}
          onPress={() => vm.onSelectDepartment(department.department_id)}
        >
          <Text>{department.name}</Text>
        </Pressable>
      ))}
      {vm.errors.department_id ? <Text>{vm.errors.department_id.message}</Text> : null}

      <Text>Doctor</Text>
      {vm.isLoadingDoctors ? <ActivityIndicator /> : null}
      {vm.doctors.map((doctor) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: vm.doctorId === doctor.doctor_id }}
          key={doctor.doctor_id}
          onPress={() => vm.onSelectDoctor(doctor.doctor_id)}
        >
          <Text>{doctor.name}</Text>
        </Pressable>
      ))}
      {vm.errors.doctor_id ? <Text>{vm.errors.doctor_id.message}</Text> : null}

      <TextInput
        accessibilityLabel="Appointment date"
        placeholder="YYYY-MM-DD"
        value={vm.selectedDate}
        onChangeText={vm.onSelectDate}
      />
      {vm.isLoadingSlots ? <ActivityIndicator /> : null}
      {!vm.isLoadingSlots && vm.selectedDate && vm.timeSlots.length === 0 ? (
        <Text>No available time slots. Try another date.</Text>
      ) : null}
      {vm.timeSlots.map((slot) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: vm.selectedSlotId === slot.slot_id }}
          key={slot.slot_id}
          onPress={() => vm.onSelectSlot(slot.slot_id)}
        >
          <Text>{slot.start_time} - {slot.end_time}</Text>
        </Pressable>
      ))}
      {vm.errors.slot_id ? <Text>{vm.errors.slot_id.message}</Text> : null}

      <Controller
        control={vm.control}
        name="reason"
        render={({ field }) => (
          <TextInput
            accessibilityLabel="Reason for appointment"
            placeholder="Reason (optional)"
            value={field.value ?? ''}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            multiline
          />
        )}
      />

      {vm.bookingError ? <Text accessibilityRole="alert">{vm.bookingError}</Text> : null}
      {vm.bookingSuccess ? <Text>{vm.bookingSuccess}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={vm.isSubmitting}
        onPress={vm.onSubmit}
      >
        <Text>{vm.isSubmitting ? 'Booking...' : 'Confirm Booking'}</Text>
      </Pressable>
    </ScrollView>
  );
}
