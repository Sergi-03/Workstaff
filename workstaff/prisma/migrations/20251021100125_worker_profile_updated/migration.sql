-- AlterTable
ALTER TABLE "public"."WorkerProfile" ADD COLUMN     "certificate" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "workerAvailability" TEXT[] DEFAULT ARRAY[]::TEXT[];
