/*
  Warnings:

  - You are about to drop the column `referenceAt` on the `market_prices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bulletinId,productCode,productName,unit]` on the table `market_prices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bulletinId` to the `market_prices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `market_prices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `market_prices` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "market_prices_productName_referenceAt_idx";

-- AlterTable
ALTER TABLE "market_prices" DROP COLUMN "referenceAt",
ADD COLUMN     "bulletinId" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "classification" TEXT,
ADD COLUMN     "groupName" TEXT,
ADD COLUMN     "normalizedName" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "productCode" TEXT,
ADD COLUMN     "subCategory" TEXT,
ADD COLUMN     "unitCode" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "variation" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "market_bulletins" (
    "id" TEXT NOT NULL,
    "referenceAt" TIMESTAMP(3) NOT NULL,
    "market" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_bulletins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_bulletins_referenceAt_idx" ON "market_bulletins"("referenceAt");

-- CreateIndex
CREATE INDEX "market_bulletins_market_idx" ON "market_bulletins"("market");

-- CreateIndex
CREATE UNIQUE INDEX "market_bulletins_referenceAt_market_key" ON "market_bulletins"("referenceAt", "market");

-- CreateIndex
CREATE INDEX "market_prices_bulletinId_idx" ON "market_prices"("bulletinId");

-- CreateIndex
CREATE INDEX "market_prices_productName_idx" ON "market_prices"("productName");

-- CreateIndex
CREATE INDEX "market_prices_normalizedName_idx" ON "market_prices"("normalizedName");

-- CreateIndex
CREATE INDEX "market_prices_category_idx" ON "market_prices"("category");

-- CreateIndex
CREATE INDEX "market_prices_productCode_idx" ON "market_prices"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "market_prices_bulletinId_productCode_productName_unit_key" ON "market_prices"("bulletinId", "productCode", "productName", "unit");

-- AddForeignKey
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_bulletinId_fkey" FOREIGN KEY ("bulletinId") REFERENCES "market_bulletins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
