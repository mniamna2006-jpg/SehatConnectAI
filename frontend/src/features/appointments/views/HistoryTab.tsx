import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { Appointment } from '../model/types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import {
  type HistoryFilter,
  useAppointmentHistoryViewModel,
} from '../viewmodels/useAppointmentHistoryViewModel';

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function HistoryTab() {
  const vm = useAppointmentHistoryViewModel();

  return (
    <View>
      <View accessibilityRole="tablist">
        {FILTERS.map((filter) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: vm.filter === filter.id }}
            key={filter.id}
            onPress={() => vm.setFilter(filter.id)}
          >
            <Text>{filter.label}</Text>
          </Pressable>
        ))}
      </View>
      {vm.isLoading ? <LoadingState /> : null}
      {!vm.isLoading && vm.isError ? (
        <ErrorState onRetry={() => void vm.refetch()} />
      ) : null}
      {!vm.isLoading && !vm.isError && vm.appointments.length === 0 ? (
        <EmptyState message="No appointments in this category." />
      ) : null}
      {vm.cancelError ? <ErrorState message={vm.cancelError} /> : null}
      {!vm.isLoading && !vm.isError ? (
        <FlatList
          data={vm.appointments}
          keyExtractor={(appointment: Appointment) => appointment.appointment_id}
          renderItem={({ item }: { item: Appointment }) => {
            const canCancel = item.status === 'BOOKED' || item.status === 'CONFIRMED';
            return (
              <View>
                <Text>{item.doctor?.name ?? item.doctor_id}</Text>
                <Text>{item.hospital?.name ?? item.hospital_id}</Text>
                <Text>{item.appointment_date} {item.appointment_time}</Text>
                <Text>{item.status}</Text>
                <Text>{item.booking_reference}</Text>
                {canCancel ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={vm.isCancelling(item.appointment_id)}
                    onPress={() => void vm.onCancel(item.appointment_id)}
                  >
                    <Text>{vm.isCancelling(item.appointment_id) ? 'Cancelling...' : 'Cancel'}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }}
        />
      ) : null}
    </View>
  );
}
