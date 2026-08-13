CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'DIRECTORY');

ALTER TABLE "users"
ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "directoryId" TEXT;

CREATE UNIQUE INDEX "users_directoryId_key" ON "users"("directoryId");
