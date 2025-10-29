-- AlterTable
ALTER TABLE "public"."CompanyProfile" ADD COLUMN     "phone" TEXT NOT NULL DEFAULT 'unknown';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "phone" TEXT NOT NULL DEFAULT 'unknown';

-- AlterTable
ALTER TABLE "public"."WorkerProfile" ADD COLUMN     "phone" TEXT NOT NULL DEFAULT 'unknown';
