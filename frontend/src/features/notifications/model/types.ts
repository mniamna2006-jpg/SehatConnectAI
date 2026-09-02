export type NotificationType =
  | 'BOOKING_CONFIRMATION'
  | 'APPOINTMENT_REMINDER'
  | 'QUEUE_UPDATE'
  | 'DOCTOR_AVAILABILITY'
  | 'CANCELLATION'
  | (string & {});

/** Matches GET /api/notifications/my item shape — flat, no joined relations. */
export interface Notification {
  notification_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_appointment_id: string | null;
  is_read: boolean;
  created_at: string;
}
