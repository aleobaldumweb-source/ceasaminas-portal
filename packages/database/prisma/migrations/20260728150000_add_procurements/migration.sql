CREATE TYPE "ProcurementStatus" AS ENUM ('DRAFT', 'OPEN', 'UNDER_REVIEW', 'SUSPENDED', 'CLOSED', 'CANCELLED');
CREATE TYPE "ProcurementModality" AS ENUM ('PREGAO_ELETRONICO', 'CONCORRENCIA', 'DISPENSA', 'INEXIGIBILIDADE', 'TOMADA_DE_PRECOS', 'CONVITE', 'OUTRA');

CREATE TABLE "procurements" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "modality" "ProcurementModality" NOT NULL,
  "status" "ProcurementStatus" NOT NULL DEFAULT 'DRAFT',
  "openingAt" TIMESTAMP(3),
  "deadlineAt" TIMESTAMP(3),
  "estimatedValue" DECIMAL(14,2),
  "department" TEXT,
  "contactEmail" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "procurements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procurement_documents" (
  "id" TEXT NOT NULL,
  "procurementId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "procurement_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "procurements_number_key" ON "procurements"("number");
CREATE INDEX "procurements_status_deadlineAt_idx" ON "procurements"("status", "deadlineAt");
CREATE INDEX "procurements_modality_idx" ON "procurements"("modality");
CREATE INDEX "procurements_publishedAt_idx" ON "procurements"("publishedAt");
CREATE INDEX "procurement_documents_procurementId_createdAt_idx" ON "procurement_documents"("procurementId", "createdAt");
ALTER TABLE "procurement_documents" ADD CONSTRAINT "procurement_documents_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
