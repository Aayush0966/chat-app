/*
  Warnings:

  - Added the required column `accountType` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('GOOGLE', 'FACEBOOK', 'CREDENTIALS', 'GITHUB');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "accountType" "AccountType" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verificationOTP" TEXT;
