# UniControl — Contexto para IA

> Este arquivo é o ponto de entrada para qualquer IA que trabalhe neste projeto.
> Leia este arquivo primeiro, depois consulte os links abaixo conforme necessário.
>
> **Este é o repositório v2** — reconstruído do zero com Next.js + PostgreSQL.
> O repositório original (`unicontrol/`, React + Vite + Firebase) existe como referência de implementação/estilo, mas não deve ser modificado.

---

## O que é o UniControl

Aplicação web SaaS para automatizar processos internos de uma empresa (cliente do Pedro).
Desenvolvido por **Pedro Queiroz**, desenvolvedor júnior.

A empresa usa o sistema para:
- Controlar mercadorias enviadas aos clientes
- Gerenciar contas a pagar (boletos de fornecedores) — ainda não implementado nesta versão
- Gerar etiquetas de endereço (.docx) e etiquetas de estoque (HTML) para impressão
- Controlar estoque de produtos (entrada/saída)
- Gerenciar usuários por setor, com controle de acesso por role

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript strict |
| Estilo | Tailwind CSS v4 |
| Componentes | Shadcn/ui (base) |
| Tabelas | TanStack Table |
| Formulários | React Hook Form + Zod |
| ORM | Prisma v6 |
| Banco | PostgreSQL (VPS própria — Hostinger) |
| Autenticação | NextAuth v5 (Credentials + JWT) |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Notificações | Sonner |
| Documentos | `docx` (etiquetas de endereço), HTML + `jsbarcode`/`qrcode` (etiquetas de estoque) |
| Deploy | Vercel (auto-deploy a cada push no GitHub) |

---

## Modelo de Dados (Multi-tenant SaaS via Prisma/PostgreSQL)

Cada empresa (`Company`) tem dados isolados — toda tabela de negócio tem `companyId`, e toda query **deve** filtrar por ele.

Tabelas principais: `Company`, `User`, `Invite`, `Client`, `Supplier`, `Carrier`, `GoodsShipped`, `Pending`, `StockProduct`, `StockMovement` (+ `Account`/`Session`/`VerificationToken`, exigidas pelo adapter do NextAuth).

Schema completo e comentado: `prisma/schema.prisma`.
Descrição de cada tabela, decisões e fluxos técnicos: [[arquitetura]]

---

## Roles de Usuário

| Role | Acesso |
|---|---|
| `admin` | Todos os módulos |
| `administrativo` | Todos os módulos (hoje tratado como equivalente ao `admin` — `isAdminLevel()` em `src/lib/roles.ts`) |
| `expedicao` | Todos os módulos exceto Financeiro, Configurações e Gerenciar Usuários |
| `vendas` | Todos os módulos exceto Financeiro, Configurações e Gerenciar Usuários |

Detalhes e histórico da decisão: `RN-18` em [[regras-de-negocio]].
Aplicado em duas camadas: `src/components/sidebar.tsx` (esconde item de menu) + `src/proxy.ts` (bloqueia acesso via URL direta — a proteção real).

---

## Status dos Módulos

> Tabela resumida — para o estado vivo e mais recente, sempre confira [[sessoes/contexto-atual]].

| Módulo | Status | Rota |
|---|---|---|
| Dashboard | ✅ Pronto | `/dashboard` |
| Mercadorias Enviadas | ✅ Pronto | `/goods-shipped` |
| Gestão de Endereços | ✅ Pronto | `/address` |
| Estoque | ✅ Pronto | `/stock` |
| Gerenciar Usuários | ✅ Pronto | `/manage-users` |
| Pendências (Clientes + Fornecedores) | ✅ Pronto | `/pendencias` |
| Cadastros (Clientes/Fornecedores) | ✅ Pronto | `/cadastros` |
| Configurações (dados da empresa + logo) | ✅ Pronto | `/settings` |
| Autenticação | ✅ Pronto | `/login`, `/register` |
| Perfil do Usuário | ✅ Pronto | `/profile` |
| Financeiro (Contas a Pagar) | 🚧 Placeholder "em construção" | `/financial` |
| Documentos Úteis | 🚧 Placeholder "em construção" | `/useful-documents` |
| Relatórios | 🚧 Placeholder "em construção" | `/reports` |

---

## Estrutura de Pastas do Projeto

```
src/
  app/
    (app)/        → páginas autenticadas (uma pasta por módulo: stock/, goods-shipped/, cadastros/, etc.)
    (auth)/       → login, register
    api/          → route handlers (uma pasta por recurso)
    rastreio/     → página pública de rastreio (sem login)
  components/     → componentes reutilizáveis (sidebar, header, form-input, etc.)
  lib/            → prisma client, roles.ts, correios.ts, docx-generator.ts
  generated/
    prisma/       → client gerado pelo Prisma (gitignored, gerado a cada build)
  types/          → tipos compartilhados
  auth.ts         → NextAuth completo (Node runtime)
  auth.config.ts  → NextAuth "leve" (Edge-safe — base do auth.ts e do proxy.ts)
  proxy.ts        → equivalente ao middleware.ts (Next.js 16) — auth + controle de acesso por role
prisma/
  schema.prisma   → schema do banco (fonte da verdade dos dados)
  seed.ts         → bootstrap da primeira empresa/admin
docs/
  para-ia.md              → este arquivo (entrada para qualquer IA)
  regras-de-negocio.md    → RN-01 a RN-20+
  arquitetura.md          → tabelas do Prisma, decisões técnicas, fluxos de onboarding
  glossario.md            → termos da empresa
  fluxos/
    vendas.md
    expedicao.md
    administrativo-financeiro.md
  sessoes/
    contexto-atual.md     → estado vivo do projeto (sempre atualizado)
    YYYY-MM-DD.md         → log de cada sessão de trabalho
  reference/
    components/           → referência visual copiada do projeto v1 (não é código deste projeto)
    styles/                → paleta de cores e tokens do projeto v1
```

---

## Como Trabalhar Neste Projeto

- Sempre usar o alias `@/` para imports (ex: `@/components/sidebar`)
- Componentes novos → `src/components/`
- Páginas novas → `src/app/(app)/` (App Router)
- Rotas de API novas → `src/app/api/`
- Padrão: TypeScript strict, Tailwind CSS v4, React Hook Form + Zod
- Nunca fazer commit sem Pedro pedir
- Antes de implementar qualquer módulo, ler os docs relevantes em `docs/`
- Regras completas de trabalho: ver [[../CLAUDE]]

---

## Onde Encontrar Cada Tipo de Informação

| Preciso saber sobre... | Arquivo |
|---|---|
| Regras de negócio da empresa | [[regras-de-negocio]] |
| Estrutura do banco de dados (Prisma) | [[arquitetura]] |
| Como cada setor funciona | [[fluxos/vendas]], [[fluxos/expedicao]], [[fluxos/administrativo-financeiro]] |
| Termos específicos da empresa | [[glossario]] |
| O que foi feito nas últimas sessões / estado atual | [[sessoes/contexto-atual]] |
| Padrões visuais, cores, layout, componentes | [[ui-patterns]] |
| Convenções de código e regras de trabalho | [[../CLAUDE]] |
