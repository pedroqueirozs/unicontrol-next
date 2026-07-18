-- Garante que o código sequencial do produto (usado pelo bipador em Entrada/Saída)
-- seja único por empresa. Sem isso, dois cadastros feitos ao mesmo tempo podem
-- gerar o mesmo código, e o bipador passaria a resolver o código escaneado para
-- o produto errado.
-- Verificado antes de criar esta migration: não há códigos duplicados nos dados atuais,
-- então este índice único pode ser criado sem precisar corrigir dados existentes antes.
CREATE UNIQUE INDEX "StockProduct_companyId_code_key" ON "StockProduct"("companyId", "code");
