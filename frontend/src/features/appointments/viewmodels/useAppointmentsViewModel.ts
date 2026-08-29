import { useState } from 'react';

export type AppointmentTab = 'booking' | 'history' | 'queue';

export interface AppointmentPrefill {
  doctorId?: string;
  hospitalId?: string;
  departmentId?: string;
}

export function useAppointmentsViewModel(prefill: AppointmentPrefill) {
  const [activeTab, setActiveTab] = useState<AppointmentTab>('booking');
  return { activeTab, setActiveTab, prefill };
}
