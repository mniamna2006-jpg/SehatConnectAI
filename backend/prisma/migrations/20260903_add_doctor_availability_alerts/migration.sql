-- Add a temporary availability toggle distinct from recurring schedules.
ALTER TABLE "doctors" ADD COLUMN "is_available" BOOLEAN NOT NULL DEFAULT true;

-- Persist patient-owned availability alert subscriptions.
CREATE TABLE "doctor_availability_subscriptions" (
    "subscription_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_availability_subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

CREATE UNIQUE INDEX "doctor_availability_subscriptions_patient_id_doctor_id_key"
ON "doctor_availability_subscriptions"("patient_id", "doctor_id");

CREATE INDEX "doctor_availability_subscriptions_doctor_id_idx"
ON "doctor_availability_subscriptions"("doctor_id");

ALTER TABLE "doctor_availability_subscriptions"
ADD CONSTRAINT "doctor_availability_subscriptions_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_availability_subscriptions"
ADD CONSTRAINT "doctor_availability_subscriptions_doctor_id_fkey"
FOREIGN KEY ("doctor_id") REFERENCES "doctors"("doctor_id")
ON DELETE CASCADE ON UPDATE CASCADE;
