# UniControl

Aplicação web para automatizar processos internos da empresa (mercadorias enviadas, estoque, cadastros de clientes/fornecedores, endereços, pendências, gerenciamento de usuários). Multi-tenant: cada empresa cadastrada tem seus dados isolados.

Esta é a **v2** do projeto — reconstruída do zero com Next.js + PostgreSQL. O repositório anterior (`unicontrol/`, React + Vite + Firebase) fica como referência de implementação e não deve ser usado em produção.

Documentação completa do projeto (regras de negócio, arquitetura, fluxos, contexto para IA): [`docs/`](docs/para-ia.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma v6 · PostgreSQL · NextAuth v5

## Rodando localmente

Pré-requisitos: Node.js 20+, acesso a um banco PostgreSQL (local ou remoto).

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz com as variáveis abaixo (peça os valores reais de produção a quem já tem acesso — **nunca commitar este arquivo**):
   ```bash
   DATABASE_URL="postgresql://usuario:senha@host:5432/banco"
   AUTH_SECRET="gerar com: npx auth secret"

   # Só necessário para rodar `npm run seed` (bootstrap da primeira empresa/admin)
   SEED_COMPANY_NAME=""
   SEED_COMPANY_CITY=""
   SEED_COMPANY_STATE=""
   SEED_ADMIN_NAME=""
   SEED_ADMIN_EMAIL=""
   SEED_ADMIN_PASSWORD=""

   # Só necessário para o módulo de rastreio dos Correios (src/lib/correios.ts)
   CORREIOS_USUARIO=""
   CORREIOS_CODIGO_ACESSO=""
   CORREIOS_CONTRATO=""
   CORREIOS_DR=""
   ```

3. Aplique as migrations no banco:
   ```bash
   npx prisma migrate dev
   ```

4. (Opcional, só em banco vazio) Crie a primeira empresa e o usuário admin:
   ```bash
   npm run seed
   ```

5. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm run seed` | Cria a primeira empresa + usuário admin (`prisma/seed.ts`) |
| `npx prisma migrate dev` | Aplica migrations pendentes em desenvolvimento |
| `npx prisma studio` | Interface visual para explorar o banco |

## Deploy

- **Frontend/API:** Vercel, deploy automático a cada push na branch `main` do GitHub.
- **Banco de dados:** PostgreSQL em VPS própria (Hostinger) — não gerenciado pela Vercel.
- As variáveis de ambiente de produção (incluindo as credenciais dos Correios, marcadas como *Sensitive*) ficam configuradas diretamente no painel da Vercel.
- `src/generated/prisma` é gitignored e gerado a cada build (`prisma generate` roda antes do `next build`, ver `package.json`).
