/*
  Warnings:

  - You are about to drop the `hiragana` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT;

-- DropTable
DROP TABLE "hiragana";

-- CreateTable
CREATE TABLE "kana" (
    "id" TEXT NOT NULL,
    "char" TEXT NOT NULL,
    "romaji" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "kana_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kana_romaji_key" ON "kana"("romaji");
