# Contexto Atual do Projeto

> Arquivo atualizado ao final de cada sessão de trabalho.
> Qualquer IA deve ler este arquivo para saber exatamente onde o projeto está.

**Última atualização:** 2026-07-11
**Sessão mais recente:** deploy na Vercel + melhorias no módulo de Estoque

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

| Role | Acesso |
|---|---|
| `admin` | Tudo |
| `administrativo` | Mesmo acesso do admin |
| `expedicao` | Endereços, Documentos Úteis, Estoque |
| `vendas` | (em definição) |

Helper centralizado em `src/lib/roles.ts` → `isAdminLevel(role)`.

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

---

## Próximos Passos Sugeridos

1. Implementar módulo **Financeiro** (Contas a Pagar)
2. Implementar módulo **Documentos Úteis**
3. Implementar módulo **Relatórios**
4. Definir acesso do cargo `vendas`

---

## Onde Estão as Coisas

- Regras de negócio: `docs/regras-de-negocio.md`
- Arquitetura técnica: `docs/arquitetura.md`
- Fluxos dos setores: `docs/fluxos/`
- Referência de componentes: `docs/reference/components/`
- Referência de estilos: `docs/reference/styles/`
- Logs de sessões: `docs/sessoes/`
