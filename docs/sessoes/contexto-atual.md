# Contexto Atual do Projeto

> Arquivo atualizado ao final de cada sessão de trabalho.
> Qualquer IA deve ler este arquivo para saber exatamente onde o projeto está.

**Última atualização:** 2026-07-18
**Sessão mais recente:** conferência crítica do módulo de Estoque (3 condições de corrida corrigidas) + duas funcionalidades novas de correção: Estorno de lançamento e Ajuste de contagem física — testadas por Pedro em produção

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
