-- CreateEnum
CREATE TYPE "CarrierType" AS ENUM ('empresa', 'simples');

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "type" "CarrierType" NOT NULL DEFAULT 'simples',
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "stateRegistration" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "trackingUrl" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Carrier_companyId_idx" ON "Carrier"("companyId");

-- AddForeignKey
ALTER TABLE "Carrier" ADD CONSTRAINT "Carrier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
