-- AlterTable
ALTER TABLE "public"."CompanyProfile" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."WorkerProfile" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
