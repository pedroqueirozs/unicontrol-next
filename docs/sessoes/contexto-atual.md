# Contexto Atual do Projeto

> Arquivo atualizado ao final de cada sessão de trabalho.
> Qualquer IA deve ler este arquivo para saber exatamente onde o projeto está.

**Última atualização:** 2026-06-25
**Sessão mais recente:** setup inicial completo

---

## Contexto da Migração

Este repositório é a **versão 2** do UniControl, reconstruída do zero com Next.js + PostgreSQL.

O projeto anterior (`unicontrol/`) foi desenvolvido com React + Vite + Firebase e está **completo e funcional**. A decisão de recriar do zero foi motivada por:
- Aprendizado de backend (Next.js API Routes + PostgreSQL)
- Eliminar dependência de cartão de crédito pessoal no Firebase
- Stack mais moderna e alinhada ao mercado

O repositório anterior continua existindo como **referência de implementação** — lógica de negócio, componentes visuais e fluxos já validados podem ser consultados lá.

---

## Estado dos Módulos

| Módulo | Estado |
|---|---|
| Setup inicial (Next.js + Prisma + NextAuth) | ✅ Concluído |
| Schema do banco (Prisma) | 🔲 Não iniciado |
| Autenticação (login, convite, reset senha) | 🔲 Não iniciado |
| Layout principal (Sidebar + Header) | 🔲 Não iniciado |
| Dashboard | 🔲 Não iniciado |
| Gestão de Mercadorias | 🔲 Não iniciado |
| Contas a Pagar | 🔲 Não iniciado |
| Gestão de Endereços | 🔲 Não iniciado |
| Documentos Úteis | 🔲 Não iniciado |
| Gerenciar Usuários | 🔲 Não iniciado |
| Pendências (Clientes + Fornecedores) | 🔲 Não iniciado |
| Cadastros (Clientes + Fornecedores) | 🔲 Não iniciado |
| Estoque | 🔲 Não iniciado |
| Relatórios | 🔲 Não iniciado |
| Configurações | 🔲 Não iniciado |

---

## Próximos Passos

1. Configurar `DATABASE_URL` no `.env` com a conexão real do PostgreSQL da VPS
2. Definir o schema Prisma completo (`prisma/schema.prisma`)
3. Rodar `npx prisma migrate dev` para criar as tabelas
4. Implementar autenticação (NextAuth v5)
5. Implementar layout base (Sidebar + Header)
6. Implementar módulos um por um (começar pelo Dashboard)

---

## Decisões Tomadas

- **Framework:** Next.js 16 com App Router
- **Banco:** PostgreSQL na VPS própria do Pedro
- **ORM:** Prisma v6 (config em `prisma.config.ts`, não mais inline no `schema.prisma`)
- **Auth:** NextAuth.js v5 (beta) — nova API com App Router nativo
- **Tabelas:** TanStack Table — padrão obrigatório: tabela no desktop, cards no mobile
- **Tailwind:** v4 — sem `tailwind.config.js`; cores em `src/app/globals.css` via `@theme inline`
- **Dark mode:** classe `.dark` no `<html>`, variáveis CSS já definidas em `globals.css`
- **Formulários:** React Hook Form + Zod
- **Notificações:** Sonner

---

## Onde Estão as Coisas

- Regras de negócio: [[../regras-de-negocio]]
- Arquitetura técnica (modelo de dados): [[../arquitetura]]
- Padrões visuais e UI: [[../ui-patterns]]
- Referência de componentes do projeto anterior: `docs/reference/components/`
- Referência de estilos (cores, fontes): `docs/reference/styles/`
- Fluxos dos setores: [[../fluxos/vendas]], [[../fluxos/expedicao]], [[../fluxos/administrativo-financeiro]]
- Entrada para IA: [[../para-ia]]
