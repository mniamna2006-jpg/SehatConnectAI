import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '../../../shared/components/Screen';
import {
  type AppointmentPrefill,
  type AppointmentTab,
  useAppointmentsViewModel,
} from '../viewmodels/useAppointmentsViewModel';
import { BookingTab } from './BookingTab';
import { HistoryTab } from './HistoryTab';
import { QueueTab } from './QueueTab';

const TABS: { id: AppointmentTab; label: string }[] = [
  { id: 'booking', label: 'Booking' },
  { id: 'history', label: 'History' },
  { id: 'queue', label: 'Queue' },
];

export function AppointmentsView(prefill: AppointmentPrefill) {
  const { activeTab, setActiveTab } = useAppointmentsViewModel(prefill);

  return (
    <Screen>
      <Text accessibilityRole="header">Appointments</Text>
      <View accessibilityRole="tablist">
        {TABS.map((tab) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.id }}
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      {activeTab === 'booking' ? <BookingTab prefill={prefill} /> : null}
      {activeTab === 'history' ? <HistoryTab /> : null}
      {activeTab === 'queue' ? <QueueTab /> : null}
    </Screen>
  );
}
