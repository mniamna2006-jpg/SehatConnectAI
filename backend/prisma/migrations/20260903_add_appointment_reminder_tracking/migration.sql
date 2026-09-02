-- Add nullable reminder tracking for idempotent appointment reminders.
ALTER TABLE "appointments" ADD COLUMN "reminder_sent_at" TIMESTAMP(3);
