-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "productCode" INTEGER,
ALTER COLUMN "productSku" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StockProduct" ADD COLUMN     "code" INTEGER,
ALTER COLUMN "sku" DROP NOT NULL;

-- Populate code for existing products: sequential per company, ordered by createdAt
UPDATE "StockProduct" sp
SET "code" = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "companyId" ORDER BY "createdAt") AS row_num
  FROM "StockProduct"
) sub
WHERE sp.id = sub.id;
