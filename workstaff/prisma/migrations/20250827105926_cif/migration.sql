/*
  Warnings:

  - Added the required column `cif` to the `CompanyProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CompanyProfile" ADD COLUMN     "cif" TEXT NOT NULL;
