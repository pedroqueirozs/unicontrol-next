-- CreateTable
CREATE TABLE "Pending" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "document" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "updates" JSONB NOT NULL DEFAULT '[]',
    "clientId" TEXT,
    "supplierId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pending_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pending_companyId_idx" ON "Pending"("companyId");

-- AddForeignKey
ALTER TABLE "Pending" ADD CONSTRAINT "Pending_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
