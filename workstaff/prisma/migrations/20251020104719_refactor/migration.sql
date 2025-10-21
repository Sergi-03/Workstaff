/*
  Warnings:

  - You are about to drop the column `requiredSkills` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `salary` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `availability` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `certificates` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `rolesExperience` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `serviceTypes` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `workHistory` on the `WorkerProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'FILLED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SkillLevel" AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO');

-- AlterTable
ALTER TABLE "public"."Job" DROP COLUMN "requiredSkills",
DROP COLUMN "salary",
ADD COLUMN     "contractType" TEXT NOT NULL DEFAULT 'INDEFINIDO',
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "hoursPerWeek" INTEGER,
ADD COLUMN     "isFlexible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRemote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minimumYearsExperience" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requiredCertificates" TEXT[],
ADD COLUMN     "requiresRelocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "salaryCurrency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "salaryMax" DOUBLE PRECISION,
ADD COLUMN     "salaryMin" DOUBLE PRECISION,
ADD COLUMN     "salaryPeriod" TEXT,
ADD COLUMN     "sector" TEXT NOT NULL DEFAULT 'HOSTELERÍA',
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" "public"."JobStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "urgency" TEXT NOT NULL DEFAULT 'MEDIA',
ADD COLUMN     "viewsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workSchedule" TEXT NOT NULL DEFAULT 'INDEFINIDO';

-- AlterTable
ALTER TABLE "public"."WorkerProfile" DROP COLUMN "availability",
DROP COLUMN "certificates",
DROP COLUMN "experience",
DROP COLUMN "rolesExperience",
DROP COLUMN "serviceTypes",
DROP COLUMN "skills",
DROP COLUMN "workHistory",
ADD COLUMN     "availableFromDate" TIMESTAMP(3),
ADD COLUMN     "expectedSalaryMax" DOUBLE PRECISION,
ADD COLUMN     "expectedSalaryMin" DOUBLE PRECISION,
ADD COLUMN     "experienceDescription" TEXT,
ADD COLUMN     "maxCommuteDistance" INTEGER,
ADD COLUMN     "preferredContractTypes" TEXT[],
ADD COLUMN     "preferredSectors" TEXT[],
ADD COLUMN     "preferredWorkSchedules" TEXT[],
ADD COLUMN     "salaryCurrency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "totalYearsExperience" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "willingToRelocate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Certificate" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "issuedBy" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "fileUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobMatch" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "skillsScore" DOUBLE PRECISION NOT NULL,
    "locationScore" DOUBLE PRECISION NOT NULL,
    "availabilityScore" DOUBLE PRECISION NOT NULL,
    "salaryScore" DOUBLE PRECISION NOT NULL,
    "experienceScore" DOUBLE PRECISION NOT NULL,
    "matchedSkills" JSONB NOT NULL,
    "missingSkills" JSONB NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "meetsMinimumRequirements" BOOLEAN NOT NULL,
    "salaryCompatible" BOOLEAN NOT NULL,
    "locationCompatible" BOOLEAN NOT NULL,
    "availabilityCompatible" BOOLEAN NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "isStale" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobSkillRequirement" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "minimumLevel" "public"."SkillLevel" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "JobSkillRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkHistory" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "skillsUsed" TEXT[],

    CONSTRAINT "WorkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkerAvailability" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isFlexible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkerSkill" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" "public"."SkillLevel" NOT NULL,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Certificate_type_expiryDate_idx" ON "public"."Certificate"("type", "expiryDate");

-- CreateIndex
CREATE INDEX "JobMatch_jobId_overallScore_idx" ON "public"."JobMatch"("jobId", "overallScore");

-- CreateIndex
CREATE INDEX "JobMatch_overallScore_meetsMinimumRequirements_idx" ON "public"."JobMatch"("overallScore", "meetsMinimumRequirements");

-- CreateIndex
CREATE INDEX "JobMatch_workerId_overallScore_idx" ON "public"."JobMatch"("workerId", "overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_jobId_workerId_key" ON "public"."JobMatch"("jobId", "workerId");

-- CreateIndex
CREATE INDEX "JobSkillRequirement_jobId_isRequired_idx" ON "public"."JobSkillRequirement"("jobId", "isRequired");

-- CreateIndex
CREATE UNIQUE INDEX "JobSkillRequirement_jobId_skillId_key" ON "public"."JobSkillRequirement"("jobId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "public"."Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "public"."Skill"("category");

-- CreateIndex
CREATE INDEX "WorkHistory_workerId_startDate_idx" ON "public"."WorkHistory"("workerId", "startDate");

-- CreateIndex
CREATE INDEX "WorkerAvailability_workerId_dayOfWeek_idx" ON "public"."WorkerAvailability"("workerId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "WorkerSkill_level_idx" ON "public"."WorkerSkill"("level");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerSkill_workerId_skillId_key" ON "public"."WorkerSkill"("workerId", "skillId");

-- CreateIndex
CREATE INDEX "Job_location_sector_idx" ON "public"."Job"("location", "sector");

-- CreateIndex
CREATE INDEX "Job_status_createdAt_idx" ON "public"."Job"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Job_urgency_startDate_idx" ON "public"."Job"("urgency", "startDate");

-- AddForeignKey
ALTER TABLE "public"."Certificate" ADD CONSTRAINT "Certificate_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobMatch" ADD CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobMatch" ADD CONSTRAINT "JobMatch_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobSkillRequirement" ADD CONSTRAINT "JobSkillRequirement_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobSkillRequirement" ADD CONSTRAINT "JobSkillRequirement_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkHistory" ADD CONSTRAINT "WorkHistory_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkerAvailability" ADD CONSTRAINT "WorkerAvailability_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkerSkill" ADD CONSTRAINT "WorkerSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkerSkill" ADD CONSTRAINT "WorkerSkill_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
