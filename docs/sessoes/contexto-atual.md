# Contexto Atual do Projeto

> Arquivo atualizado ao final de cada sessão de trabalho.
> Qualquer IA deve ler este arquivo para saber exatamente onde o projeto está.

**Última atualização:** 2026-07-23
**Sessão mais recente:** correção do ícone ao instalar o UniControl como app no PC/celular — antes não existia Web App Manifest e a logo ficava desproporcional/cortada pela máscara do sistema operacional.

---

## Contexto da Migração

Este repositório é a **versão 2** do UniControl, reconstruída do zero com Next.js + PostgreSQL.

O projeto anterior (`unicontrol/`) foi desenvolvido com React + Vite + Firebase e está **completo e funcional**. A decisão de recriar do zero foi motivada por:
- Aprendizado de backend (Next.js API Routes + PostgreSQL)
- Eliminar dependência de cartão de crédito pessoal no Firebase
- Stack mais moderna e alinhada ao mercado

---

## Estado de Produção

O sistema está **em produção** desde julho de 2026:
- **Frontend/API:** Vercel (deploy automático a cada push no GitHub)
- **Banco de dados:** PostgreSQL na VPS própria (`82.25.75.171`)
- **Dados reais:** 2137 produtos importados via CSV, empresa e usuários cadastrados

---

## Estado dos Módulos

| Módulo | Estado |
|---|---|
| Setup inicial (Next.js + Prisma + NextAuth) | ✅ Concluído |
| Schema do banco (Prisma) | ✅ Concluído |
| Autenticação (login, convite, registro) | ✅ Concluído |
| Layout principal (Sidebar + Header) | ✅ Concluído |
| Dashboard | ✅ Concluído |
| Gestão de Mercadorias | ✅ Concluído |
| Gestão de Endereços | ✅ Concluído |
| Gerenciar Usuários | ✅ Concluído |
| Pendências (Clientes + Fornecedores) | ✅ Concluído |
| Cadastros (Clientes + Fornecedores) | ✅ Concluído |
| Estoque | ✅ Concluído |
| Configurações (dados da empresa + logo) | ✅ Concluído |
| Financeiro | 🚧 Placeholder "em construção" |
| Documentos Úteis | 🚧 Placeholder "em construção" |
| Relatórios | 🚧 Placeholder "em construção" |

---

## Papéis (Roles)

Decisão de 2026-07-16: com a empresa ainda pequena, `expedicao` e `vendas` passaram a ter acesso a quase todos os módulos.

| Role | Acesso |
|---|---|
| `admin` | Tudo |
| `administrativo` | Mesmo acesso do admin |
| `expedicao` | Tudo, exceto Financeiro, Configurações e Gerenciar Usuários |
| `vendas` | Tudo, exceto Financeiro, Configurações e Gerenciar Usuários |

Helper centralizado em `src/lib/roles.ts` → `isAdminLevel(role)`.
**Proteção real é em `src/proxy.ts`** (bloqueia acesso direto por URL aos módulos restritos) — a sidebar (`components/sidebar.tsx`) só esconde o item de menu, não é a camada de segurança. Detalhes: `RN-18` em `docs/regras-de-negocio.md`.

---

## Detalhes Técnicos Importantes

### Logo da empresa
- Salva como **base64** no campo `logoUrl` da tabela `Company`
- Não usa filesystem — funciona na Vercel
- API: `src/app/api/company/logo/route.ts`

### Etiquetas de Estoque
- Geradas como **HTML em nova janela** com unidades em mm
- Tamanhos: Pequena (88mm), Média (130mm), Grande (175mm)
- Arquivo: `src/app/(app)/stock/label-print-modal.tsx`

### Estoque — Performance
- 2137 produtos em produção
- Paginação client-side de **50 itens por página** em `products-tab.tsx`
- Dados completos ficam em memória (necessário para Saída/Entrada)

### Build na Vercel
- `package.json` → `"build": "prisma generate && next build"`
- O diretório `src/generated/prisma` está no `.gitignore` e é gerado no servidor a cada deploy

### Importação de Produtos
- Script: `scripts/import-products.ts`
- Arquivo CSV: `products-import.csv` (na raiz, ignorado pelo git)
- Comando: `npx tsx scripts/import-products.ts` ou `--limpar` para reimportar do zero
- SKUs preservam zeros à esquerda (ex: `00140`) para compatibilidade com sistema antigo

### Rastreio de encomendas (Mercadorias Enviadas)
- **Correios:** integração real com a API oficial (CWS / SRO-Rastro), não é só um link — `src/lib/correios.ts` autentica e consulta eventos de rastreio de verdade.
  - Credenciais em variáveis de ambiente: `CORREIOS_USUARIO`, `CORREIOS_CODIGO_ACESSO`, `CORREIOS_CONTRATO` (já cadastradas na Vercel, Production, marcadas como Sensitive).
  - Token é gerado e cacheado pelo próprio servidor (validade ~24h) — não precisa gerar token manualmente no dia a dia, só se as credenciais forem trocadas.
  - Rota interna: `GET /api/correios/track?codigo=...` (autenticada).
- **Página pública de rastreio:** `src/app/rastreio/[id]/page.tsx` — acessível **sem login** (liberada em `src/proxy.ts`, categoria `ALWAYS_PUBLIC_ROUTES`). URL usa o ID interno do envio, não o código dos Correios.
  - Correios: mostra a linha do tempo real (origem → destino de cada evento).
  - Outras transportadoras (ex: Braspress): mostra link externo pro site da transportadora, pré-preenchido com a NF.
- Botão "Rastrear" e "Copiar link de rastreio" (na tabela e no modal de detalhe) decidem o destino automaticamente pela transportadora — `getTrackButtonUrl()` em `goods-shipped/page.tsx`.

### Favicon
- O `favicon.ico` original era o placeholder padrão do `create-next-app` (nunca tinha sido trocado) — por isso aparecia o triângulo da Vercel em vez da logo em alguns navegadores/dispositivos.
- Corrigido: `favicon.ico` (multi-tamanho) e `apple-icon.png` gerados a partir da logo real, declarados explicitamente em `src/app/layout.tsx`.

### Ícone ao instalar como app / PWA (2026-07-23)
- **Problema relatado por Pedro:** ao instalar o UniControl como app no PC (Chrome/Edge "Instalar app") e no celular ("Adicionar à tela de início"), o ícone ficava feio, desproporcional e cortado.
- **Causa:** o projeto não tinha nenhum Web App Manifest (`manifest.json`/`manifest.webmanifest`). Sem manifest, o navegador improvisa um ícone ao instalar, e o `apple-icon.png` existente tinha a logo colada nas bordas do canvas (sem margem) — a máscara que o SO aplica ao instalar (círculo no Android, cantos arredondados no iOS/Windows) cortava a logo.
- **Correção:**
  - Criado `src/app/manifest.ts` (convenção do Next — servido automaticamente em `/manifest.webmanifest`), com nome, cor de tema (`#2B3D4F`, o mesmo azul da sidebar) e ícones em 192px/512px, incluindo a variante `maskable`.
  - Regenerados `src/app/apple-icon.png`, `public/icons/icon-192.png` e `public/icons/icon-512.png`: a marca (as 3 barrinhas) recriada com ~20% de margem em todos os lados sobre fundo sólido `#2B3D4F` — margem suficiente pra sobreviver a qualquer máscara de ícone do SO.
  - `src/app/layout.tsx` agora referencia o manifest e declara `viewport.themeColor` + `appleWebApp` para uma experiência melhor como app instalado.
- **Decisão de escopo:** o favicon/ícone do app é sempre a marca UniControl, igual pra todas as empresas — não muda por tenant nem depois do login (é definido uma única vez no layout raiz). Ficou de fora dessa mudança a personalização por empresa (logo/nome próprios pós-login), que foi avaliada mas descartada por Pedro por enquanto.

### Busca em Mercadorias Enviadas
- Filtro de texto livre em `goods-shipped/page.tsx`, combinado com as abas de situação (Todos/No Prazo/Atrasadas/Entregues).
- Busca por nome do cliente, NF, cidade, transportadora, código do cliente ou código de rastreio.

### Integridade do Estoque (2026-07-18)
- **Saída de estoque** (`movements/out/route.ts`) usa `updateMany` condicional (`WHERE currentStock >= quantidade`) dentro de transação — evita estoque negativo em saídas simultâneas do mesmo produto.
- **Entrada de estoque** (`movements/in/route.ts`) aceita o lote inteiro (`items: []`) numa única transação atômica, mesmo padrão da saída — antes era uma requisição por produto em loop, sem atomicidade entre itens.
- **Código do produto** tem constraint única no banco (`@@unique([companyId, code])`, migration `20260718033248_stock_product_code_unique`) — sem isso, dois cadastros simultâneos podiam gerar o mesmo código e o bipador de Entrada/Saída resolveria pro produto errado. `POST /api/stock/products` recalcula e tenta de novo automaticamente em caso de colisão.
- Detalhes completos da investigação e das correções: `docs/sessoes/2026-07-18.md`.

### Estorno e Ajuste de Estoque (2026-07-18)
- **Estorno** (`POST /api/stock/movements/[id]/reverse`): reverte um lançamento de entrada/saída errado, criando um movimento `type: "estorno"` vinculado (`reversalOfId`) e marcando o original como `reversedAt`. Qualquer operador estorna dentro de 24h; depois disso, só `admin`/`administrativo` (`isAdminLevel()`). Botão "Estornar" na aba Histórico.
- **Ajuste** (`POST /api/stock/movements/adjust`): corrige o `currentStock` para bater com a contagem física, registrando um movimento `type: "ajuste"` com `previousStock`/`newStock` e motivo obrigatório. Livre para todos os papéis (mesmo nível de Entrada/Saída). Ícone "Ajustar estoque" por produto na aba Estoque.
- Detalhes: `docs/sessoes/2026-07-18.md` (Parte 2) e `RN-21` em `docs/regras-de-negocio.md`.
- **Bloqueio de exclusão com estoque:** produto com `currentStock > 0` não pode ser excluído (`DELETE /api/stock/products/[id]` retorna 422) — o modal de exclusão detecta isso e oferece "Ajustar estoque" em vez de excluir. Produto zerado exclui normal. Detalhes: `docs/sessoes/2026-07-18.md` (Parte 3) e `RN-22`.
- **Histórico paginado + saldo rastreável:** `GET /api/stock/movements` pagina de verdade (`page`/`pageSize`/`type`, sem mais o limite fixo de 200). Toda movimentação (entrada/saída/estorno/ajuste) grava `previousStock`/`newStock` — o histórico mostra "Saldo (antes → depois)" pra qualquer tipo. `history-tab.tsx` busca seus próprios dados (não depende mais de `page.tsx`). As 62 movimentações antigas foram recalculadas via `scripts/backfill-movement-balances.ts` (idempotente, sempre roda em modo simulação por padrão — só grava com `--apply`). Detalhes: `docs/sessoes/2026-07-18.md` (Parte 4).
- **Texto em caixa alta:** nome/SKU/descrição/unidade do produto e o motivo de Entrada/Saída/Ajuste são normalizados em maiúsculas (cliente + servidor). Só vale pra dados novos — nada existente foi alterado retroativamente. Detalhes: `docs/sessoes/2026-07-18.md` (Parte 5).

### Carrinho de Entrada/Saída não perde seleção ao trocar de aba (2026-07-21)
- **Problema relatado pelo operador:** ao montar a lista de itens de uma Entrada/Saída, se ele precisasse ir até a aba "Estoque" para conferir algo (ex: nome exato de um produto) antes de continuar, todo o carrinho montado até ali era perdido.
- **Causa:** em `stock/page.tsx`, as abas eram renderizadas condicionalmente (`{activeTab === "entrada" && <MovementInTab />}`), então trocar de aba desmontava o componente e destruía seu estado local (carrinho, motivo, produto selecionado).
- **Correção:** `MovementInTab` e `MovementOutTab` (`stock/movement-in-tab.tsx`, `stock/movement-out-tab.tsx`) agora ficam sempre montadas; a troca de aba só alterna a classe `hidden` (CSS) em vez de desmontar o componente. `ProductsTab` e `HistoryTab` continuam sendo montadas sob demanda, sem necessidade de preservar estado.

### Busca da Saída e padronização do campo de quantidade (2026-07-21)
- **Busca com sugestões na Saída:** antes, o campo de bipagem da Saída só resolvia em match exato (código/SKU) ao apertar Enter, sem mostrar sugestões enquanto digitava. Agora filtra por nome/SKU/código a cada tecla e mostra um dropdown, igual à Entrada. O match exato por código/SKU continua tendo prioridade no Enter (evita ambiguidade quando o operador bipa).
- **Fluxo de seleção mudou na Saída:** antes, bipar/confirmar adicionava direto 1 unidade ao carrinho. Agora segue o mesmo padrão da Entrada: bipar ou digitar+Enter **seleciona** o produto (sem adicionar ainda) e o foco pula automaticamente para o campo de quantidade — o operador pode digitar um número (ex: bipar uma vez e digitar "5") ou usar os botões `+`/`-`, e confirma com Enter ou clicando "+ ADICIONAR". Os botões `+`/`-` que já existiam nas linhas do carrinho (para ajuste depois de adicionado) foram mantidos.
- **Componente novo `QuantityStepper`** (`stock/quantity-stepper.tsx`): campo de quantidade padrão (`[-] [input] [+]`) reutilizado por Entrada e Saída, substituindo o input solto que a Entrada tinha antes.
- **Atalho de teclado:** em ambas as abas, pressionar Enter no campo "Motivo" agora pula o foco direto pro campo de busca/bipagem — pensado para o fluxo com bipador de código de barras conectado.
- Motivação: pedido direto do operador do estoque, que perdia a seleção ao trocar de aba e sentia falta da busca por nome na Saída (só funcionava por código exato antes).

---

## Próximos Passos Sugeridos

1. Implementar módulo **Financeiro** (Contas a Pagar)
2. Implementar módulo **Documentos Úteis**
3. Implementar módulo **Relatórios**

---

## Onde Estão as Coisas

- Regras de negócio: `docs/regras-de-negocio.md`
- Arquitetura técnica: `docs/arquitetura.md`
- Fluxos dos setores: `docs/fluxos/`
- Referência de componentes: `docs/reference/components/`
- Referência de estilos: `docs/reference/styles/`
- Logs de sessões: `docs/sessoes/`
