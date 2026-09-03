-- DropIndex
DROP INDEX "staff_invitations_department_id_idx";

-- AlterTable
ALTER TABLE "staff_invitations" ALTER COLUMN "position" DROP DEFAULT;
