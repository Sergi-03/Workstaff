-- AlterTable
ALTER TABLE "public"."CompanyProfile" ADD COLUMN     "contactPersonName" TEXT NOT NULL DEFAULT 'N/A',
ADD COLUMN     "contactPersonRole" TEXT NOT NULL DEFAULT 'N/A',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fullAddress" TEXT NOT NULL DEFAULT 'N/A',
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "public"."WorkerProfile" ADD COLUMN     "fullAddress" TEXT NOT NULL DEFAULT 'N/A',
ADD COLUMN     "socialSecurityNumber" TEXT NOT NULL DEFAULT 'N/A';
