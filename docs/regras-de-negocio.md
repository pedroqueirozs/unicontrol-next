# Regras de Negócio — UniControl

Documento consolidado com as regras identificadas a partir do fluxo da empresa.

---

## RN-01 — Cadastro de Produtos
- Novos produtos **devem ser cadastrados pelo contador**, não pelo setor de vendas
- Motivo: particularidades fiscais no cadastro exigem conhecimento contábil

## RN-02 — Endereços por Pedido
- A quantidade de endereços impressos para cada pedido é definida pela **Expedição**, não pelo Administrativo ou Vendas
- O Administrativo só imprime após receber essa informação

## RN-03 — Dimensões das Caixas
- Antes de cotar o frete, a Expedição deve fornecer: **Largura × Comprimento × Altura e Peso** de cada caixa
- Sem esses dados, o Administrativo não consegue cotar corretamente

## RN-04 — Escolha do Frete
- O frete é escolhido pelo **menor valor** entre as opções disponíveis:
  Correios, Transportadora, Ônibus ou Retirada na empresa

## RN-05 — Custo do Frete
- O frete é **custeado pela empresa**
- O cliente paga o valor do frete embutido no pedido (na nota fiscal)
- É adicionada uma **margem de segurança** no valor cobrado para cobrir variações da transportadora

## RN-06 — Variação do Frete
- A transportadora realiza pesagem e cubagem própria e pode cobrar valor diferente da cotação
- Quando o valor cobrado do cliente não cobre o custo real, compensação é feita no mês seguinte

## RN-07 — Pagamento via Pix
- Pedidos pagos via Pix exigem pagamento **antes do envio** do material
- O comprovante deve ser impresso e anexado ao pedido físico

## RN-08 — Pagamento via Boleto
- Boletos são gerados manualmente no site do banco
- Enviados manualmente por e-mail ou WhatsApp
- Nomenclatura do arquivo: `CIDADE NF-01 a 02.pdf`

## RN-09 — Pagamento dos Boletos a Pagar
- O **pagamento** dos boletos de fornecedores/prestadores é realizado pela **proprietária da empresa**
- O setor administrativo apenas controla o recebimento, conferência e arquivamento

## RN-10 — Controle de Fretes Mensal
- Ao final de cada mês, é feito o levantamento de:
  - Valor cobrado do cliente (por NF, por transportador)
  - Valor pago na transportadora
  - Resultado: positivo ou negativo

## RN-11 — Recebimento de Mercadorias
- Na conferência de recebimento: se tudo certo → assina com data e marca "OK"
- Se houver divergência → anota o que faltou para tratativa com o fornecedor

## RN-12 — Emissão de Nota Fiscal
- A NF é emitida pelo setor de **contabilidade** (não pelo administrativo ou vendas)
- Só é emitida após definição do transportador e valor do frete

## RN-13 — Controle de Estoque
- Qualquer solução deve ser **extremamente simples e intuitiva** (desafio cultural)
- Todos os produtos foram cadastrados inicialmente com estoque zerado; a contagem real está sendo feita aos poucos, produto a produto
- Muitos produtos cadastrados não são mais usados e permanecerão zerados por tempo indeterminado
- **Ordenação da listagem:** produtos com estoque (`currentStock > 0`) aparecem primeiro, em ordem alfabética; produtos zerados aparecem depois, também em ordem alfabética. Isso evita que produtos sem movimento (zerados) poluam a primeira página da lista enquanto a contagem de estoque ainda está em andamento. Implementado em `src/app/api/stock/products/route.ts` (GET)

## RN-14 — Previsão de Entrega
- A previsão de entrega deve ser **igual ou posterior à data de envio**
- Não é possível prever entrega antes da mercadoria sair da empresa

## RN-15 — Data de Entrega
- A data de entrega deve ser **igual ou posterior à data de envio**
- Válido tanto para entregas via transportadora quanto para retiradas na empresa

## RN-16 — Regras do Módulo Financeiro

- Uma nota fiscal **deve ter ao menos um boleto** para ser salva
- O **total dos boletos deve ser igual ao valor da nota fiscal** (tolerância de R$ 0,01)
- A **data de emissão** da nota não pode ser futura — deve ser igual ou anterior à data atual
- O **vencimento do boleto** não pode ser anterior à data atual
- Durante a edição, boletos removidos só são excluídos do banco ao confirmar a atualização
- Cancelar a edição restaura o estado original sem alterar nenhum dado
- **Status (2026-07-16):** módulo ainda não implementado nesta versão (placeholder "em construção" em `/financial`) — regras acima valem como especificação para quando for construído

## RN-17 — Remoção de Membros

- Ao remover um membro (`DELETE /api/users/[id]`), o registro do usuário é **excluído imediatamente** da tabela `User` — não há soft-delete
- **Atenção:** como as sessões usam JWT (NextAuth, `session.strategy: "jwt"`) sem revalidação contra o banco a cada requisição, uma sessão já aberta do usuário removido continua funcionando até expirar sozinha (padrão de 30 dias do NextAuth) — a remoção não derruba sessões ativas na hora
- Para readmitir um usuário removido, o admin deve gerar um novo convite

## RN-18 — Roles e Permissões de Acesso

O sistema possui 4 roles de usuário: `admin`, `administrativo`, `expedicao` e `vendas`.

| Módulo | admin | administrativo | expedicao | vendas |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Mercadorias (Gestão de Mercadorias) | ✅ | ✅ | ✅ | ✅ |
| Financeiro (Contas a Pagar) | ✅ | ✅ | ❌ | ❌ |
| Relatórios | ✅ | ✅ | ✅ | ✅ |
| Endereços (Gestão de Endereços) | ✅ | ✅ | ✅ | ✅ |
| Documentos Úteis | ✅ | ✅ | ✅ | ✅ |
| Pendências (Clientes + Fornecedores) | ✅ | ✅ | ✅ | ✅ |
| Estoque | ✅ | ✅ | ✅ | ✅ |
| Cadastros (Clientes/Fornecedores) | ✅ | ✅ | ✅ | ✅ |
| Configurações | ✅ | ✅ | ❌ | ❌ |
| Gerenciar Usuários | ✅ | ✅ | ❌ | ❌ |

- `admin` e `administrativo` têm acesso a todos os módulos — hoje o código trata os dois como equivalentes (`isAdminLevel()` em `src/lib/roles.ts`)
- `expedicao` e `vendas` têm acesso aos módulos operacionais do dia a dia; ficam de fora de Financeiro, Configurações e Gerenciar Usuários
- Decisão de 2026-07-14: com a empresa ainda pequena, `expedicao` e `vendas` passaram a ter acesso a praticamente todos os módulos, restando restritos apenas os 3 módulos administrativos/sensíveis acima
- **Aplicação da regra é em duas camadas** (nenhuma delas é só cosmética):
  - `src/components/sidebar.tsx` — esconde os itens de menu não permitidos (UX)
  - `src/proxy.ts` — bloqueia de fato o acesso via URL direta, redirecionando para `/dashboard` quem tentar entrar em `/financial`, `/settings` ou `/manage-users` sem ser `admin`/`administrativo`
- As APIs que sustentam os módulos restritos (`/api/users`, `/api/invites`, `/api/company`, `/api/company/logo`) também usam `isAdminLevel()` — a proteção não depende só da rota de página
- O role `admin` é o único que pode promover ou rebaixar qualquer usuário da empresa

## RN-19 — Vínculo Obrigatório com Cliente em Mercadorias Enviadas

- Todo registro de mercadoria enviada **deve estar vinculado a um cliente do cadastro**
- Não é possível salvar um envio sem selecionar um cliente previamente cadastrado
- Nome, cidade e UF são preenchidos automaticamente a partir do cadastro e não podem ser editados manualmente
- O cliente pode ser trocado durante a edição (para correção de erros)
- `clientId` e `clientCode` são sempre gravados na tabela `GoodsShipped` junto ao registro

## RN-20 — Cadastro de Clientes e Fornecedores

- O código do cliente/fornecedor é gerado automaticamente no momento do cadastro (`C-001`, `C-002`... para clientes; `F-001`, `F-002`... para fornecedores)
- O CNPJ/CPF é **obrigatório** no cadastro e recebe máscara automática conforme o número de dígitos
- Um mesmo CNPJ pode ter múltiplos cadastros (para clientes com endereços de entrega diferentes)
- A busca nos módulos é feita por nome ou CNPJ/CPF — não mais pelo código

## RN-21 — Correção de Movimentações de Estoque (Estorno e Ajuste)

O histórico de movimentações (`StockMovement`) nunca é editado ou apagado diretamente — é um log de auditoria imutável. Existem duas formas de corrigir um erro, para dois cenários diferentes:

**Estorno** — quando um lançamento específico de entrada ou saída foi feito errado (bipou o produto errado, digitou a quantidade errada):
- Cria automaticamente uma nova movimentação `estorno`, com a direção invertida da original, vinculada a ela (`reversalOfId`)
- O lançamento original é marcado como estornado (`reversedAt`) — continua visível no histórico, não é apagado
- Um lançamento só pode ser estornado **uma vez**; um estorno não pode ser estornado (se o estorno também estiver errado, corrige-se com um novo estorno ou um ajuste)
- **Janela de 24h:** qualquer usuário pode estornar um lançamento (seu ou de outro operador) dentro de 24h da criação. Após esse prazo, só `admin`/`administrativo` pode estornar
- Estornar uma entrada não pode deixar o estoque negativo (se o produto já foi consumido depois da entrada errada, o estorno é bloqueado)

**Ajuste** — quando a contagem física do estoque diverge do sistema, sem saber qual lançamento passado causou a diferença:
- O operador informa a quantidade contada fisicamente e o **motivo é obrigatório**
- O sistema calcula a diferença automaticamente e registra uma movimentação `ajuste`, com o valor anterior e o novo valor (`previousStock`/`newStock`)
- Disponível para todos os papéis com acesso ao Estoque (mesmo nível de acesso de Entrada/Saída — ver RN-18), sem restrição adicional

## RN-22 — Bloqueio de Exclusão de Produto com Estoque

- Um produto **não pode ser excluído** do cadastro enquanto `currentStock > 0`
- Motivo: a mercadoria continua existindo fisicamente no estoque; excluir o cadastro faria esse número sumir do sistema sem nenhum registro de saída, perdendo o rastreamento de algo que ainda está lá
- O bloqueio é validado no servidor (`DELETE /api/stock/products/[id]`) — não é só uma restrição visual
- Quando bloqueado, o modal de exclusão mostra a quantidade parada e oferece diretamente o atalho para **Ajustar estoque** (RN-21), já que zerar via ajuste é o caminho esperado antes de excluir um produto descontinuado
- Produto com estoque zerado (`currentStock === 0`) continua sendo excluído normalmente, com confirmação simples

---

## Problemas e Oportunidades de Melhoria

| # | Problema | Setor | Prioridade |
|---|---|---|---|
| P-01 | ~~Endereços digitados manualmente no Word~~ → **Resolvido:** endereços gerados via cadastro de clientes/fornecedores | Administrativo | ~~Alta~~ |
| P-02 | Sem controle de estoque | Expedição | Alta |
| P-03 | Produtos cadastrados por quem não deveria | Vendas | Média |
| P-04 | Cobrança de duplicatas manual via relatório do banco | Administrativo | Média |
| P-05 | Pedidos físicos arquivados em pastas de papel | Administrativo | Média |
| P-06 | Envio de boletos e NFs feito individualmente e manualmente | Administrativo | Alta |
| P-07 | Controle de pendências em planilhas separadas | Administrativo | Média |
| P-08 | Controle de frete mensal feito manualmente | Administrativo | Média |
