import { useQuery } from '@tanstack/react-query';
import { getMyAppointments } from '../../appointments/model/api';
import { useAuth } from '../../../providers/AuthProvider';
import { queryKeys } from '../../../shared/constants/queryKeys';
import type { AppointmentStatus } from '../../../shared/types/api';

const UPCOMING_STATUSES: AppointmentStatus[] = ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'];

export function useHomeViewModel() {
  const { user } = useAuth();
  const { data: appointments = [] } = useQuery({ queryKey: queryKeys.myAppointments, queryFn: getMyAppointments });

  const upcomingAppointment = [...appointments]
    .filter((appointment) => UPCOMING_STATUSES.includes(appointment.status))
    .sort((a, b) => `${a.appointment_date}${a.appointment_time}`.localeCompare(`${b.appointment_date}${b.appointment_time}`))[0];

  return { user, upcomingAppointment, hasAppointmentHistory: appointments.length > 0 };
}
