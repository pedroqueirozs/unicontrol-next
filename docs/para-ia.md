# UniControl — Contexto para IA

> Este arquivo é o ponto de entrada para qualquer IA que trabalhe neste projeto.
> Leia este arquivo primeiro, depois consulte os links abaixo conforme necessário.
>
> **Este é o repositório v2** — reconstruído do zero com Next.js + PostgreSQL.
> O repositório original (`unicontrol/`) existe como referência, mas não deve ser modificado.

---

## O que é o UniControl

Aplicação web SaaS para automatizar processos internos de uma empresa (cliente do Pedro).
Desenvolvido por **Pedro Queiroz**, desenvolvedor júnior.

A empresa usa o sistema para:
- Controlar mercadorias enviadas aos clientes
- Gerenciar contas a pagar (boletos de fornecedores)
- Gerar etiquetas de endereço para envio de pedidos
- Armazenar documentos úteis
- Gerenciar usuários por setor

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Linguagem | TypeScript strict |
| Estilo | Tailwind CSS + Shadcn/ui |
| Tabelas | TanStack Table |
| Formulários | React Hook Form + Zod |
| ORM | Prisma |
| Banco | PostgreSQL (VPS própria) |
| Autenticação | NextAuth.js |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Notificações | Sonner |
| Documentos | docx (geração de .docx no browser) |

---

## Modelo de Dados (Multi-tenant SaaS)

Cada empresa tem dados isolados no Firestore sob `companies/{companyId}`.

```
users/{uid}                          → perfil e role do usuário
invites/{token}                      → convites gerados pelo admin
companies/{companyId}                → dados da empresa (nome, endereço, contato)
companies/{companyId}/goods_shipped  → mercadorias enviadas
companies/{companyId}/financial      → contas a pagar (NFs + boletos)
companies/{companyId}/clients        → cadastro de clientes (fonte central de dados)
companies/{companyId}/suppliers      → cadastro de fornecedores (fonte central de dados)
companies/{companyId}/customers_pending → pendências com clientes
companies/{companyId}/suppliers_pending → pendências com fornecedores
companies/{companyId}/carriers       → transportadoras disponíveis
```

> A coleção `addresses` foi depreciada. Endereços agora são gerados a partir de `clients` e `suppliers`.

Detalhes completos dos campos: [[arquitetura]]

---

## Roles de Usuário

| Role | Acesso |
|---|---|
| `admin` | Todos os módulos |
| `expedicao` | Gestão de Endereços + Documentos Úteis |
| `vendas` | Somente perfil (módulos ainda não implementados) |

---

## Status dos Módulos

| Módulo | Status | Rota |
|---|---|---|
| Dashboard | ✅ Pronto | `/dashboard` |
| Gestão de Mercadorias | ✅ Pronto | `/goods-shipped` |
| Contas a Pagar | ✅ Pronto | `/financial` |
| Gestão de Endereços | ✅ Pronto | `/address` |
| Documentos Úteis | ✅ Pronto | `/useful-documents` |
| Autenticação | ✅ Pronto | `/login`, `/register`, `/reset-password` |
| Perfil do Usuário | ✅ Pronto | `/profile` |
| Gerenciar Usuários | ✅ Pronto | `/manage-users` |
| Pendências (Clientes + Fornecedores) | ✅ Pronto | `/pendencias` |
| Cadastros (Clientes/Fornecedores) | ✅ Pronto | `/cadastros` |
| Relatórios | 🔧 Placeholder | `/reports` |
| Configurações | ✅ Pronto | `/settings` |

---

## Estrutura de Pastas do Projeto

```
src/
  components/     → componentes reutilizáveis
  pages/          → uma pasta por módulo
  hooks/          → hooks customizados (useAuth, useDashboardStats)
  context/        → AuthContext
  routes/         → AppRoutes, PrivateRoutes, PublicRoutes, RoleRoute
  services/       → firebaseConfig.ts
  utils/          → DocxGenerator, formatCurrency, formatDate, notify, situations
docs/
  para-ia.md              → este arquivo (entrada para qualquer IA)
  regras-de-negocio.md    → RN-01 a RN-18
  arquitetura.md          → Firestore, decisões técnicas, fluxos de onboarding
  glossario.md            → termos da empresa
  fluxos/
    vendas.md
    expedicao.md
    administrativo-financeiro.md
  sessoes/
    contexto-atual.md     → estado vivo do projeto (sempre atualizado)
    YYYY-MM-DD.md         → log de cada sessão de trabalho
```

---

## Como Trabalhar Neste Projeto

- Sempre usar o alias `@/` para imports (ex: `@/components/Button`)
- Componentes novos → `src/components/`
- Páginas novas → `src/pages/`
- Padrão: TypeScript strict, Tailwind, React Hook Form + Yup
- Nunca fazer commit sem Pedro pedir
- Antes de implementar qualquer módulo, ler os docs relevantes em `docs/`
- Regras completas de trabalho: ver [[../CLAUDE]]

---

## Onde Encontrar Cada Tipo de Informação

| Preciso saber sobre... | Arquivo |
|---|---|
| Regras de negócio da empresa | [[regras-de-negocio]] |
| Estrutura do banco de dados | [[arquitetura]] |
| Como cada setor funciona | [[fluxos/vendas]], [[fluxos/expedicao]], [[fluxos/administrativo-financeiro]] |
| Termos específicos da empresa | [[glossario]] |
| O que foi feito nas últimas sessões | [[sessoes/contexto-atual]] |
| Padrões visuais, cores, layout, componentes | [[ui-patterns]] |
| Convenções de código e regras de trabalho | [[../CLAUDE]] |
