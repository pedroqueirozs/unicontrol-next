-- Suporte a estorno de movimentação e ajuste de contagem no módulo de Estoque.
-- Todos os campos são opcionais e não alteram nenhuma linha existente
-- (ficam NULL nos registros já gravados, que continuam sendo entrada/saida normais).
ALTER TABLE "StockMovement" ADD COLUMN "reversalOfId" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN "reversedAt" TIMESTAMP(3);
ALTER TABLE "StockMovement" ADD COLUMN "previousStock" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN "newStock" INTEGER;
