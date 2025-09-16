-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_workerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_workerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CompanyProfile" DROP CONSTRAINT "CompanyProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Contract" DROP CONSTRAINT "Contract_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Contract" DROP CONSTRAINT "Contract_jobId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Contract" DROP CONSTRAINT "Contract_workerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseProgress" DROP CONSTRAINT "CourseProgress_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseProgress" DROP CONSTRAINT "CourseProgress_workerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Job" DROP CONSTRAINT "Job_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_workerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WorkerProfile" DROP CONSTRAINT "WorkerProfile_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."CompanyProfile" ADD CONSTRAINT "CompanyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseProgress" ADD CONSTRAINT "CourseProgress_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseProgress" ADD CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
