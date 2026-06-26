# CLAUDE.md — UniControl Next

Esse arquivo contém instruções permanentes para o Claude Code neste projeto.

## Sobre o Projeto

**UniControl** é uma aplicação web para automatizar processos internos de uma empresa.
Este repositório é a **versão 2** do projeto, reconstruída do zero com Next.js e PostgreSQL.
O repositório anterior (`unicontrol/`) serve como referência de implementação — não deve ser modificado.

Stack: **Next.js 16** (App Router) + TypeScript + **Tailwind CSS v4** + **Prisma v6** + PostgreSQL.

> **Atenção — Tailwind v4:** Não existe mais `tailwind.config.js`. Toda configuração de cores e tema fica em `src/app/globals.css` nos blocos `@theme inline` e nas variáveis CSS em `:root` / `.dark`. Classes usam hífens: `bg-sidebar`, `text-foreground`, `border-details-green`, etc.

## Sobre o Desenvolvedor

Pedro é desenvolvedor júnior. Prefere explicações didáticas junto com o código.
Sempre explique o **porquê** das decisões importantes, não só o **o quê**.

## Regras de Trabalho

### Antes de qualquer modificação
- Ler o arquivo antes de editá-lo (nunca editar às cegas)
- Entender o que já existe antes de propor mudanças
- Confirmar com Pedro antes de ações destrutivas ou irreversíveis

### Commits
- **Nunca fazer commit sem Pedro pedir explicitamente**
- Nunca incluir co-autores automáticos (IA ou ferramentas)
- Mensagens de commit em **inglês**, no formato: `type: short description`
- Tipos: `feat`, `fix`, `refactor`, `style`, `docs`

### Código
- Não adicionar funcionalidades além do que foi pedido
- Não refatorar código que não está sendo modificado
- Manter o padrão do projeto: TypeScript strict, Tailwind, React Hook Form + Zod
- Componentes reutilizáveis vão em `src/components/`
- Páginas vão em `src/app/` (App Router do Next.js)
- Rotas de API vão em `src/app/api/`
- Lógica de banco vem em `src/lib/` ou nos próprios route handlers
- Sempre usar o alias `@/` ao invés de caminhos relativos longos

### Documentação — Regra obrigatória
Sempre que uma funcionalidade for criada ou modificada, verificar se precisa ser documentada em `docs/`.
Após implementar qualquer funcionalidade, perguntar a Pedro se deseja documentar antes de avançar.

### Alertas obrigatórios
Sempre avisar Pedro antes de:
- Deletar arquivos
- Fazer push para o repositório remoto
- Modificar configurações de build ou banco de dados
- Qualquer ação que não possa ser desfeita facilmente

## Contexto do Projeto (ler ao iniciar qualquer sessão)

- `docs/para-ia.md` — **ponto de entrada**: visão geral do projeto, módulos, regras de negócio
- `docs/sessoes/contexto-atual.md` — **estado vivo**: onde o projeto está agora, próximos passos

## Referência de UI — OBRIGATÓRIO antes de criar qualquer componente

Antes de criar qualquer componente, página ou layout, ler:

- `docs/reference/styles/tailwind.config.js` — paleta de cores customizada do projeto
- `docs/reference/styles/index.css` — variáveis CSS (tokens de cor para light/dark mode)
- `docs/reference/components/MainLayout.tsx` — estrutura do layout principal (sidebar + header + conteúdo)
- `docs/reference/components/Sidebar.tsx` — sidebar com nav items e logo
- `docs/reference/components/SidebarItem.tsx` — item de navegação ativo/inativo
- `docs/reference/components/Header.tsx` — header com título e menu do usuário
- `docs/reference/components/Button.tsx` — padrão de botão
- `docs/reference/components/Input.tsx` — padrão de input com label e erro
- `docs/reference/components/ExamplePage.tsx` — exemplo completo de página com tabela
- `docs/reference/components/ExampleModal.tsx` — exemplo de modal com formulário

### Assets disponíveis
- `docs/reference/assets/unicontrol-logo-light.svg` — logo branca (para fundo escuro)
- `docs/reference/assets/unicontrol-logo-dark.svg` — logo escura (para fundo claro)
- `docs/reference/assets/logo-unicontrol.svg` — ícone/favicon

### Fonte
O projeto usa **Inter** (Google Fonts). No Next.js, usar `next/font/google`.

### Biblioteca de tabelas
**Não usar MUI DataGrid.** Usar **TanStack Table** com estilo Tailwind (ou Shadcn/ui DataTable).
O projeto anterior usava MUI DataGrid — a migração intencional é para algo visualmente melhor.

**Padrão obrigatório de responsividade em tabelas:**
Toda tabela deve ter dois modos de exibição:
- **Desktop (`md:` pra cima):** tabela horizontal convencional (`<table>`)
- **Mobile (abaixo de `md:`):** lista de cards — cada linha vira um card com os campos empilhados verticalmente

Nunca esconder colunas no mobile como solução — o usuário perde informação. O card mobile deve exibir todos os dados relevantes da linha.

### Desenvolvimento mobile-first — Regra obrigatória
Todo componente, página e layout deve funcionar bem em mobile **e** desktop.
- Começar sempre pelo layout mobile e expandir com breakpoints (`md:`, `lg:`)
- Testar mentalmente o fluxo em tela pequena antes de considerar pronto
- Elementos de toque devem ter área mínima de 44×44px (botões, links, ícones clicáveis)
- Modais e drawers devem ocupar tela cheia ou quase no mobile
- Inputs e selects devem ter tamanho legível sem zoom (mínimo `text-base` no mobile)

### Tema dark
O projeto está sendo construído com suporte a **dark mode** desde o início.
Dark mode é ativado pela classe `.dark` no `<html>` (já configurado via `@custom-variant dark` no globals.css).
As variáveis CSS em `globals.css` já têm equivalentes para dark mode (`:root` e `.dark`).

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript strict |
| Estilo | Tailwind CSS v4 |
| Componentes | Shadcn/ui (base) |
| Tabelas | TanStack Table |
| Formulários | React Hook Form + Zod |
| ORM | Prisma |
| Banco | PostgreSQL (VPS própria) |
| Autenticação | NextAuth.js |
| Ícones | Lucide React |
| Gráficos | Recharts |
| Notificações | Sonner |

## Modelo Multi-tenant

Cada empresa tem dados isolados. Todo acesso ao banco deve filtrar por `companyId` do usuário autenticado.
Nunca retornar dados sem esse filtro — é o erro mais grave que pode acontecer no sistema.

Detalhes da arquitetura de dados: `docs/arquitetura.md`

## Documentação de Negócio

- `docs/regras-de-negocio.md` — regras consolidadas (RN-01 a RN-18+)
- `docs/glossario.md` — termos específicos da empresa
- `docs/arquitetura.md` — estrutura de dados e decisões arquiteturais
- `docs/fluxos/vendas.md` — fluxo do setor de vendas
- `docs/fluxos/expedicao.md` — fluxo do setor de expedição
- `docs/fluxos/administrativo-financeiro.md` — fluxo financeiro
- `docs/sessoes/` — logs de cada sessão de trabalho

**Antes de implementar qualquer módulo novo, ler os arquivos relevantes em `docs/`.**

### Regra de sessão
Ao encerrar uma sessão (quando Pedro pedir), criar `docs/sessoes/YYYY-MM-DD.md` e atualizar `docs/sessoes/contexto-atual.md`.

## Status dos Módulos

| Módulo | Status |
|---|---|
| Setup inicial (Next.js + Prisma + Auth) | 🔲 Pendente |
| Schema do banco (Prisma) | 🔲 Pendente |
| Autenticação (NextAuth) | 🔲 Pendente |
| Layout principal (Sidebar + Header) | 🔲 Pendente |
| Dashboard | 🔲 Pendente |
| Gestão de Mercadorias | 🔲 Pendente |
| Contas a Pagar | 🔲 Pendente |
| Gestão de Endereços | 🔲 Pendente |
| Documentos Úteis | 🔲 Pendente |
| Gerenciar Usuários | 🔲 Pendente |
| Pendências (Clientes + Fornecedores) | 🔲 Pendente |
| Cadastros (Clientes + Fornecedores) | 🔲 Pendente |
| Estoque | 🔲 Pendente |
| Relatórios | 🔲 Pendente |
| Configurações | 🔲 Pendente |
