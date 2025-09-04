-- AlterTable
ALTER TABLE "public"."WorkerProfile" ADD COLUMN     "location" TEXT,
ADD COLUMN     "rolesExperience" JSONB,
ADD COLUMN     "serviceTypes" TEXT[],
ADD COLUMN     "workHistory" JSONB;
