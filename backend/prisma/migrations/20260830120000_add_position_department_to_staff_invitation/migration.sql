-- AlterTable
ALTER TABLE "staff_invitations" ADD COLUMN "position" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "staff_invitations" ADD COLUMN "department_id" UUID;

-- AddForeignKey
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("department_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "staff_invitations_department_id_idx" ON "staff_invitations"("department_id");
