-- CreateTable
CREATE TABLE "Kana" (
    "id" TEXT NOT NULL,
    "char" TEXT NOT NULL,
    "romaji" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Kana_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kana_romaji_key" ON "Kana"("romaji");
