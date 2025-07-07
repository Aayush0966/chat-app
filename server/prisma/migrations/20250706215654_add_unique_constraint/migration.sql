/*
  Warnings:

  - A unique constraint covering the columns `[messageId,userId]` on the table `MessageRead` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId", "userId");
