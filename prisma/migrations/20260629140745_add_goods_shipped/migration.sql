-- CreateTable
CREATE TABLE "GoodsShipped" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "transporter" TEXT NOT NULL,
    "shippingDate" TIMESTAMP(3) NOT NULL,
    "deliveryForecast" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT NOT NULL,
    "clientCode" TEXT NOT NULL,
    "trackingCodes" TEXT[],
    "notesHistory" JSONB NOT NULL DEFAULT '[]',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsShipped_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoodsShipped_companyId_idx" ON "GoodsShipped"("companyId");

-- AddForeignKey
ALTER TABLE "GoodsShipped" ADD CONSTRAINT "GoodsShipped_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
